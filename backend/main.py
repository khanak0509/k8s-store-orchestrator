from dotenv import load_dotenv
import logging
import os
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

load_dotenv()

from database import Base, engine, get_db, SessionLocal
from models import Store, StoreStatus, StoreEngine
from schemas import StoreCreate, StoreResponse
import k8s_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="K8s Store Orchestrator API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import secrets
import string

# Generate cryptographically secure passwords
def generate_password(length=8):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Handles slow K8s operations async
def provision_store_task(store_id: int, name: str, engine_type: str, namespace: str, password: str):
    with SessionLocal() as db:
        store = db.query(Store).filter(Store.id == store_id).first()
        if not store:
            return

        try:
            logger.info(f"[{name}] Starting provisioning in namespace {namespace}...")
            
            if not k8s_service.k8s_create_namespace(namespace):
                raise Exception("Failed to create Kubernetes namespace")

            # Apply Quotas & Network Policy
            k8s_service.k8s_apply_resource_quota(namespace)
            k8s_service.k8s_apply_network_policy(namespace)

            # Helm to install the store
            success, info = k8s_service.k8s_deploy_store(name, engine_type, namespace, password)
            
            if success:
                # Poll until pods are actually ready
                logger.info(f"[{name}] Deployment initiated. Waiting for pods to be Ready...")
                is_ready, reason = k8s_service.k8s_wait_for_ready(namespace)
                if is_ready:
                    # Bootstrap now handled declaratively by postStart lifecycle hook
                    # See values-*.yaml -> lifecycleHooks.postStart
                    
                    store.status = StoreStatus.READY
                    store.url = info
                    logger.info(f"[{name}] Provisioning Complete: {info}")
                else:
                    store.status = StoreStatus.FAILED
                    store.error_message = reason
                    logger.error(f"[{name}] Provisioning failed: {reason}")
            else:
                store.status = StoreStatus.FAILED
                store.error_message = info
                logger.error(f"[{name}] Provisioning Failed: {info}")
                
        except Exception as e:
            logger.exception(f"[{name}] Critical Error")
            store.status = StoreStatus.FAILED
            store.error_message = str(e)
        finally:
            db.commit()

# Delete store
def delete_store_task(store_id: int, name: str, namespace: str):
    with SessionLocal() as db:
        try:
            k8s_service.k8s_delete_store(name, namespace)
            
            store = db.query(Store).filter(Store.id == store_id).first()
            if store:
                db.delete(store)
                db.commit()
                logger.info(f"[{name}] Database record deleted.")
                
        except Exception as e:
            logger.error(f"Error in delete task for {name}: {e}")

@app.get("/")
def health_check():
    return {"status": "Orchestrator is Running"}

# Create Store 
@app.post("/stores", response_model=StoreResponse)
def create_store(
    store_req: StoreCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    if db.query(Store).filter(Store.name == store_req.name).first():
        raise HTTPException(status_code=400, detail="Store name already exists")

    generated_namespace = f"store-{store_req.name}"
    generated_password = generate_password()

    new_store = Store(
        name=store_req.name,
        namespace=generated_namespace,
        engine=store_req.engine,
        status=StoreStatus.PROVISIONING,
        password=generated_password
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)

    background_tasks.add_task(
        provision_store_task, 
        new_store.id, 
        new_store.name, 
        new_store.engine.value,
        new_store.namespace,
        generated_password
    )

    return new_store

@app.get("/stores", response_model=list[StoreResponse])
def list_stores(db: Session = Depends(get_db)):
    return db.query(Store).all()

@app.get("/cluster/health")
def get_cluster_health():
    return k8s_service.k8s_get_cluster_status()

@app.get("/stores/{store_id}/quota")
def get_store_quota(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    quota = k8s_service.k8s_get_namespace_quota(store.namespace)
    if not quota:
        raise HTTPException(status_code=404, detail="Quota not found for this store")
    
    return quota

@app.delete("/stores/{store_id}")
def delete_store(
    store_id: int, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    db_store = db.query(Store).filter(Store.id == store_id).first()
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")

    db_store.status = StoreStatus.DELETING
    db.commit()

    background_tasks.add_task(
        delete_store_task, 
        db_store.id, 
        db_store.name, 
        db_store.namespace
    )
    
    return {"message": "Deletion started"}