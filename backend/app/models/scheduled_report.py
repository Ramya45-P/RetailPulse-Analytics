from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    JSON,
    Boolean,
    Text,
)
from sqlalchemy.sql import func

from app.database.database import Base


class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer, ForeignKey("companies.id"), nullable=False, index=True
    )
    created_by = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    name = Column(String(150), nullable=False)
    report_type = Column(String(50), nullable=False)
    report_filters = Column(JSON, nullable=False, default=dict)

    frequency = Column(String(20), nullable=False)
    execution_time = Column(String(5), nullable=False, default="09:00")
    recipients = Column(JSON, nullable=False, default=list)
    export_format = Column(String(10), nullable=False, default="CSV")

    is_active = Column(Boolean, nullable=False, default=True)

    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_status = Column(String(20), nullable=True)
    last_error = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )