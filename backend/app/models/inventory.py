from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Inventory(Base):

    __tablename__ = "inventory"


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


    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )


    current_stock = Column(
        Integer,
        default=0
    )


    reserved_stock = Column(
        Integer,
        default=0
    )


    available_stock = Column(
        Integer,
        default=0
    )


    reorder_level = Column(
        Integer,
        default=10
    )


    stock_status = Column(
        String(30),
        default="In Stock"
    )


    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


    company = relationship(
        "Company"
    )


    product = relationship(
        "Product"
    )