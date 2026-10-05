from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification

from app.schemas.notification_schema import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
    NotificationReadResponse,
)

from app.services.audit_service import create_audit_log



router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get(
    "",
    response_model=NotificationListResponse
)
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),

    is_read: Optional[bool] = None,
    notification_type: Optional[str] = None,
    priority: Optional[str] = None,

    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(
        Notification.company_id == current_user.company_id,
        Notification.user_id == current_user.id,
    )

    # Do not show expired notifications
    query = query.filter(
        (Notification.expires_at.is_(None)) |
        (Notification.expires_at > datetime.utcnow())
    )

    if is_read is not None:
        query = query.filter(
            Notification.is_read == is_read
        )

    if notification_type:
        query = query.filter(
            Notification.type == notification_type
        )

    if priority:
        query = query.filter(
            Notification.priority == priority
        )

    total = query.count()

    unread_count = db.query(Notification).filter(
        Notification.company_id == current_user.company_id,
        Notification.user_id == current_user.id,
        Notification.is_read == False,
        (
            (Notification.expires_at.is_(None)) |
            (Notification.expires_at > datetime.utcnow())
        )
    ).count()

    notifications = (
        query
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return NotificationListResponse(
        total=total,
        page=page,
        limit=limit,
        unread_count=unread_count,
        notifications=notifications,
    )


# ============================================================
# UNREAD COUNT
# ============================================================

@router.get(
    "/unread-count",
    response_model=UnreadCountResponse
)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unread_count = db.query(Notification).filter(
        Notification.company_id == current_user.company_id,
        Notification.user_id == current_user.id,
        Notification.is_read == False,
        (
            (Notification.expires_at.is_(None)) |
            (Notification.expires_at > datetime.utcnow())
        )
    ).count()

    return {
        "unread_count": unread_count
    }


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationReadResponse
)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.company_id == current_user.company_id,
        Notification.user_id == current_user.id,
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    # Only update and audit if the notification
    # was actually unread.
    if not notification.is_read:

        before_values = {
            "is_read": False,
            "read_at": None,
        }

        notification.is_read = True
        notification.read_at = datetime.utcnow()

        after_values = {
            "is_read": True,
            "read_at": notification.read_at.isoformat(),
        }

        db.commit()
        db.refresh(notification)

        # ----------------------------------------------------
        # AUDIT LOG
        # ----------------------------------------------------

        create_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            action="MARK_READ",
            resource_type="Notification",
            resource_id=str(notification.id),
            description=(
                f"Notification #{notification.id} "
                f"marked as read"
            ),
            before_values=before_values,
            after_values=after_values,
            status="SUCCESS",
        )

    return NotificationReadResponse(
        message="Notification marked as read",
        notification=notification,
    )


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@router.patch(
    "/read-all"
)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = db.query(Notification).filter(
        Notification.company_id == current_user.company_id,
        Notification.user_id == current_user.id,
        Notification.is_read == False,
        (
            (Notification.expires_at.is_(None)) |
            (Notification.expires_at > datetime.utcnow())
        )
    ).all()

    # Nothing to update
    if not notifications:
        return {
            "message": "No unread notifications",
            "updated_count": 0,
        }

    now = datetime.utcnow()

    notification_ids = []

    for notification in notifications:
        notification.is_read = True
        notification.read_at = now
        notification_ids.append(notification.id)

    db.commit()

    # --------------------------------------------------------
    # AUDIT LOG
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="MARK_ALL_READ",
        resource_type="Notification",
        resource_id=None,
        description=(
            f"Marked {len(notification_ids)} notifications "
            f"as read"
        ),
        before_values={
            "unread_count": len(notification_ids),
        },
        after_values={
            "unread_count": 0,
            "notification_ids": notification_ids,
        },
        status="SUCCESS",
    )

    return {
        "message": "All notifications marked as read",
        "updated_count": len(notification_ids),
    }