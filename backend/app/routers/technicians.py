
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Technician
from app.schemas import (
    TechnicianCreate,
    TechnicianUpdate,
    TechnicianResponse
)

router = APIRouter(
    prefix="/api/technicians",
    tags=["Technician Management"]
)


# 1. POST: Register a new technician
@router.post("/", response_model=TechnicianResponse, status_code=201)
def create_technician(
    data: TechnicianCreate,
    db: Session = Depends(get_db)
):
    existing = db.query(Technician).filter(
        Technician.technician_code == data.technician_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Technician code already exists"
        )

    new_technician = Technician(**data.model_dump())

    db.add(new_technician)
    db.commit()
    db.refresh(new_technician)

    return new_technician


# 2. GET: View and search technicians
@router.get("/", response_model=list[TechnicianResponse])
def get_technicians(
    search: str | None = None,
    department: str | None = None,
    availability_status: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Technician)

    if search:
        query = query.filter(
            or_(
                Technician.full_name.ilike(f"%{search}%"),
                Technician.technician_code.ilike(f"%{search}%"),
                Technician.specialization.ilike(f"%{search}%")
            )
        )

    if department:
        query = query.filter(
            Technician.department.ilike(f"%{department}%")
        )

    if availability_status:
        query = query.filter(
            Technician.availability_status == availability_status
        )

    return query.order_by(Technician.id.desc()).all()


# 3. GET: View technician by ID
@router.get("/{technician_id}", response_model=TechnicianResponse)
def get_technician(
    technician_id: int,
    db: Session = Depends(get_db)
):
    technician = db.query(Technician).filter(
        Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    return technician


# 4. PUT: Update technician details
@router.put("/{technician_id}", response_model=TechnicianResponse)
def update_technician(
    technician_id: int,
    data: TechnicianUpdate,
    db: Session = Depends(get_db)
):
    technician = db.query(Technician).filter(
        Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(technician, key, value)

    db.commit()
    db.refresh(technician)

    return technician


# 5. PATCH: Update technician availability
@router.patch("/{technician_id}/availability",
              response_model=TechnicianResponse)
def update_availability(
    technician_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    allowed_statuses = ["Available", "Busy", "On Leave"]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid availability status"
        )

    technician = db.query(Technician).filter(
        Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    technician.availability_status = status

    db.commit()
    db.refresh(technician)

    return technician


# 6. PATCH: Deactivate technician
@router.patch("/{technician_id}/deactivate")
def deactivate_technician(
    technician_id: int,
    db: Session = Depends(get_db)
):
    technician = db.query(Technician).filter(
        Technician.id == technician_id
    ).first()

    if not technician:
        raise HTTPException(
            status_code=404,
            detail="Technician not found"
        )

    technician.is_active = False

    db.commit()

    return {
        "message": "Technician deactivated successfully"
    }
