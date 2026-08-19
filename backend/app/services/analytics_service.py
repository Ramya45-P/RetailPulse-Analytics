from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import func, exists
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer


# =====================================================
# DATE RANGE HELPER
# =====================================================

def get_date_range(
    filter_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Returns the start and end datetime for the requested
    analytics date filter.

    Supported filters:
    - today
    - 7days
    - 30days
    - 90days
    - this_month
    - last_month
    - custom
    """

    today = datetime.now()

    # -----------------------------
    # Today
    # -----------------------------
    if filter_type == "today":

        start = datetime(
            today.year,
            today.month,
            today.day,
        )

        end = today

    # -----------------------------
    # Last 7 Days
    # -----------------------------
    elif filter_type == "7days":

        start = today - timedelta(days=7)
        end = today

    # -----------------------------
    # Last 30 Days
    # -----------------------------
    elif filter_type == "30days":

        start = today - timedelta(days=30)
        end = today

    # -----------------------------
    # Last 90 Days
    # -----------------------------
    elif filter_type == "90days":

        start = today - timedelta(days=90)
        end = today

    # -----------------------------
    # This Month
    # -----------------------------
    elif filter_type == "this_month":

        start = datetime(
            today.year,
            today.month,
            1,
        )

        end = today

    # -----------------------------
    # Last Month
    # -----------------------------
    elif filter_type == "last_month":

        first_this_month = datetime(
            today.year,
            today.month,
            1,
        )

        end = (
            first_this_month
            - timedelta(microseconds=1)
        )

        start = datetime(
            end.year,
            end.month,
            1,
        )

    # -----------------------------
    # Custom Date Range
    # -----------------------------
    elif filter_type == "custom":

        if not start_date or not end_date:
            raise ValueError(
                "start_date and end_date are required "
                "for custom date range"
            )

        try:
            start = datetime.strptime(
                start_date,
                "%Y-%m-%d",
            )

            end = datetime.strptime(
                end_date,
                "%Y-%m-%d",
            )

        except ValueError:
            raise ValueError(
                "Dates must use YYYY-MM-DD format"
            )

        if start > end:
            raise ValueError(
                "start_date cannot be after end_date"
            )

        # Include complete end date.
        end = (
            end
            + timedelta(days=1)
            - timedelta(microseconds=1)
        )

    # -----------------------------
    # Invalid Filter
    # -----------------------------
    else:

        raise ValueError(
            f"Invalid filter_type: {filter_type}"
        )

    return start, end


# =====================================================
# COMMON SALES FILTERS
# =====================================================

def apply_sales_filters(
    query,
    company_id: int,
    start,
    end,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    """
    Applies common filters to Sale-based queries.

    Product and category filters use EXISTS so that
    Sale rows are not duplicated.

    This is important for correct:
    - revenue
    - order count
    - average order value
    """

    # -----------------------------
    # Company Isolation
    # -----------------------------

    query = query.filter(
        Sale.company_id == company_id
    )

    # -----------------------------
    # Date Range
    # -----------------------------

    query = query.filter(
        Sale.created_at.between(
            start,
            end,
        )
    )

    # -----------------------------
    # Product Filter
    # -----------------------------

    if product_id is not None:

        query = query.filter(
            exists().where(
                (SaleItem.sale_id == Sale.id)
                & (
                    SaleItem.product_id
                    == product_id
                )
            )
        )

    # -----------------------------
    # Category Filter
    # -----------------------------

    if category_id is not None:

        query = query.filter(
            exists().where(
                (SaleItem.sale_id == Sale.id)
                & (
                    SaleItem.product_id
                    == Product.id
                )
                & (
                    Product.category_id
                    == category_id
                )
            )
        )

    # -----------------------------
    # Customer Filter
    # -----------------------------

    if customer_id is not None:

        query = query.filter(
            Sale.customer_id == customer_id
        )

    # -----------------------------
    # Payment Method Filter
    # -----------------------------

    if payment_method is not None:

        query = query.filter(
            Sale.payment_method
            == payment_method
        )

    return query


# =====================================================
# SALES SUMMARY / KPI CARDS
# =====================================================

def get_sales_summary(
    db: Session,
    company_id: int,
    filter_type: str = "30days",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    """
    Calculates:

    - Total Revenue
    - Total Orders
    - Average Order Value
    - Total Items Sold
    - Total Discount
    - Total Tax
    """

    start, end = get_date_range(
        filter_type,
        start_date,
        end_date,
    )

    # =================================================
    # SALES QUERY
    # =================================================

    sales_query = apply_sales_filters(
        db.query(Sale),
        company_id,
        start,
        end,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    # =================================================
    # TOTAL REVENUE
    # =================================================

    total_revenue = (
        sales_query
        .with_entities(
            func.coalesce(
                func.sum(
                    Sale.total_amount
                ),
                0,
            )
        )
        .scalar()
    )

    total_revenue = float(
        total_revenue or 0
    )

    # =================================================
    # TOTAL ORDERS
    # =================================================

    total_orders = sales_query.count()

    # =================================================
    # SALE ITEM AGGREGATION
    # =================================================

    item_query = (
        db.query(
            func.coalesce(
                func.sum(
                    SaleItem.quantity
                ),
                0,
            ).label("items"),

            func.coalesce(
                func.sum(
                    SaleItem.discount
                ),
                0,
            ).label("discount"),

            func.coalesce(
                func.sum(
                    SaleItem.tax
                ),
                0,
            ).label("tax"),
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id,
        )
        .filter(
            Sale.company_id == company_id
        )
        .filter(
            Sale.created_at.between(
                start,
                end,
            )
        )
    )

    # =================================================
    # ITEM-LEVEL PRODUCT FILTER
    # =================================================

    if product_id is not None:

        item_query = item_query.filter(
            SaleItem.product_id == product_id
        )

    # =================================================
    # ITEM-LEVEL CATEGORY FILTER
    # =================================================

    if category_id is not None:

        item_query = (
            item_query
            .join(
                Product,
                Product.id
                == SaleItem.product_id,
            )
            .filter(
                Product.category_id
                == category_id
            )
        )

    # =================================================
    # CUSTOMER FILTER
    # =================================================

    if customer_id is not None:

        item_query = item_query.filter(
            Sale.customer_id == customer_id
        )

    # =================================================
    # PAYMENT METHOD FILTER
    # =================================================

    if payment_method is not None:

        item_query = item_query.filter(
            Sale.payment_method
            == payment_method
        )

    totals = item_query.first()

    # =================================================
    # AVERAGE ORDER VALUE
    # =================================================

    average_order_value = (
        total_revenue / total_orders
        if total_orders > 0
        else 0
    )

    # =================================================
    # RESPONSE
    # =================================================

    return {
        "total_revenue": round(
            total_revenue,
            2,
        ),

        "total_orders": total_orders,

        "average_order_value": round(
            float(
                average_order_value
            ),
            2,
        ),

        "total_items_sold": int(
            totals.items or 0
        ),

        "total_discount": round(
            float(
                totals.discount or 0
            ),
            2,
        ),

        "total_tax": round(
            float(
                totals.tax or 0
            ),
            2,
        ),
    }


# =====================================================
# SALES REVENUE TREND
# =====================================================

def get_sales_trend(
    db: Session,
    company_id: int,
    period: str = "monthly",
    filter_type: str = "30days",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    """
    Returns revenue and order count grouped by:

    - daily
    - weekly
    - monthly
    """

    start, end = get_date_range(
        filter_type,
        start_date,
        end_date,
    )

    # =================================================
    # VALIDATE PERIOD
    # =================================================

    if period == "daily":

        group_field = func.date_trunc(
            "day",
            Sale.created_at,
        )

    elif period == "weekly":

        group_field = func.date_trunc(
            "week",
            Sale.created_at,
        )

    elif period == "monthly":

        group_field = func.date_trunc(
            "month",
            Sale.created_at,
        )

    else:

        raise ValueError(
            "Invalid period. "
            "Use daily, weekly, or monthly."
        )

    # =================================================
    # QUERY
    # =================================================

    query = db.query(
        group_field.label("period"),

        func.coalesce(
            func.sum(
                Sale.total_amount
            ),
            0,
        ).label("revenue"),

        func.count(
            Sale.id
        ).label("orders"),
    )

    query = apply_sales_filters(
        query,
        company_id,
        start,
        end,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    query = (
        query
        .group_by(
            group_field
        )
        .order_by(
            group_field
        )
    )

    results = query.all()

    # =================================================
    # RESPONSE
    # =================================================

    return [
        {
            "period": row.period.strftime(
                "%Y-%m-%d"
            ),

            "revenue": float(
                row.revenue or 0
            ),

            "orders": int(
                row.orders or 0
            ),
        }
        for row in results
    ]


# =====================================================
# TOP PRODUCT PERFORMANCE
# =====================================================

def get_top_products(
    db: Session,
    company_id: int,
    sort_by: str = "revenue",
    filter_type: str = "30days",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    """
    Returns top 10 products based on:

    - revenue
    - quantity
    """

    start, end = get_date_range(
        filter_type,
        start_date,
        end_date,
    )

    # =================================================
    # VALIDATE SORT
    # =================================================

    if sort_by not in (
        "revenue",
        "quantity",
    ):
        raise ValueError(
            "sort_by must be revenue or quantity"
        )

    # =================================================
    # PRODUCT QUERY
    # =================================================

    query = (
        db.query(
            Product.id.label(
                "product_id"
            ),

            Product.name.label(
                "product_name"
            ),

            func.coalesce(
                func.sum(
                    SaleItem.quantity
                ),
                0,
            ).label(
                "quantity_sold"
            ),

            func.coalesce(
                func.sum(
                    SaleItem.total
                ),
                0,
            ).label(
                "revenue"
            ),
        )
        .join(
            SaleItem,
            Product.id
            == SaleItem.product_id,
        )
        .join(
            Sale,
            Sale.id
            == SaleItem.sale_id,
        )
        .filter(
            Sale.company_id
            == company_id
        )
        .filter(
            Sale.created_at.between(
                start,
                end,
            )
        )
    )

    # =================================================
    # PRODUCT FILTER
    # =================================================

    if product_id is not None:

        query = query.filter(
            Product.id == product_id
        )

    # =================================================
    # CATEGORY FILTER
    # =================================================

    if category_id is not None:

        query = query.filter(
            Product.category_id
            == category_id
        )

    # =================================================
    # CUSTOMER FILTER
    # =================================================

    if customer_id is not None:

        query = query.filter(
            Sale.customer_id
            == customer_id
        )

    # =================================================
    # PAYMENT FILTER
    # =================================================

    if payment_method is not None:

        query = query.filter(
            Sale.payment_method
            == payment_method
        )

    # =================================================
    # GROUPING
    # =================================================

    query = query.group_by(
        Product.id,
        Product.name,
    )

    # =================================================
    # SORTING
    # =================================================

    if sort_by == "quantity":

        query = query.order_by(
            func.sum(
                SaleItem.quantity
            ).desc()
        )

    else:

        query = query.order_by(
            func.sum(
                SaleItem.total
            ).desc()
        )

    # =================================================
    # TOP 10
    # =================================================

    results = query.limit(10).all()

    return [
        {
            "product_id": row.product_id,

            "product_name": row.product_name,

            "quantity_sold": int(
                row.quantity_sold or 0
            ),

            "revenue": float(
                row.revenue or 0
            ),
        }
        for row in results
    ]


# =====================================================
# CUSTOMER REVENUE ANALYSIS
# =====================================================

def get_customer_analytics(
    db: Session,
    company_id: int,
    filter_type: str = "30days",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    """
    Returns customers ranked by total revenue.

    Fields:

    - customer_id
    - customer_name
    - orders
    - total_spend
    - average_order_value
    """

    start, end = get_date_range(
        filter_type,
        start_date,
        end_date,
    )

    # =================================================
    # CUSTOMER QUERY
    # =================================================

    query = (
        db.query(
            Customer.id.label(
                "customer_id"
            ),

            Customer.full_name.label(
                "customer_name"
            ),

            func.count(
                Sale.id
            ).label(
                "orders"
            ),

            func.coalesce(
                func.sum(
                    Sale.total_amount
                ),
                0,
            ).label(
                "total_spend"
            ),

            func.coalesce(
                func.avg(
                    Sale.total_amount
                ),
                0,
            ).label(
                "average_order"
            ),
        )
        .join(
            Sale,
            Customer.id
            == Sale.customer_id,
        )
        .filter(
            Sale.company_id
            == company_id
        )
        .filter(
            Sale.created_at.between(
                start,
                end,
            )
        )
    )

    # =================================================
    # PRODUCT FILTER
    # =================================================

    if product_id is not None:

        query = query.filter(
            exists().where(
                (SaleItem.sale_id == Sale.id)
                & (
                    SaleItem.product_id
                    == product_id
                )
            )
        )

    # =================================================
    # CATEGORY FILTER
    # =================================================

    if category_id is not None:

        query = query.filter(
            exists().where(
                (SaleItem.sale_id == Sale.id)
                & (
                    SaleItem.product_id
                    == Product.id
                )
                & (
                    Product.category_id
                    == category_id
                )
            )
        )

    # =================================================
    # CUSTOMER FILTER
    # =================================================

    if customer_id is not None:

        query = query.filter(
            Sale.customer_id
            == customer_id
        )

    # =================================================
    # PAYMENT FILTER
    # =================================================

    if payment_method is not None:

        query = query.filter(
            Sale.payment_method
            == payment_method
        )

    # =================================================
    # GROUP & SORT
    # =================================================

    query = (
        query
        .group_by(
            Customer.id,
            Customer.full_name,
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
    )

    results = query.all()

    # =================================================
    # RESPONSE
    # =================================================

    return [
        {
            "customer_id": row.customer_id,

            "customer_name": row.customer_name,

            "orders": int(
                row.orders or 0
            ),

            "total_spend": float(
                row.total_spend or 0
            ),

            "average_order_value": round(
                float(
                    row.average_order or 0
                ),
                2,
            ),
        }
        for row in results
    ]


# =====================================================
# PAYMENT METHOD ANALYSIS
# =====================================================

def get_payment_method_analytics(
    db: Session,
    company_id: int,
    filter_type: str = "30days",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    """
    Groups sales by payment method.

    Returns:

    - payment_method
    - transactions
    - revenue
    """

    start, end = get_date_range(
        filter_type,
        start_date,
        end_date,
    )

    # =================================================
    # QUERY
    # =================================================

    query = db.query(
        Sale.payment_method,

        func.count(
            Sale.id
        ).label(
            "transactions"
        ),

        func.coalesce(
            func.sum(
                Sale.total_amount
            ),
            0,
        ).label(
            "revenue"
        ),
    )

    query = apply_sales_filters(
        query,
        company_id,
        start,
        end,
        product_id,
        category_id,
        customer_id,
        payment_method,
    )

    # =================================================
    # GROUP & SORT
    # =================================================

    query = (
        query
        .group_by(
            Sale.payment_method
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
    )

    results = query.all()

    # =================================================
    # RESPONSE
    # =================================================

    return [
        {
            "payment_method": (
                row.payment_method
                or "Unknown"
            ),

            "transactions": int(
                row.transactions or 0
            ),

            "revenue": float(
                row.revenue or 0
            ),
        }
        for row in results
    ]