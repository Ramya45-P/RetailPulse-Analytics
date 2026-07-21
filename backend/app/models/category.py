from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    description = Column(
        String(255),
        nullable=True
    )

    status = Column(
        String(20),
        default="Active"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    company = relationship("Company")

    products = relationship(
        "Product",
        back_populates="category"
    )