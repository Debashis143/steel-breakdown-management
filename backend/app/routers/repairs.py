
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Repair, TechnicianAssignment
from app.schemas import (
    RepairCreate,
    RepairUpdate,
    RepairResponse
)

router = APIRouter(
    prefix="/api/repairs",
    tags=["Repair Tracking"]
)


# 1. Create a repair record
@router.post("/", response_model=RepairResponse, status_code=201)
def create_repair(
    data: RepairCreate,
    db: Session = Depends(get_db)
):
    assignment = db.query(TechnicianAssignment).filter(
        TechnicianAssignment.id == data.assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Technician assignment not found"
        )

    if assignment.assignment_status != "Assigned":
        raise HTTPException(
            status_code=400,
            detail="Assignment is not active"
        )

    existing_repair = db.query(Repair).filter(
        Repair.assignment_id == data.assignment_id
    ).first()

    if existing_repair:
        raise HTTPException(
            status_code=400,
            detail="Repair record already exists for this assignment"
        )

    new_repair = Repair(**data.model_dump())

    db.add(new_repair)
    db.commit()
    db.refresh(new_repair)

    return new_repair


# 2. View all repair records
@router.get("/", response_model=list[RepairResponse])
def get_repairs(db: Session = Depends(get_db)):
    return db.query(Repair).order_by(
        Repair.id.desc()
    ).all()


# 3. View repair by ID
@router.get("/{repair_id}", response_model=RepairResponse)
def get_repair(
    repair_id: int,
    db: Session = Depends(get_db)
):
    repair = db.query(Repair).filter(
        Repair.id == repair_id
    ).first()

    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair record not found"
        )

    return repair


# 4. Update repair information
@router.put("/{repair_id}", response_model=RepairResponse)
def update_repair(
    repair_id: int,
    data: RepairUpdate,
    db: Session = Depends(get_db)
):
    repair = db.query(Repair).filter(
        Repair.id == repair_id
    ).first()

    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair record not found"
        )

    if repair.repair_status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Completed repair cannot be updated"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(repair, key, value)

    db.commit()
    db.refresh(repair)

    return repair


# 5. Complete repair
@router.patch("/{repair_id}/complete", response_model=RepairResponse)
def complete_repair(
    repair_id: int,
    db: Session = Depends(get_db)
):
    repair = db.query(Repair).filter(
        Repair.id == repair_id
    ).first()

    if not repair:
        raise HTTPException(
            status_code=404,
            detail="Repair record not found"
        )

    if repair.repair_status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Repair is already completed"
        )

    assignment = db.query(TechnicianAssignment).filter(
        TechnicianAssignment.id == repair.assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Technician assignment not found"
        )

    repair.repair_status = "Completed"
    repair.completed_at = datetime.now()

    assignment.assignment_status = "Completed"

    db.commit()
    db.refresh(repair)

    return repair
