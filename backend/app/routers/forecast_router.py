from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user

from app.models.user import User
from app.models.demand_forecast import DemandForecast
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.category import Category

from app.services.forecast_service import generate_product_forecast


router = APIRouter(
    prefix="/forecast",
    tags=["Forecast"]
)


# =========================================================
# GENERATE FORECAST
# =========================================================

@router.post("/generate/{product_id}")
def generate_forecast(
    product_id: int,

    forecast_days: int = Query(
        30,
        description="Forecast period: 7, 30, or 90 days"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    """
    Generate a product demand forecast.
    """

    if forecast_days not in [7, 30, 90]:
        raise HTTPException(
            status_code=400,
            detail="forecast_days must be 7, 30, or 90"
        )

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    try:
        forecast = generate_product_forecast(
            db=db,
            company_id=current_user.company_id,
            product_id=product_id,
            forecast_days=forecast_days
        )

        return forecast

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# =========================================================
# GET ALL FORECASTS
# =========================================================

@router.get("/")
def get_forecasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all forecasts belonging to the
    logged-in user's company.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    forecasts = (
        db.query(DemandForecast)
        .filter(
            DemandForecast.company_id == current_user.company_id
        )
        .order_by(
            DemandForecast.created_at.desc()
        )
        .all()
    )

    return forecasts


# =========================================================
# GET PRODUCT FORECAST
# =========================================================

@router.get("/product/{product_id}")
def get_product_forecast(
    product_id: int,

    forecast_period: str = Query(
        "Next 7 Days",
        description="Forecast period: Next 7 Days, Next 30 Days, or Next 90 Days"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    """
    Get the latest forecast for a product
    and selected forecast period.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    if forecast_period not in [
        "Next 7 Days",
        "Next 30 Days",
        "Next 90 Days"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid forecast period"
        )

    forecast = (
        db.query(DemandForecast)
        .filter(
            DemandForecast.product_id == product_id,
            DemandForecast.company_id == current_user.company_id,
            DemandForecast.forecast_period == forecast_period
        )
        .order_by(
            DemandForecast.created_at.desc()
        )
        .first()
    )

    if not forecast:
        raise HTTPException(
            status_code=404,
            detail="Forecast not found"
        )

    return forecast


# =========================================================
# GET CATEGORY FORECASTS
# =========================================================

@router.get("/category")
def get_category_forecasts(
    forecast_period: str = Query(
        "Next 30 Days",
        description="Forecast period"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    """
    Get category-level demand forecasts.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    if forecast_period not in [
        "Next 7 Days",
        "Next 30 Days",
        "Next 90 Days"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid forecast period"
        )

    forecasts = (
        db.query(
            DemandForecast,
            Product
        )
        .join(
            Product,
            DemandForecast.product_id == Product.id
        )
        .filter(
            DemandForecast.company_id == current_user.company_id,
            DemandForecast.forecast_period == forecast_period,
            Product.company_id == current_user.company_id,
            Product.status == "Active"
        )
        .all()
    )

    category_data = {}

    # -----------------------------------------------------
    # GROUP PRODUCT FORECASTS BY CATEGORY
    # -----------------------------------------------------

    for forecast, product in forecasts:

        category_id = product.category_id

        if category_id not in category_data:
            category_data[category_id] = {
                "category_id": category_id,
                "total_historical_sales": 0,
                "predicted_demand": 0,
                "product_count": 0
            }

        category_data[category_id]["predicted_demand"] += (
            forecast.predicted_demand or 0
        )

        # Historical period
        # Forecast average_sales is based on 30 days
        category_data[category_id]["total_historical_sales"] += (
            (forecast.average_sales or 0) * 30
        )

        category_data[category_id]["product_count"] += 1

    # -----------------------------------------------------
    # BUILD CATEGORY RESPONSE
    # -----------------------------------------------------

    result = []

    for category_id, data in category_data.items():

        category = (
            db.query(Category)
            .filter(
                Category.id == category_id
            )
            .first()
        )

        category_name = (
            category.name
            if category
            else f"Category {category_id}"
        )

        historical_sales = data["total_historical_sales"]
        predicted_demand = data["predicted_demand"]

        if historical_sales > 0:
            expected_growth = (
                (
                    predicted_demand
                    - historical_sales
                )
                / historical_sales
            ) * 100
        else:
            expected_growth = 0

        result.append({
            "category_id": category_id,
            "category": category_name,
            "total_historical_sales": round(
                historical_sales,
                2
            ),
            "predicted_demand": round(
                predicted_demand,
                2
            ),
            "expected_growth_percentage": round(
                expected_growth,
                2
            ),
            "product_count": data["product_count"]
        })

    return result


# =========================================================
# FORECAST ANALYTICS
# =========================================================

@router.get("/analytics")
def get_forecast_analytics(
    forecast_period: str = Query(
        "Next 7 Days",
        description="Forecast period"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    """
    Get forecast analytics KPIs for the
    logged-in user's company.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    if forecast_period not in [
        "Next 7 Days",
        "Next 30 Days",
        "Next 90 Days"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid forecast period"
        )

    # -----------------------------------------------------
    # GET FORECASTS
    # -----------------------------------------------------

    forecasts = (
        db.query(DemandForecast)
        .join(
            Product,
            DemandForecast.product_id == Product.id
        )
        .filter(
            DemandForecast.company_id == current_user.company_id,
            DemandForecast.forecast_period == forecast_period,
            Product.company_id == current_user.company_id,
            Product.status == "Active"
        )
        .order_by(
            DemandForecast.created_at.desc()
        )
        .all()
    )

    # -----------------------------------------------------
    # KPI INITIAL VALUES
    # -----------------------------------------------------

    total_predicted_demand = 0.0
    products_expected_to_run_out = 0
    high_growth_products = 0
    slow_moving_products = 0
    confidence_total = 0.0

    # Prevent duplicate products
    processed_products = set()

    # -----------------------------------------------------
    # PROCESS FORECASTS
    # -----------------------------------------------------

    for forecast in forecasts:

        # Only count each product once
        if forecast.product_id in processed_products:
            continue

        processed_products.add(
            forecast.product_id
        )

        predicted_demand = float(
            forecast.predicted_demand or 0
        )

        average_sales = float(
            forecast.average_sales or 0
        )

        confidence_score = float(
            forecast.confidence_score or 0
        )

        # -------------------------------------------------
        # TOTAL PREDICTED DEMAND
        # -------------------------------------------------

        total_predicted_demand += predicted_demand

        confidence_total += confidence_score

        # -------------------------------------------------
        # GET INVENTORY
        # -------------------------------------------------

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.company_id == current_user.company_id,
                Inventory.product_id == forecast.product_id
            )
            .first()
        )

        current_stock = 0

        if inventory:
            current_stock = float(
                inventory.available_stock or 0
            )

        # -------------------------------------------------
        # PRODUCTS EXPECTED TO RUN OUT
        # -------------------------------------------------

        if current_stock < predicted_demand:
            products_expected_to_run_out += 1

        # -------------------------------------------------
        # HISTORICAL SALES
        # -------------------------------------------------

        historical_sales = average_sales * 30

        # -------------------------------------------------
        # HIGH GROWTH PRODUCTS
        # -------------------------------------------------

        if historical_sales > 0:

            growth_percentage = (
                (
                    predicted_demand
                    - historical_sales
                )
                / historical_sales
            ) * 100

            if growth_percentage >= 20:
                high_growth_products += 1

        # -------------------------------------------------
        # SLOW MOVING PRODUCTS
        # -------------------------------------------------

        if average_sales < 0.1:
            slow_moving_products += 1

    # -----------------------------------------------------
    # FORECAST ACCURACY
    # -----------------------------------------------------

    if processed_products:

        forecast_accuracy = (
            confidence_total
            / len(processed_products)
        )

    else:

        forecast_accuracy = 0

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "forecast_period": forecast_period,

        "total_predicted_demand": round(
            total_predicted_demand,
            2
        ),

        "products_expected_to_run_out":
            products_expected_to_run_out,

        "high_growth_products":
            high_growth_products,

        "slow_moving_products":
            slow_moving_products,

        "forecast_accuracy": round(
            forecast_accuracy,
            2
        ),

        "forecast_count":
            len(processed_products)
    }