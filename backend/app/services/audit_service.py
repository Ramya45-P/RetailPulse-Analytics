from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    company_id: int,
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    before_values: Optional[dict[str, Any]] = None,
    after_values: Optional[dict[str, Any]] = None,
    status: str = "SUCCESS",
) -> AuditLog:
    """
    Create and persist an audit log entry.

    Audit logs are always associated with a company.
    user_id may be None for system/background actions.
    """

    audit_log = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        before_values=before_values,
        after_values=after_values,
        status=status,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log