import subprocess
import logging
import os
import shutil

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if not shutil.which("kubectl") or not shutil.which("helm"):
    logger.critical("kubectl or helm is not installed! provisioning will fail.")

def k8s_create_namespace(name: str) -> bool:
    try:
        cmd = ["kubectl", "create", "namespace", name]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Namespace '{name}' created.")
            return True
        elif "already exists" in result.stderr:
            logger.info(f"Namespace '{name}' already exists.")
            return True
        else:
            logger.error(f"Namespace creation failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"System error creating namespace: {e}")
        return False

def k8s_apply_resource_quota(namespace: str):
    try:
        quota_yaml = f"""
apiVersion: v1
kind: ResourceQuota
metadata:
  name: store-quota
  namespace: {namespace}
spec:
  hard:
    requests.cpu: "1000m"
    requests.memory: "1Gi"
    limits.cpu: "2"
    limits.memory: "2Gi"
    pods: "10"
"""
        cmd = ["kubectl", "apply", "-f", "-"]
        subprocess.run(cmd, input=quota_yaml, capture_output=True, text=True, check=True)
        logger.info(f"ResourceQuota applied to {namespace}")
        return True
    except Exception as e:
        logger.error(f"Failed to apply ResourceQuota to {namespace}: {e}")
        return False

def k8s_apply_network_policy(namespace: str):
    try:
        policy_yaml = f"""
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-external
  namespace: {namespace}
spec:
  podSelector: {{}}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {{}} # Allow traffic from within same namespace
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system # Allow system probes
  egress:
  - to:
    - podSelector: {{}} # Allow traffic within same namespace
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system # Allow DNS/System egress
"""
        cmd = ["kubectl", "apply", "-f", "-"]
        subprocess.run(cmd, input=policy_yaml, capture_output=True, text=True, check=True)
        logger.info(f"NetworkPolicy applied to {namespace}")
        return True
    except Exception as e:
        logger.error(f"Failed to apply NetworkPolicy to {namespace}: {e}")
        return False

import time

def k8s_wait_for_ready(namespace: str, timeout: int = 300) -> tuple[bool, str]:
    start_time = time.time()
    last_error = "Timed out waiting for pods to be ready"
    
    while time.time() - start_time < timeout:
        try:
            # 1. Check if pods are ready
            cmd_ready = ["kubectl", "get", "pods", "-n", namespace, "-o", "jsonpath={.items[*].status.containerStatuses[*].ready}"]
            result_ready = subprocess.run(cmd_ready, capture_output=True, text=True)
            
            if result_ready.returncode == 0:
                statuses = result_ready.stdout.split()
                if statuses and all(s == "true" for s in statuses):
                    logger.info(f"All pods in {namespace} are Ready.")
                    return True, "Ready"
            
            # 2. If not ready, check for "Terminal Errors"
            # Check for scheduling errors (like Quota Exceeded)
            cmd_events = ["kubectl", "get", "events", "-n", namespace, "--field-selector", "type=Warning", "-o", "jsonpath={.items[-1:].message}"]
            result_events = subprocess.run(cmd_events, capture_output=True, text=True)
            if result_events.stdout:
                last_error = result_events.stdout
                if "exceeded quota" in last_error.lower():
                    return False, f"Resource Quota Exceeded: {last_error}"

            # Check for container errors (like ImagePullBackOff or CrashLoop)
            cmd_pod_status = ["kubectl", "get", "pods", "-n", namespace, "-o", "jsonpath={.items[*].status.containerStatuses[*].state.waiting.reason}"]
            result_status = subprocess.run(cmd_pod_status, capture_output=True, text=True)
            if result_status.stdout:
                reasons = result_status.stdout.split()
                if any(r in ["ImagePullBackOff", "ErrImagePull", "CrashLoopBackOff"] for r in reasons):
                    return False, f"Deployment Error: {reasons[0]}"

            time.sleep(5)
        except Exception as e:
            logger.error(f"Error checking pod status: {e}")
            time.sleep(5)
    
    logger.error(f"Timeout waiting for pods in {namespace} to be ready.")
    return False, last_error

def k8s_deploy_store(name: str, engine_type: str, namespace: str, password: str = None):
    demo_password = password or os.getenv("DEMO_STORE_PASSWORD", "UrumiRound1Secure!")
    base_domain = os.getenv("BASE_DOMAIN", "127.0.0.1.nip.io")
    is_prod = os.getenv("ENV") == "production"
    
    # Path to our local values
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    values_file = "values-prod.yaml" if is_prod else "values-local.yaml"
    values_path = os.path.join(base_dir, "infra", "helm", engine_type, values_file)

    try:
        command = []
        
        if engine_type == "woocommerce":
            hostname = f"{name}.{base_domain}"
            command = [
                "helm", "upgrade", "--install", name, "oci://registry-1.docker.io/bitnamicharts/wordpress",
                "--namespace", namespace,
                "-f", values_path,
                "--set", f"wordpressPassword={demo_password}",
                "--set", f"mariadb.auth.rootPassword={demo_password}",
                "--set", f"ingress.hostname={hostname}",
            ]
            
        elif engine_type == "medusa":
            hostname = f"{name}.medusa.{base_domain}"
            command = [
                "helm", "upgrade", "--install", name, "oci://registry-1.docker.io/bitnamicharts/nginx",
                "--namespace", namespace,
                "-f", values_path,
                "--set", f"ingress.hostname={hostname}",
            ]
        else:
            return False, f"Unknown engine type: {engine_type}"

        logger.info(f"Deploying {name} to {namespace} with hostname {hostname}...")
        
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            return True, f"http://{hostname}"
        else:
            logger.error(f"Helm failed: {result.stderr}")
            return False, result.stderr

    except Exception as e:
        logger.exception("Deploy function crashed")
        return False, str(e)

def k8s_delete_store(name: str, namespace: str):
    try:
        logger.info(f"Deleting store {name} in namespace {namespace}...")
        
        subprocess.run(
            ["helm", "uninstall", name, "--namespace", namespace], 
            capture_output=True, text=True
        )
        
        subprocess.run(
            ["kubectl", "delete", "namespace", namespace, "--wait=false"],
            capture_output=True, text=True
        )
        return True
    except Exception as e:
        logger.error(f"Failed to delete store {name}: {e}")
        return False