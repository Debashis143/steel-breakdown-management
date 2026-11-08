
from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Equipment(Base):

    __tablename__ = "equipment_master"

    id = Column(Integer, primary_key=True, index=True)

    equipment_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    name = Column(String(150), nullable=False)

    department = Column(String(100), nullable=False)

    equipment_type = Column(String(100), nullable=False)

    location = Column(String(150), nullable=False)

    criticality = Column(String(20), nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)
