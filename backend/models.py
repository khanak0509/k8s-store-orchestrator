import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from database import Base
import enum

class StoreStatus(str, enum.Enum):
    PROVISIONING = "Provisioning"
    READY = "Ready"
    FAILED = "Failed"
    DELETING = "Deleting"

class StoreEngine(str, enum.Enum):
    WOOCOMMERCE = "woocommerce"
    MEDUSA = "medusa"

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
    error_message = Column(String, nullable=True)