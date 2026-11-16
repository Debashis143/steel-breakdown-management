import csv
from io import StringIO
from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    Equipment,
    Technician,
    Breakdown,
    TechnicianAssignment,
    Repair
)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics Dashboard"]
)


# 1. Overall Dashboard Summary
@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):

    total_equipment = db.query(Equipment).filter(
        Equipment.is_active == True
    ).count()

    total_technicians = db.query(Technician).filter(
        Technician.is_active == True
    ).count()

    total_breakdowns = db.query(Breakdown).count()

    open_breakdowns = db.query(Breakdown).filter(
        Breakdown.status == "Open"
    ).count()

    in_progress_breakdowns = db.query(Breakdown).filter(
        Breakdown.status == "In Progress"
    ).count()

    resolved_breakdowns = db.query(Breakdown).filter(
        Breakdown.status == "Resolved"
    ).count()

    critical_breakdowns = db.query(Breakdown).filter(
        Breakdown.severity == "Critical"
    ).count()

    total_repair_cost = db.query(
        func.coalesce(func.sum(Repair.repair_cost), 0)
    ).scalar()

    return {
        "total_equipment": total_equipment,
        "total_technicians": total_technicians,
        "total_breakdowns": total_breakdowns,
        "open_breakdowns": open_breakdowns,
        "in_progress_breakdowns": in_progress_breakdowns,
        "resolved_breakdowns": resolved_breakdowns,
        "critical_breakdowns": critical_breakdowns,
        "total_repair_cost": float(total_repair_cost)
    }


# 2. Breakdown Statistics by Severity
@router.get("/breakdowns-by-severity")
def breakdowns_by_severity(db: Session = Depends(get_db)):

    severity_levels = ["Low", "Medium", "High", "Critical"]

    results = (
        db.query(
            Breakdown.severity,
            func.count(Breakdown.id)
        )
        .group_by(Breakdown.severity)
        .all()
    )

    severity_counts = {
        severity: count
        for severity, count in results
    }

    return {
        "breakdowns_by_severity": [
            {
                "severity": severity,
                "count": severity_counts.get(severity, 0)
            }
            for severity in severity_levels
        ]
    }


# 3. Breakdown Statistics by Status
@router.get("/breakdowns-by-status")
def breakdowns_by_status(db: Session = Depends(get_db)):

    status_levels = ["Open", "In Progress", "Resolved"]

    results = (
        db.query(
            Breakdown.status,
            func.count(Breakdown.id)
        )
        .group_by(Breakdown.status)
        .all()
    )

    status_counts = {
        status: count
        for status, count in results
    }

    return {
        "breakdowns_by_status": [
            {
                "status": status,
                "count": status_counts.get(status, 0)
            }
            for status in status_levels
        ]
    }

# 4. Equipment-wise Breakdown Statistics
@router.get("/breakdowns-by-equipment")
def breakdowns_by_equipment(db: Session = Depends(get_db)):

    results = (
        db.query(
            Equipment.id,
            Equipment.equipment_code,
            Equipment.name,
            func.count(Breakdown.id).label("breakdown_count")
        )
        .outerjoin(
            Breakdown,
            Equipment.id == Breakdown.equipment_id
        )
        .group_by(
            Equipment.id,
            Equipment.equipment_code,
            Equipment.name
        )
        .all()
    )

    return {
        "breakdowns_by_equipment": [
            {
                "equipment_id": row.id,
                "equipment_code": row.equipment_code,
                "equipment_name": row.name,
                "breakdown_count": row.breakdown_count
            }
            for row in results
        ]
    }

# 5. Technician-wise Breakdown Statistics
@router.get("/breakdowns-by-technician")
def breakdowns_by_technician(db: Session = Depends(get_db)):

    results = (
        db.query(
            Technician.id,
            Technician.technician_code,
            Technician.full_name,
            func.count(TechnicianAssignment.id).label("assignment_count")
        )
        .outerjoin(
            TechnicianAssignment,
            Technician.id == TechnicianAssignment.technician_id
        )
        .group_by(
            Technician.id,
            Technician.technician_code,
            Technician.full_name
        )
        .all()
    )

    return {
        "breakdowns_by_technician": [
            {
                "technician_id": row.id,
                "technician_code": row.technician_code,
                "technician_name": row.full_name,
                "assignment_count": row.assignment_count
            }
            for row in results
        ]
    }

# 6. Monthly Breakdown Statistics
@router.get("/monthly-breakdowns")
def monthly_breakdowns(db: Session = Depends(get_db)):

    results = (
        db.query(
            func.strftime("%Y-%m", Breakdown.reported_at).label("month"),
            func.count(Breakdown.id).label("breakdown_count")
        )
        .group_by(
            func.strftime("%Y-%m", Breakdown.reported_at)
        )
        .order_by(
            func.strftime("%Y-%m", Breakdown.reported_at)
        )
        .all()
    )

    return {
        "monthly_breakdowns": [
            {
                "month": row.month,
                "breakdown_count": row.breakdown_count
            }
            for row in results
        ]
    }

# 7. Repair Cost by Equipment
@router.get("/repair-cost-by-equipment")
def repair_cost_by_equipment(db: Session = Depends(get_db)):

    results = (
        db.query(
            Equipment.id,
            Equipment.equipment_code,
            Equipment.name,
            func.coalesce(
                func.sum(Repair.repair_cost), 0
            ).label("total_repair_cost")
        )
        .outerjoin(
            Breakdown,
            Equipment.id == Breakdown.equipment_id
        )
        .outerjoin(
            TechnicianAssignment,
            Breakdown.id == TechnicianAssignment.breakdown_id
        )
        .outerjoin(
            Repair,
            TechnicianAssignment.id == Repair.assignment_id
        )
        .group_by(
            Equipment.id,
            Equipment.equipment_code,
            Equipment.name
        )
        .all()
    )

    return {
        "repair_cost_by_equipment": [
            {
                "equipment_id": row.id,
                "equipment_code": row.equipment_code,
                "equipment_name": row.name,
                "total_repair_cost": float(row.total_repair_cost)
            }
            for row in results
        ]
    }

# 8. Breakdown Details Report
@router.get("/breakdown-report")
def breakdown_report(db: Session = Depends(get_db)):

    results = (
        db.query(
            Breakdown.id,
            Breakdown.description,
            Breakdown.severity,
            Breakdown.status,
            Breakdown.reported_at,
            Equipment.equipment_code,
            Equipment.name.label("equipment_name")
        )
        .join(
            Equipment,
            Breakdown.equipment_id == Equipment.id
        )
        .order_by(Breakdown.reported_at.desc())
        .all()
    )

    return {
        "breakdown_report": [
            {
                "breakdown_id": row.id,
                "description": row.description,
                "severity": row.severity,
                "status": row.status,
                "reported_at": row.reported_at,
                "equipment_code": row.equipment_code,
                "equipment_name": row.equipment_name
            }
            for row in results
        ]
    }

# 9. Recent Breakdown Report
@router.get("/recent-breakdowns")
def recent_breakdowns(db: Session = Depends(get_db)):

    results = (
        db.query(
            Breakdown.id,
            Breakdown.description,
            Breakdown.severity,
            Breakdown.status,
            Breakdown.reported_at,
            Equipment.equipment_code,
            Equipment.name.label("equipment_name")
        )
        .join(
            Equipment,
            Breakdown.equipment_id == Equipment.id
        )
        .order_by(Breakdown.reported_at.desc())
        .limit(10)
        .all()
    )

    return {
        "recent_breakdowns": [
            {
                "breakdown_id": row.id,
                "description": row.description,
                "severity": row.severity,
                "status": row.status,
                "reported_at": row.reported_at,
                "equipment_code": row.equipment_code,
                "equipment_name": row.equipment_name
            }
            for row in results
        ]
    }

# 10. Breakdown Statistics by Department
@router.get("/breakdowns-by-department")
def breakdowns_by_department(db: Session = Depends(get_db)):

    results = (
        db.query(
            Equipment.department,
            func.count(Breakdown.id).label("breakdown_count")
        )
        .join(
            Breakdown,
            Equipment.id == Breakdown.equipment_id
        )
        .group_by(Equipment.department)
        .all()
    )

    return {
        "breakdowns_by_department": [
            {
                "department": row.department,
                "breakdown_count": row.breakdown_count
            }
            for row in results
        ]
    }

# 11. Average Repair Cost
@router.get("/average-repair-cost")
def average_repair_cost(db: Session = Depends(get_db)):

    average_cost = db.query(
        func.avg(Repair.repair_cost)
    ).scalar()

    return {
        "average_repair_cost": float(average_cost or 0)
    }


# 12. Average Repair Duration
@router.get("/average-repair-duration")
def average_repair_duration(db: Session = Depends(get_db)):

    average_duration = db.query(
        func.avg(
            (
                func.julianday(Repair.completed_at) -
                func.julianday(Repair.started_at)
            ) * 24
        )
    ).filter(
        Repair.completed_at.isnot(None)
    ).scalar()

    return {
        "average_repair_duration_hours": round(
            float(average_duration or 0), 2
        )
    }

# 13. Export Breakdown Report to CSV
@router.get("/export/breakdowns-csv")
def export_breakdowns_csv(db: Session = Depends(get_db)):

    results = (
        db.query(
            Breakdown.id,
            Breakdown.description,
            Breakdown.severity,
            Breakdown.status,
            Breakdown.reported_by,
            Breakdown.reported_at,
            Equipment.equipment_code,
            Equipment.name.label("equipment_name"),
            Equipment.department
        )
        .join(
            Equipment,
            Breakdown.equipment_id == Equipment.id
        )
        .order_by(Breakdown.reported_at.desc())
        .all()
    )

    output = StringIO(newline="")
    writer = csv.writer(output)

    # CSV column headers
    writer.writerow([
        "Breakdown ID",
        "Description",
        "Severity",
        "Status",
        "Reported By",
        "Reported At",
        "Equipment Code",
        "Equipment Name",
        "Department"
    ])

    # Write breakdown records
    for row in results:
        writer.writerow([
            row.id,
            row.description,
            row.severity,
            row.status,
            row.reported_by,
            row.reported_at.isoformat() if row.reported_at else "",
            row.equipment_code,
            row.equipment_name,
            row.department
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=breakdown_report.csv"
        }
    )
