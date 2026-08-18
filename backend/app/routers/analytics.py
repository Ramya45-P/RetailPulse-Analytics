from fastapi import APIRouter, Depends, Query
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


# -----------------------------------
# Sales Summary (KPI Cards)
# -----------------------------------
@router.get("/sales/summary")
def sales_summary(
    filter_type: str = Query("30days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales_summary(
        db=db,
        company_id=current_user.company_id,
        filter_type=filter_type,
    )


# -----------------------------------
# Revenue Trend
# -----------------------------------
@router.get("/sales/trend")
def sales_trend(
    period: str = Query("monthly"),
    filter_type: str = Query("30days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales_trend(
        db=db,
        company_id=current_user.company_id,
        period=period,
        filter_type=filter_type,
    )


# -----------------------------------
# Top Products
# -----------------------------------
@router.get("/sales/products")
def top_products(
    sort_by: str = Query("revenue"),
    filter_type: str = Query("30days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_top_products(
        db=db,
        company_id=current_user.company_id,
        sort_by=sort_by,
        filter_type=filter_type,
    )


# -----------------------------------
# Customer Revenue Analysis
# -----------------------------------
@router.get("/sales/customers")
def customer_analytics(
    filter_type: str = Query("30days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_customer_analytics(
        db=db,
        company_id=current_user.company_id,
        filter_type=filter_type,
    )


# -----------------------------------
# Payment Method Analysis
# -----------------------------------
@router.get("/sales/payment-methods")
def payment_method_analytics(
    filter_type: str = Query("30days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_payment_method_analytics(
        db=db,
        company_id=current_user.company_id,
        filter_type=filter_type,
    )