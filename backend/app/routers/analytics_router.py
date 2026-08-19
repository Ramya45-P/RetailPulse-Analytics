from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.analytics_service import (
    get_sales_summary,
    get_sales_trend,
    get_top_products,
    get_customer_analytics,
    get_payment_method_analytics,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Sales Analytics"],
)


# ============================================================
# COMMON ANALYTICS FILTERS
# ============================================================

def analytics_filters(
    filter_type: str = Query(
        "30days",
        description="today, 7days, 30days, 90days, this_month, last_month, custom",
    ),
    start_date: Optional[date] = Query(
        None,
        description="Required for custom filter",
    ),
    end_date: Optional[date] = Query(
        None,
        description="Required for custom filter",
    ),
    product_id: Optional[int] = Query(
        None,
        description="Filter by product ID",
    ),
    category_id: Optional[int] = Query(
        None,
        description="Filter by category ID",
    ),
    customer_id: Optional[int] = Query(
        None,
        description="Filter by customer ID",
    ),
    payment_method: Optional[str] = Query(
        None,
        description="Filter by payment method",
    ),
):
    """
    Common filters used by all Sales Analytics endpoints.
    """

    if filter_type == "custom":

        if start_date is None or end_date is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "start_date and end_date are required "
                    "when filter_type is 'custom'."
                ),
            )

        if start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="start_date cannot be after end_date.",
            )

    return {
        "filter_type": filter_type,
        "start_date": (
            start_date.isoformat()
            if start_date
            else None
        ),
        "end_date": (
            end_date.isoformat()
            if end_date
            else None
        ),
        "product_id": product_id,
        "category_id": category_id,
        "customer_id": customer_id,
        "payment_method": payment_method,
    }


# ============================================================
# SALES SUMMARY
# ============================================================

@router.get("/sales/summary")
def sales_summary(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales_summary(
        db=db,
        company_id=current_user.company_id,
        **filters,
    )


# ============================================================
# SALES TREND
# ============================================================

@router.get("/sales/trend")
def sales_trend(
    period: str = Query(
        "monthly",
        description="daily, weekly, or monthly",
    ),
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales_trend(
        db=db,
        company_id=current_user.company_id,
        period=period,
        **filters,
    )


# ============================================================
# TOP PRODUCTS
# ============================================================

@router.get("/sales/products")
def top_products(
    sort_by: str = Query(
        "revenue",
        description="revenue or quantity",
    ),
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_top_products(
        db=db,
        company_id=current_user.company_id,
        sort_by=sort_by,
        **filters,
    )


# ============================================================
# CUSTOMER ANALYTICS
# ============================================================

@router.get("/sales/customers")
def customer_analytics(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_customer_analytics(
        db=db,
        company_id=current_user.company_id,
        **filters,
    )


# ============================================================
# PAYMENT METHOD ANALYTICS
# ============================================================

@router.get("/sales/payment-methods")
def payment_method_analytics(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_payment_method_analytics(
        db=db,
        company_id=current_user.company_id,
        **filters,
    )