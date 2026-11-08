
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class EquipmentCreate(BaseModel):
    equipment_code: str = Field(min_length=1, max_length=50)
    name: str
    department: str
    equipment_type: str
    location: str
    criticality: str


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    equipment_type: Optional[str] = None
    location: Optional[str] = None
    criticality: Optional[str] = None
    is_active: Optional[bool] = None


class EquipmentResponse(BaseModel):
    id: int
    equipment_code: str
    name: str
    department: str
    equipment_type: str
    location: str
    criticality: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
