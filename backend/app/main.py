
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models

from app.routers import equipment
from app.routers import technicians
from app.routers import breakdowns
from app.routers import assignments
from app.routers import repairs
from app.routers import analytics


# Create database tables
Base.metadata.create_all(bind=engine)


# Initialize FastAPI application
app = FastAPI(
    title="Steel Plant Equipment Breakdown Management System",
    version="1.0.0"
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
app.include_router(equipment.router)
app.include_router(technicians.router)
app.include_router(breakdowns.router)
app.include_router(assignments.router)
app.include_router(repairs.router)
app.include_router(analytics.router)


# Root API
@app.get("/")
def home():
    return {
        "message": "Steel Plant Breakdown Management API is running"
    }


# Health Check
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
