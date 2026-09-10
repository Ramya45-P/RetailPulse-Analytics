from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class ImportHistory(Base):
    __tablename__ = "import_history"

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

    import_type = Column(
        String(30),
        nullable=False
    )

    filename = Column(
        String(255),
        nullable=False
    )

    uploaded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    total_records = Column(
        Integer,
        default=0,
        nullable=False
    )

    successful_records = Column(
        Integer,
        default=0,
        nullable=False
    )

    failed_records = Column(
        Integer,
        default=0,
        nullable=False
    )

    duplicate_records = Column(
        Integer,
        default=0,
        nullable=False
    )

    status = Column(
        String(30),
        default="Pending",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )

    company = relationship(
        "Company"
    )

    uploader = relationship(
        "User"
    )

    errors = relationship(
        "ImportErrorRecord",
        back_populates="import_history",
        cascade="all, delete-orphan"
    )