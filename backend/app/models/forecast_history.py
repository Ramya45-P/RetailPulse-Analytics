from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class ForecastHistory(Base):

    __tablename__ = "forecast_history"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    forecast_id = Column(
        Integer,
        ForeignKey("demand_forecasts.id"),
        nullable=False
    )


    actual_demand = Column(
        Float,
        default=0
    )


    predicted_demand = Column(
        Float,
        default=0
    )


    accuracy_percentage = Column(
        Float,
        default=0
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    forecast = relationship(
        "DemandForecast",
        back_populates="history"
    )