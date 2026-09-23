from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    action = Column(
        String(50),
        nullable=False,
        index=True
    )

    resource_type = Column(
        String(100),
        nullable=False,
        index=True
    )

    resource_id = Column(
        String(100),
        nullable=True,
        index=True
    )

    description = Column(
        Text,
        nullable=True
    )

    ip_address = Column(
        String(45),
        nullable=True
    )

    user_agent = Column(
        Text,
        nullable=True
    )

    before_values = Column(
        JSON,
        nullable=True
    )

    after_values = Column(
        JSON,
        nullable=True
    )

    status = Column(
        String(20),
        nullable=False,
        default="SUCCESS",
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    company = relationship(
        "Company"
    )

    user = relationship(
        "User"
    )


# Frequently used filtering/sorting indexes
Index(
    "ix_audit_logs_company_created_at",
    AuditLog.company_id,
    AuditLog.created_at
)

Index(
    "ix_audit_logs_company_action",
    AuditLog.company_id,
    AuditLog.action
)

Index(
    "ix_audit_logs_company_resource",
    AuditLog.company_id,
    AuditLog.resource_type
)

Index(
    "ix_audit_logs_company_status",
    AuditLog.company_id,
    AuditLog.status
)