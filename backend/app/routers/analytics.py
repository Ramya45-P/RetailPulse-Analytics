from datetime import date
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

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
        description="Custom start date in YYYY-MM-DD format",
    ),
    end_date: Optional[date] = Query(
        None,
        description="Custom end date in YYYY-MM-DD format",
    ),
    product_id: Optional[int] = Query(
        None,
        description="Optional product filter",
    ),
    category_id: Optional[int] = Query(
        None,
        description="Optional category filter",
    ),
    customer_id: Optional[int] = Query(
        None,
        description="Optional customer filter",
    ),
    payment_method: Optional[str] = Query(
        None,
        description="Optional payment method filter",
    ),
):
    """
    Common filters used by all Sales Analytics endpoints.

    Required date filters:
        today
        7days
        30days
        90days
        this_month
        last_month
        custom

    Optional filters:
        product_id
        category_id
        customer_id
        payment_method
    """

    valid_filters = {
        "today",
        "7days",
        "30days",
        "90days",
        "this_month",
        "last_month",
        "custom",
    }

    # --------------------------------------------------------
    # Validate filter type
    # --------------------------------------------------------

    if filter_type not in valid_filters:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid filter_type. "
                "Use today, 7days, 30days, 90days, "
                "this_month, last_month, or custom."
            ),
        )

    # --------------------------------------------------------
    # Validate custom dates
    # --------------------------------------------------------

    if filter_type == "custom":

        if not start_date or not end_date:
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
                detail=(
                    "start_date cannot be after end_date."
                ),
            )

    # --------------------------------------------------------
    # Prevent unnecessary custom dates on other filters
    # --------------------------------------------------------

    if filter_type != "custom":
        start_date = None
        end_date = None

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
    """
    Returns Sales Analytics KPI summary.

    Includes:
        - Total Revenue
        - Total Orders
        - Average Order Value
        - Total Items Sold
        - Total Discount
        - Total Tax
    """

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
    """
    Returns revenue and order trends.

    Supported periods:
        - daily
        - weekly
        - monthly
    """

    if period not in {
        "daily",
        "weekly",
        "monthly",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid period. "
                "Use daily, weekly, or monthly."
            ),
        )

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
    """
    Returns top performing products.
    """

    if sort_by not in {
        "revenue",
        "quantity",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid sort_by. "
                "Use revenue or quantity."
            ),
        )

    return get_top_products(
        db=db,
        company_id=current_user.company_id,
        sort_by=sort_by,
        **filters,
    )


# ============================================================
# CUSTOMER REVENUE ANALYSIS
# ============================================================

@router.get("/sales/customers")
def customer_analytics(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns customer revenue contribution.

    Includes:
        - Customer Name
        - Orders
        - Total Spend
        - Average Order Value
    """

    return get_customer_analytics(
        db=db,
        company_id=current_user.company_id,
        **filters,
    )


# ============================================================
# PAYMENT METHOD ANALYSIS
# ============================================================

@router.get("/sales/payment-methods")
def payment_method_analytics(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns payment method analytics.

    Includes:
        - Payment Method
        - Transactions
        - Revenue
    """

    return get_payment_method_analytics(
        db=db,
        company_id=current_user.company_id,
        **filters,
    )