from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Literal
from datetime import datetime
import re

EngineType = Literal["woocommerce", "medusa"]

class StoreBase(BaseModel):
    name: str
    engine: EngineType 

    @field_validator('name')
    def validate_k8s_name(cls, v):
        if not re.match(r'^[a-z0-9]([-a-z0-9]*[a-z0-9])?$', v):
            raise ValueError('Name must be lowercase, alphanumeric, and hyphens only (e.g., my-shop-1)')
        return v

class StoreCreate(StoreBase):
    pass

class StoreUpdate(BaseModel):
    status: Optional[str] = None
    url: Optional[str] = None
    error_message: Optional[str] = None

class StoreResponse(StoreBase):
    id: int
    namespace: str
    status: str
    url: Optional[str] = None
    password: Optional[str] = None
    created_at: datetime
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)