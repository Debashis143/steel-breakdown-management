
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Breakdown, Equipment
from app.schemas import (
    BreakdownCreate,
    BreakdownUpdate,
    BreakdownStatusUpdate,
    BreakdownResponse
)

router = APIRouter(
    prefix="/api/breakdowns",
    tags=["Breakdown Management"]
)


# 1. Register a new breakdown
@router.post("/", response_model=BreakdownResponse, status_code=201)
def create_breakdown(
    data: BreakdownCreate,
    db: Session = Depends(get_db)
):
    equipment = db.query(Equipment).filter(
        Equipment.id == data.equipment_id
    ).first()

    if not equipment:
        raise HTTPException(
            status_code=404,
            detail="Equipment not found"
        )

    new_breakdown = Breakdown(**data.model_dump())

    db.add(new_breakdown)
    db.commit()
    db.refresh(new_breakdown)

    return new_breakdown


# 2. View all breakdowns
@router.get("/", response_model=list[BreakdownResponse])
def get_breakdowns(
    status: str | None = None,
    severity: str | None = None,
    equipment_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Breakdown)

    if status:
        query = query.filter(Breakdown.status == status)

    if severity:
        query = query.filter(Breakdown.severity == severity)

    if equipment_id:
        query = query.filter(
            Breakdown.equipment_id == equipment_id
        )

    return query.order_by(Breakdown.id.desc()).all()


# 3. View breakdown by ID
@router.get("/{breakdown_id}", response_model=BreakdownResponse)
def get_breakdown(
    breakdown_id: int,
    db: Session = Depends(get_db)
):
    breakdown = db.query(Breakdown).filter(
        Breakdown.id == breakdown_id
    ).first()

    if not breakdown:
        raise HTTPException(
            status_code=404,
            detail="Breakdown not found"
        )

    return breakdown


# 4. Update breakdown details
@router.put("/{breakdown_id}", response_model=BreakdownResponse)
def update_breakdown(
    breakdown_id: int,
    data: BreakdownUpdate,
    db: Session = Depends(get_db)
):
    breakdown = db.query(Breakdown).filter(
        Breakdown.id == breakdown_id
    ).first()

    if not breakdown:
        raise HTTPException(
            status_code=404,
            detail="Breakdown not found"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(breakdown, key, value)

    db.commit()
    db.refresh(breakdown)

    return breakdown


# 5. Update breakdown status
@router.patch(
    "/{breakdown_id}/status",
    response_model=BreakdownResponse
)
def update_breakdown_status(
    breakdown_id: int,
    data: BreakdownStatusUpdate,
    db: Session = Depends(get_db)
):
    breakdown = db.query(Breakdown).filter(
        Breakdown.id == breakdown_id
    ).first()

    if not breakdown:
        raise HTTPException(
            status_code=404,
            detail="Breakdown not found"
        )

    breakdown.status = data.status

    db.commit()
    db.refresh(breakdown)

    return breakdown
