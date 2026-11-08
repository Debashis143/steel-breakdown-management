

from fastapi import FastAPI

from app.database import Base, engine
from app import models
from app.routers import equipment

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(
    title="Steel Plant Equipment Breakdown Management System",
    version="1.0.0"
)

# Connect Equipment API
app.include_router(equipment.router)


@app.get("/")
def home():
    return {
        "message": "Steel Plant Breakdown Management API is running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
