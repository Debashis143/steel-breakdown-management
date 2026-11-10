
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime
# =====================================
# MODULE 1: EQUIPMENT MASTER
# =====================================

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


# =====================================
# MODULE 2: TECHNICIAN MANAGEMENT
# =====================================

# 1. Create Technician Schema
class TechnicianCreate(BaseModel):
    technician_code: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    department: str = Field(min_length=1, max_length=100)
    specialization: str = Field(min_length=1, max_length=150)

    phone_number: Optional[str] = Field(default=None, max_length=15)
    email: Optional[str] = Field(default=None, max_length=150)

    availability_status: Literal[
        "Available", "Busy", "On Leave"
    ] = "Available"


# 2. Update Technician Schema
class TechnicianUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None

    availability_status: Optional[
        Literal["Available", "Busy", "On Leave"]
    ] = None

    is_active: Optional[bool] = None


# 3. Technician Response Schema
class TechnicianResponse(BaseModel):
    id: int
    technician_code: str
    full_name: str
    department: str
    specialization: str
    phone_number: Optional[str]
    email: Optional[str]
    availability_status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)



class BreakdownCreate(BaseModel):
    equipment_id: int
    description: str = Field(min_length=1, max_length=500)
    severity: Literal["Low", "Medium", "High", "Critical"]
    reported_by: str = Field(min_length=1, max_length=150)


class BreakdownUpdate(BaseModel):
    description: Optional[str] = Field(default=None, max_length=500)
    severity: Optional[
        Literal["Low", "Medium", "High", "Critical"]
    ] = None
    reported_by: Optional[str] = Field(default=None, max_length=150)


class BreakdownStatusUpdate(BaseModel):
    status: Literal["Open", "In Progress", "Resolved"]


class BreakdownResponse(BaseModel):
    id: int
    equipment_id: int
    description: str
    severity: str
    reported_by: str
    status: str
    reported_at: datetime

    model_config = ConfigDict(from_attributes=True)

# =====================================
# MODULE 4: TECHNICIAN ASSIGNMENT
# =====================================

class TechnicianAssignmentCreate(BaseModel):
    breakdown_id: int
    technician_id: int


class TechnicianAssignmentResponse(BaseModel):
    id: int
    breakdown_id: int
    technician_id: int
    assigned_at: datetime
    assignment_status: str

    model_config = ConfigDict(from_attributes=True)


# =====================================
# MODULE 5: REPAIR TRACKING
# =====================================

class RepairCreate(BaseModel):
    assignment_id: int
    root_cause: Optional[str] = Field(default=None, max_length=500)
    repair_action: Optional[str] = Field(default=None, max_length=1000)
    spare_parts: Optional[str] = Field(default=None, max_length=500)
    repair_cost: float = Field(default=0.0, ge=0)
    remarks: Optional[str] = Field(default=None, max_length=500)


class RepairUpdate(BaseModel):
    root_cause: Optional[str] = Field(default=None, max_length=500)
    repair_action: Optional[str] = Field(default=None, max_length=1000)
    spare_parts: Optional[str] = Field(default=None, max_length=500)
    repair_cost: Optional[float] = Field(default=None, ge=0)
    remarks: Optional[str] = Field(default=None, max_length=500)


class RepairResponse(BaseModel):
    id: int
    assignment_id: int
    root_cause: Optional[str]
    repair_action: Optional[str]
    spare_parts: Optional[str]
    repair_cost: float
    repair_status: str
    started_at: datetime
    completed_at: Optional[datetime]
    remarks: Optional[str]

    model_config = ConfigDict(from_attributes=True)
