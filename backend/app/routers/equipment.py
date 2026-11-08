
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Equipment
from app.schemas import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse
)

router = APIRouter(
    prefix="/api/equipment",
    tags=["Equipment Master"]
)


# POST: Add equipment
@router.post("/", response_model=EquipmentResponse, status_code=201)
def create_equipment(data: EquipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Equipment).filter(
        Equipment.equipment_code == data.equipment_code
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Equipment code already exists")

    new_equipment = Equipment(**data.model_dump())
    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)

    return new_equipment


# GET: View and search equipment
@router.get("/", response_model=list[EquipmentResponse])
def get_equipment(search: str | None = None, department: str | None = None,
                  db: Session = Depends(get_db)):
    query = db.query(Equipment)

    if search:
        query = query.filter(
            or_(
                Equipment.name.ilike(f"%{search}%"),
                Equipment.equipment_code.ilike(f"%{search}%")
            )
        )

    if department:
        query = query.filter(Equipment.department.ilike(f"%{department}%"))

    return query.all()


# PUT: Update equipment
@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(equipment_id: int, data: EquipmentUpdate,
                     db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(equipment, key, value)

    db.commit()
    db.refresh(equipment)

    return equipment


# PATCH: Deactivate equipment
@router.patch("/{equipment_id}/deactivate")
def deactivate_equipment(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    equipment.is_active = False
    db.commit()

    return {"message": "Equipment deactivated successfully"}
