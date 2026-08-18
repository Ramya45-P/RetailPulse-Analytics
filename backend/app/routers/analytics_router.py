from fastapi import APIRouter, Depends
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
    tags=["Analytics"],
)


@router.get("/sales/summary")
def sales_summary(
    filter_type: str = "30days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales_summary(db, current_user.company_id, filter_type)


@router.get("/sales/trend")
def sales_trend(
    period: str = "monthly",
    filter_type: str = "30days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales_trend(db, current_user.company_id, period, filter_type)


@router.get("/sales/products")
def sales_products(
    sort_by: str = "revenue",
    filter_type: str = "30days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_top_products(db, current_user.company_id, sort_by, filter_type)


@router.get("/sales/customers")
def sales_customers(
    filter_type: str = "30days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_customer_analytics(db, current_user.company_id, filter_type)


@router.get("/sales/payment-methods")
def payment_methods(
    filter_type: str = "30days",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_payment_method_analytics(db, current_user.company_id, filter_type)