from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User


# ============================================================
# CREATE NOTIFICATION
# ============================================================

def create_notification(
    db: Session,
    *,
    company_id: int,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "Low",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    expires_in_hours: Optional[int] = None,
):
    """
    Creates a notification for a specific user.

    Duplicate prevention:
    The same user will not receive another unread notification
    for the same type + resource while the existing notification
    is still active.
    """

    # --------------------------------------------------------
    # DUPLICATE PREVENTION
    # --------------------------------------------------------

    duplicate_query = db.query(Notification).filter(
        Notification.company_id == company_id,
        Notification.user_id == user_id,
        Notification.type == notification_type,
        Notification.resource_type == resource_type,
        Notification.resource_id == resource_id,
        Notification.is_read == False,
    )

    # Only consider active notifications
    duplicate_query = duplicate_query.filter(
        (
            Notification.expires_at.is_(None)
        )
        |
        (
            Notification.expires_at > datetime.utcnow()
        )
    )

    existing_notification = duplicate_query.first()

    if existing_notification:
        return existing_notification

    # --------------------------------------------------------
    # EXPIRY
    # --------------------------------------------------------

    expires_at = None

    if expires_in_hours is not None:
        expires_at = datetime.utcnow() + timedelta(
            hours=expires_in_hours
        )

    # --------------------------------------------------------
    # CREATE
    # --------------------------------------------------------

    notification = Notification(
        company_id=company_id,
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        priority=priority,
        resource_type=resource_type,
        resource_id=resource_id,
        is_read=False,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# CREATE NOTIFICATION FOR ROLE
# ============================================================

def notify_role(
    db: Session,
    *,
    company_id: int,
    role: str,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "Low",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    expires_in_hours: Optional[int] = None,
):
    """
    Sends a notification to all active users of a specific
    role within the same company.
    """

    users = db.query(User).filter(
        User.company_id == company_id,
        User.role == role,
        User.is_active == True,
    ).all()

    notifications = []

    for user in users:
        notification = create_notification(
            db,
            company_id=company_id,
            user_id=user.id,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            resource_type=resource_type,
            resource_id=resource_id,
            expires_in_hours=expires_in_hours,
        )

        notifications.append(notification)

    return notifications


# ============================================================
# NOTIFY ADMINS
# ============================================================

def notify_admins(
    db: Session,
    *,
    company_id: int,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "Low",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    expires_in_hours: Optional[int] = None,
):
    """
    Sends a notification to all active Admin users
    belonging to the specified company.
    """

    return notify_role(
        db,
        company_id=company_id,
        role="Admin",
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        resource_type=resource_type,
        resource_id=resource_id,
        expires_in_hours=expires_in_hours,
    )

# ============================================================
# ROLE-AWARE NOTIFICATION HELPERS
# ============================================================

def notify_inventory_roles(
    db: Session,
    *,
    company_id: int,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "Low",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    expires_in_hours: Optional[int] = None,
):
    """
    Sends inventory/sales notifications to authorized roles.

    Task 14 role matrix:
    - Admin   -> receives inventory and sales notifications
    - Analyst -> receives inventory and sales notifications
    - Viewer  -> does not receive these notifications
    """

    notifications = []

    # Admin
    notifications.extend(
        notify_role(
            db=db,
            company_id=company_id,
            role="Admin",
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            resource_type=resource_type,
            resource_id=resource_id,
            expires_in_hours=expires_in_hours,
        )
    )

    # Analyst
    notifications.extend(
        notify_role(
            db=db,
            company_id=company_id,
            role="Analyst",
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            resource_type=resource_type,
            resource_id=resource_id,
            expires_in_hours=expires_in_hours,
        )
    )

    return notifications


# ============================================================
# INVENTORY ALERT EVALUATION
# ============================================================

def evaluate_inventory_alerts(
    db: Session,
    company_id: int,
):
    """
    Evaluates the existing Task 11 inventory forecast and
    creates notifications for important inventory conditions.

    Existing Task 11 logic is reused so that Task 14 does not
    duplicate stock/reorder calculations.
    """

    from app.services.inventory_forecast_service import (
        get_inventory_forecast,
    )

    forecasts = get_inventory_forecast(
        db=db,
        company_id=company_id,
    )

    created_notifications = []

    for item in forecasts:

        product_id = item["product_id"]
        product_name = item["product_name"]
        sku = item["sku"]

        current_stock = item["current_stock"]
        reorder_point = item["reorder_point"]
        days_remaining = item["days_of_stock_remaining"]
        recommended_quantity = item[
            "recommended_reorder_quantity"
        ]

        stock_risk = item["stock_risk"]

        # ----------------------------------------------------
        # CRITICAL — OUT OF STOCK
        # ----------------------------------------------------

        if stock_risk == "Out of Stock":

            notifications = notify_admins(
                db=db,
                company_id=company_id,
                notification_type="Stockout Risk",
                title="Product Out of Stock",
                message=(
                    f"{product_name} ({sku}) has reached "
                    f"0 stock and requires immediate "
                    f"replenishment."
                ),
                priority="Critical",
                resource_type="Product",
                resource_id=product_id,
                expires_in_hours=24,
            )

            created_notifications.extend(
                notifications
            )

        # ----------------------------------------------------
        # HIGH — STOCKOUT RISK
        # ----------------------------------------------------

        elif stock_risk == "Stockout Risk":

            days_text = (
                f"{days_remaining:.1f} days"
                if days_remaining is not None
                else "soon"
            )

            notifications = notify_admins(
                db=db,
                company_id=company_id,
                notification_type="Stockout Risk",
                title="Stockout Risk Detected",
                message=(
                    f"{product_name} ({sku}) is expected "
                    f"to reach stockout in approximately "
                    f"{days_text}. Current stock: "
                    f"{int(current_stock)}. "
                    f"Recommended reorder quantity: "
                    f"{recommended_quantity}."
                ),
                priority="High",
                resource_type="Product",
                resource_id=product_id,
                expires_in_hours=24,
            )

            created_notifications.extend(
                notifications
            )

        # ----------------------------------------------------
        # MEDIUM — LOW STOCK
        # ----------------------------------------------------

        elif stock_risk == "Low Stock":

            notifications = notify_admins(
                db=db,
                company_id=company_id,
                notification_type="Low Stock",
                title="Low Stock Alert",
                message=(
                    f"{product_name} ({sku}) is below "
                    f"the reorder point. Current stock: "
                    f"{int(current_stock)}, reorder point: "
                    f"{reorder_point:.0f}. "
                    f"Recommended reorder quantity: "
                    f"{recommended_quantity}."
                ),
                priority="Medium",
                resource_type="Product",
                resource_id=product_id,
                expires_in_hours=24,
            )

            created_notifications.extend(
                notifications
            )

        # ----------------------------------------------------
        # LOW — OVERSTOCK
        # ----------------------------------------------------

        elif stock_risk == "Overstock":

            notifications = notify_admins(
                db=db,
                company_id=company_id,
                notification_type="Overstock",
                title="Overstock Alert",
                message=(
                    f"{product_name} ({sku}) has excess "
                    f"inventory. Current stock: "
                    f"{int(current_stock)}. "
                    f"Consider reducing or pausing "
                    f"replenishment."
                ),
                priority="Low",
                resource_type="Product",
                resource_id=product_id,
                expires_in_hours=24,
            )

            created_notifications.extend(
                notifications
            )

    return created_notifications

# ============================================================
# SYSTEM ALERT
# ============================================================

def notify_system_alert(
    db: Session,
    company_id: int,
    title: str,
    message: str,
    priority: str = "High",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    expires_in_hours: int = 24,
):
    """
    Create a system-level notification for all active Admin users.
    """

    return notify_admins(
        db=db,
        company_id=company_id,
        notification_type="System Alert",
        title=title,
        message=message,
        priority=priority,
        resource_type=resource_type,
        resource_id=resource_id,
        expires_in_hours=expires_in_hours,
    )    