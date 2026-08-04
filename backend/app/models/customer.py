from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
    )

    customer_id = Column(
        String(20),
        unique=True,
        nullable=False,
    )

    full_name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(100),
        nullable=False,
    )

    phone = Column(
        String(20),
        nullable=False,
    )

    date_of_birth = Column(DateTime)

    gender = Column(String(20))

    address = Column(String(255))

    city = Column(String(100))

    state = Column(String(100))

    country = Column(String(100))

    customer_type = Column(
        String(30),
        default="Retail",
    )

    preferred_sales_channel = Column(
        String(50),
        default="Retail Store",
    )

    is_active = Column(
        Boolean,
        default=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    company = relationship("Company")