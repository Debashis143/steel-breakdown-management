
from fastapi import FastAPI

from app.database import Base, engine
from app import models

from app.routers import equipment
from app.routers import technicians
from app.routers import breakdowns
from app.routers import assignments
from app.routers import repairs

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Steel Plant Equipment Breakdown Management System",
    version="1.0.0"
)

# Register API routers
app.include_router(equipment.router)
app.include_router(technicians.router)
app.include_router(breakdowns.router)
app.include_router(assignments.router)
app.include_router(repairs.router)

@app.get("/")
def home():
    return {"message": "Steel Plant Breakdown Management API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
