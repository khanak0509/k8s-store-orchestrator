import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from database import Base
import enum

#  Tracks lifecycle state (Provisioning -> Ready)
class StoreStatus(str, enum.Enum):
    PROVISIONING = "Provisioning"
    READY = "Ready"
    FAILED = "Failed"
    DELETING = "Deleting"

class StoreEngine(str, enum.Enum):
    WOOCOMMERCE = "woocommerce"
    MEDUSA = "medusa"

# Persistence layer for store metadata
class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    namespace = Column(String, unique=True, nullable=False)
    engine = Column(Enum(StoreEngine), nullable=False)
    status = Column(Enum(StoreStatus), default=StoreStatus.PROVISIONING)
    url = Column(String, nullable=True)
    password = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))
    error_message = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, index=True)
    event_type = Column(String)  # e.g., "INFO", "SUCCESS", "FAILURE"
    message = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))