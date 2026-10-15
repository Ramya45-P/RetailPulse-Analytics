from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func

from app.database.database import Base


class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer, ForeignKey("companies.id"), nullable=False, index=True
    )
    generated_by = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    report_name = Column(String(150), nullable=False)
    report_type = Column(String(50), nullable=False)
    report_filters = Column(JSON, nullable=False, default=dict)
    export_format = Column(String(10), nullable=False, default="CSV")

    status = Column(String(20), nullable=False, default="SUCCESS")
    row_count = Column(Integer, nullable=False, default=0)
    result_data = Column(JSON, nullable=True)
    failure_reason = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )