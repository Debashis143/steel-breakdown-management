
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Float,
    func
)
from app.database import Base


# MODULE 1: EQUIPMENT MASTER
class Equipment(Base):

    __tablename__ = "equipment_master"

    id = Column(Integer, primary_key=True, index=True)

    equipment_code = Column(String(50), unique=True, nullable=False)

    name = Column(String(150), nullable=False)

    department = Column(String(100), nullable=False)

    equipment_type = Column(String(100), nullable=False)

    location = Column(String(150), nullable=False)

    criticality = Column(String(20), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)


# MODULE 2: TECHNICIAN MANAGEMENT
class Technician(Base):

    __tablename__ = "technician_master"

    id = Column(Integer, primary_key=True, index=True)

    technician_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    full_name = Column(String(150), nullable=False)

    department = Column(String(100), nullable=False)

    specialization = Column(String(150), nullable=False)

    phone_number = Column(String(15), nullable=True)

    email = Column(String(150), nullable=True)

    availability_status = Column(
        String(30),
        default="Available",
        nullable=False
    )

    is_active = Column(Boolean, default=True, nullable=False)


# MODULE 3: BREAKDOWN REGISTRATION
class Breakdown(Base):

    __tablename__ = "breakdown_records"

    id = Column(Integer, primary_key=True, index=True)

    equipment_id = Column(
        Integer,
        ForeignKey("equipment_master.id"),
        nullable=False
    )

    description = Column(String(500), nullable=False)

    severity = Column(String(20), nullable=False)

    reported_by = Column(String(150), nullable=False)

    status = Column(
        String(30),
        default="Open",
        nullable=False
    )

    reported_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

# MODULE 4: TECHNICIAN ASSIGNMENT

class TechnicianAssignment(Base):
    __tablename__ = "technician_assignments"

    id = Column(Integer, primary_key=True, index=True)

    breakdown_id = Column(
        Integer,
        ForeignKey("breakdown_records.id"),
        nullable=False
    )

    technician_id = Column(
        Integer,
        ForeignKey("technician_master.id"),
        nullable=False
    )

    assigned_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    assignment_status = Column(
        String(30),
        default="Assigned",
        nullable=False
    )

# MODULE 5: REPAIR TRACKING

class Repair(Base):
    __tablename__ = "repair_records"

    id = Column(Integer, primary_key=True, index=True)

    assignment_id = Column(
        Integer,
        ForeignKey("technician_assignments.id"),
        nullable=False
    )

    root_cause = Column(String(500), nullable=True)

    repair_action = Column(String(1000), nullable=True)

    spare_parts = Column(String(500), nullable=True)

    repair_cost = Column(Float, default=0.0, nullable=False)

    repair_status = Column(
        String(30),
        default="In Progress",
        nullable=False
    )

    started_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    completed_at = Column(DateTime, nullable=True)

    remarks = Column(String(500), nullable=True)
