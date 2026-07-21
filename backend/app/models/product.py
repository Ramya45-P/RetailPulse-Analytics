from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    sku = Column(
        String(50),
        nullable=False
    )

    brand = Column(
        String(100),
        nullable=True
    )

    description = Column(
        String(255),
        nullable=True
    )

    unit_price = Column(
        Float,
        nullable=False
    )

    cost_price = Column(
        Float,
        nullable=False
    )

    stock_quantity = Column(
        Integer,
        default=0
    )

    unit_of_measure = Column(
        String(50),
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

    category = relationship(
        "Category",
        back_populates="products"
    )