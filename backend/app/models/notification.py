from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)

from datetime import datetime

from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # Company isolation
    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    # Notification recipient
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # Notification category
    type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    # Notification content
    title = Column(
        String(255),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    # Priority: Low / Medium / High / Critical
    priority = Column(
        String(20),
        nullable=False,
        default="Low",
        index=True,
    )

    # Related resource
    resource_type = Column(
        String(50),
        nullable=True,
    )

    resource_id = Column(
        Integer,
        nullable=True,
    )

    # Read state
    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    read_at = Column(
        DateTime,
        nullable=True,
    )

    # Lifecycle
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    expires_at = Column(
        DateTime,
        nullable=True,
    )