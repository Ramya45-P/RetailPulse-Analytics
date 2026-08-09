from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory


def generate_product_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_days: int = 30
):
    """
    Generate demand forecast for a product.

    Supported forecast periods:
        7 days
        30 days
        90 days

    Forecasts use only sales belonging to the
    logged-in user's company.
    """

    # ---------------------------------------------------------
    # VALIDATE FORECAST PERIOD
    # ---------------------------------------------------------

    if forecast_days not in [7, 30, 90]:
        raise ValueError(
            "Forecast period must be 7, 30, or 90 days"
        )

    forecast_period = f"Next {forecast_days} Days"

    # ---------------------------------------------------------
    # GET ACTIVE PRODUCT
    # ---------------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id == company_id,
            Product.status == "Active"
        )
        .first()
    )

    if not product:
        raise ValueError(
            "Active product not found for this company"
        )

    # ---------------------------------------------------------
    # CHECK DUPLICATE FORECAST
    # ---------------------------------------------------------

    existing_forecast = (
        db.query(DemandForecast)
        .filter(
            DemandForecast.company_id == company_id,
            DemandForecast.product_id == product_id,
            DemandForecast.forecast_period == forecast_period
        )
        .first()
    )

    if existing_forecast:
        raise ValueError(
            f"Forecast already exists for {forecast_period}"
        )

    # ---------------------------------------------------------
    # HISTORICAL SALES - LAST 30 DAYS
    # ---------------------------------------------------------

    thirty_days_ago = (
        datetime.utcnow() - timedelta(days=30)
    )

    total_sales = (
        db.query(
            func.sum(SaleItem.quantity)
        )
        .join(
            Sale,
            SaleItem.sale_id == Sale.id
        )
        .filter(
            Sale.company_id == company_id,
            SaleItem.product_id == product_id,
            Sale.sale_date >= thirty_days_ago
        )
        .scalar()
    )

    # ---------------------------------------------------------
    # REQUIRE HISTORICAL SALES
    # ---------------------------------------------------------

    if total_sales is None or total_sales <= 0:
        raise ValueError(
            "Forecast generation requires historical sales data"
        )

    total_sales = float(total_sales)

    # ---------------------------------------------------------
    # DAILY AVERAGE
    # ---------------------------------------------------------

    average_sales = total_sales / 30

    # ---------------------------------------------------------
    # FORECAST DEMAND
    # ---------------------------------------------------------

    predicted_demand = average_sales * forecast_days

    predicted_demand = round(
        predicted_demand,
        2
    )

    average_sales = round(
        average_sales,
        4
    )

    # ---------------------------------------------------------
    # GET INVENTORY
    # ---------------------------------------------------------

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.company_id == company_id,
            Inventory.product_id == product_id
        )
        .first()
    )

    current_stock = 0
    reorder_level = 0

    if inventory:
        current_stock = inventory.available_stock or 0
        reorder_level = inventory.reorder_level or 0

    # ---------------------------------------------------------
    # INVENTORY RECOMMENDATION
    # IMPORTANT:
    # Values must fit VARCHAR(20)
    # ---------------------------------------------------------

    if current_stock <= 0:
        reorder_recommended = "Immediate"

    elif current_stock < reorder_level:
        reorder_recommended = "Reorder Soon"

    elif current_stock < predicted_demand:
        reorder_recommended = "Reorder Soon"

    elif current_stock > predicted_demand * 2:
        reorder_recommended = "Overstock"

    else:
        reorder_recommended = "Healthy"

    # ---------------------------------------------------------
    # RECOMMENDED STOCK
    # ---------------------------------------------------------

    recommended_stock = max(
        reorder_level,
        predicted_demand
    )

    recommended_stock = round(
        recommended_stock,
        2
    )

    # ---------------------------------------------------------
    # CONFIDENCE SCORE
    # ---------------------------------------------------------

    if total_sales >= 30:
        confidence_score = 85

    elif total_sales >= 15:
        confidence_score = 80

    else:
        confidence_score = 70

    # ---------------------------------------------------------
    # CREATE FORECAST
    # ---------------------------------------------------------

    forecast = DemandForecast(
        company_id=company_id,
        product_id=product_id,
        forecast_period=forecast_period,
        predicted_demand=predicted_demand,
        average_sales=average_sales,
        confidence_score=confidence_score,
        recommended_stock=recommended_stock,
        reorder_recommended=reorder_recommended
    )

    db.add(forecast)
    db.commit()
    db.refresh(forecast)

    # ---------------------------------------------------------
    # CREATE FORECAST HISTORY
    # ---------------------------------------------------------

    history = ForecastHistory(
        forecast_id=forecast.id,
        actual_demand=0,
        predicted_demand=predicted_demand,
        accuracy_percentage=0
    )

    db.add(history)
    db.commit()

    return forecast