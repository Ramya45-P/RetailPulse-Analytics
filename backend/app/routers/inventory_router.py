from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user

from app.models.user import User

from app.services.inventory_forecast_service import (
    get_inventory_forecast,
    get_product_inventory_recommendation,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


# =========================================================
# EXISTING INVENTORY
# =========================================================

@router.get("/")
def get_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current inventory for the logged-in user's company.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    from app.models.product import Product

    products = (
        db.query(Product)
        .filter(
            Product.company_id == current_user.company_id,
            Product.status == "Active"
        )
        .all()
    )

    return [
        {
            "id": product.id,
            "product_name": product.name,
            "stock": product.stock_quantity
        }
        for product in products
    ]


# =========================================================
# TASK 11 — INVENTORY FORECAST
# =========================================================

@router.get("/forecast")
def inventory_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory forecast and replenishment analysis
    for all active products belonging to the company.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    try:

        result = get_inventory_forecast(
            db=db,
            company_id=current_user.company_id
        )

        return {
            "forecast_period_days": 7,
            "lookback_period_days": 30,
            "count": len(result),
            "data": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate inventory forecast: {str(e)}"
        )


# =========================================================
# TASK 11 — ALL RECOMMENDATIONS
# =========================================================

@router.get("/recommendations")
def inventory_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory replenishment recommendations
    for all active products.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    try:

        forecasts = get_inventory_forecast(
            db=db,
            company_id=current_user.company_id
        )

        # -------------------------------------------------
        # SUMMARY
        # -------------------------------------------------

        products_requiring_reorder = sum(
            1
            for item in forecasts
            if item["reorder_required"]
        )

        stockout_risk = sum(
            1
            for item in forecasts
            if item["stock_risk"] == "Stockout Risk"
        )

        out_of_stock = sum(
            1
            for item in forecasts
            if item["stock_risk"] == "Out of Stock"
        )

        low_stock = sum(
            1
            for item in forecasts
            if item["stock_risk"] == "Low Stock"
        )

        overstock = sum(
            1
            for item in forecasts
            if item["stock_risk"] == "Overstock"
        )

        healthy = sum(
            1
            for item in forecasts
            if item["stock_risk"] == "Healthy"
        )

        return {
            "summary": {
                "total_products": len(forecasts),

                "products_requiring_reorder":
                    products_requiring_reorder,

                "out_of_stock":
                    out_of_stock,

                "stockout_risk":
                    stockout_risk,

                "low_stock":
                    low_stock,

                "overstock":
                    overstock,

                "healthy":
                    healthy
            },

            "data": forecasts
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate inventory recommendations: {str(e)}"
        )


# =========================================================
# TASK 11 — PRODUCT RECOMMENDATION
# =========================================================

@router.get("/recommendations/{product_id}")
def product_inventory_recommendation(
    product_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)
):
    """
    Get inventory recommendation for a specific product.
    """

    if not current_user.company_id:
        raise HTTPException(
            status_code=400,
            detail="User is not associated with a company"
        )

    result = get_product_inventory_recommendation(
        db=db,
        company_id=current_user.company_id,
        product_id=product_id
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail="Active product not found"
        )

    return result