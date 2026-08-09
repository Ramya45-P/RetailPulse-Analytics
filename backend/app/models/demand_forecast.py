from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class DemandForecast(Base):

    __tablename__ = "demand_forecasts"


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


    forecast_period = Column(
        String(50),
        nullable=False
    )
    # Example:
    # "Weekly"
    # "Monthly"


    predicted_demand = Column(
        Float,
        nullable=False
    )


    average_sales = Column(
        Float,
        default=0
    )


    confidence_score = Column(
        Float,
        default=0
    )
    # Example:
    # 85.5 means 85.5% confidence


    recommended_stock = Column(
        Float,
        default=0
    )


    reorder_recommended = Column(
        String(50),
        default="No"
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    company = relationship(
        "Company"
    )


    product = relationship(
        "Product"
    )

    history = relationship(
    "ForecastHistory",
    back_populates="forecast",
    cascade="all, delete"
)