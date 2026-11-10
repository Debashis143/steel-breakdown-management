
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TechnicianAssignment, Technician, Breakdown
from app.schemas import (
    TechnicianAssignmentCreate,
    TechnicianAssignmentResponse
)

router = APIRouter(
    prefix="/api/assignments",
    tags=["Technician Assignment"]
)


# 1. Assign technician to a breakdown
@router.post(
    "/",
    response_model=TechnicianAssignmentResponse,
    status_code=201
)
def assign_technician(
    data: TechnicianAssignmentCreate,
    db: Session = Depends(get_db)
):
    breakdown = db.query(Breakdown).filter(
        Breakdown.id == data.breakdown_id
    ).first()

    if not breakdown:
        raise HTTPException(
            status_code=404,
            detail="Breakdown not found"
        )

    if breakdown.status == "Resolved":
        raise HTTPException(
            status_code=400,
            detail="Cannot assign a technician to a resolved breakdown"
        )

    technician = db.query(Technician).filter(
        Technician.id == data.technician_id
    ).first()

    if not technician or not technician.is_active:
        raise HTTPException(
            status_code=404,
            detail="Active technician not found"
        )

    if technician.availability_status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Technician is not available"
        )

    existing = db.query(TechnicianAssignment).filter(
        TechnicianAssignment.breakdown_id == data.breakdown_id,
        TechnicianAssignment.assignment_status == "Assigned"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This breakdown already has an active assignment"
        )

    assignment = TechnicianAssignment(**data.model_dump())

    db.add(assignment)

    technician.availability_status = "Busy"
    breakdown.status = "In Progress"

    db.commit()
    db.refresh(assignment)

    return assignment


# 2. View all assignments
@router.get("/", response_model=list[TechnicianAssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    return db.query(TechnicianAssignment).order_by(
        TechnicianAssignment.id.desc()
    ).all()


# 3. View assignment by ID
@router.get("/{assignment_id}", response_model=TechnicianAssignmentResponse)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    assignment = db.query(TechnicianAssignment).filter(
        TechnicianAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    return assignment


# 4. Complete assignment
@router.patch(
    "/{assignment_id}/complete",
    response_model=TechnicianAssignmentResponse
)
def complete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    assignment = db.query(TechnicianAssignment).filter(
        TechnicianAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    if assignment.assignment_status != "Assigned":
        raise HTTPException(
            status_code=400,
            detail="Assignment is not active"
        )

    technician = db.query(Technician).filter(
        Technician.id == assignment.technician_id
    ).first()

    breakdown = db.query(Breakdown).filter(
        Breakdown.id == assignment.breakdown_id
    ).first()

    assignment.assignment_status = "Completed"

    if technician:
        technician.availability_status = "Available"

    if breakdown:
        breakdown.status = "Resolved"

    db.commit()
    db.refresh(assignment)

    return assignment
