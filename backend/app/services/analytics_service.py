from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer


# -----------------------------
# Date Range Helper
# -----------------------------
def get_date_range(filter_type: str):
    today = datetime.now()

    if filter_type == "today":
        start = datetime(today.year, today.month, today.day)
        end = today

    elif filter_type == "7days":
        start = today - timedelta(days=7)
        end = today

    elif filter_type == "30days":
        start = today - timedelta(days=30)
        end = today

    elif filter_type == "this_month":
        start = datetime(today.year, today.month, 1)
        end = today

    elif filter_type == "last_month":
        first_this_month = datetime(today.year, today.month, 1)
        end = first_this_month - timedelta(seconds=1)
        start = datetime(end.year, end.month, 1)

    else:
        start = None
        end = None

    return start, end


# -----------------------------
# Sales Summary (KPI Cards)
# -----------------------------
from sqlalchemy import func

def get_sales_summary(db: Session, company_id: int, filter_type: str = "30days"):
    start, end = get_date_range(filter_type)

    sales_query = db.query(Sale).filter(Sale.company_id == company_id)

    if start and end:
        sales_query = sales_query.filter(
            Sale.created_at.between(start, end)
        )

    total_revenue = (
        sales_query.with_entities(
            func.coalesce(func.sum(Sale.total_amount), 0)
        ).scalar()
    )

    total_orders = sales_query.count()

    # SaleItem calculations
    item_query = (
        db.query(
            func.coalesce(func.sum(SaleItem.quantity), 0).label("items"),
            func.coalesce(func.sum(SaleItem.discount), 0).label("discount"),
            func.coalesce(func.sum(SaleItem.tax), 0).label("tax"),
        )
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
    )

    if start and end:
        item_query = item_query.filter(
            Sale.created_at.between(start, end)
        )

    totals = item_query.first()

    average_order_value = (
        total_revenue / total_orders if total_orders else 0
    )

    return {
        "total_revenue": round(float(total_revenue), 2),
        "total_orders": total_orders,
        "average_order_value": round(float(average_order_value), 2),
        "total_items_sold": int(totals.items or 0),
        "total_discount": round(float(totals.discount or 0), 2),
        "total_tax": round(float(totals.tax or 0), 2),
    }

# -----------------------------
# Revenue Trend
# -----------------------------
def get_sales_trend(
    db: Session,
    company_id: int,
    period: str = "monthly",
    filter_type: str = "30days"
):

    start, end = get_date_range(filter_type)

    if period == "daily":
        group_field = func.date_trunc("day", Sale.created_at)

    elif period == "weekly":
        group_field = func.date_trunc("week", Sale.created_at)

    else:
        group_field = func.date_trunc("month", Sale.created_at)

    query = (
        db.query(
            group_field.label("period"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
            func.count(Sale.id).label("orders"),
        )
        .filter(Sale.company_id == company_id)
    )

    if start and end:
        query = query.filter(
            Sale.created_at.between(start, end)
        )

    query = query.group_by(group_field).order_by(group_field)

    results = query.all()

    return [
        {
            "period": row.period.strftime("%Y-%m-%d"),
            "revenue": float(row.revenue),
            "orders": row.orders,
        }
        for row in results
    ]


# -----------------------------
# Top Products
# -----------------------------
def get_top_products(
    db: Session,
    company_id: int,
    sort_by: str = "revenue",
    filter_type: str = "30days"
):

    start, end = get_date_range(filter_type)

    query = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.coalesce(func.sum(SaleItem.quantity), 0).label("quantity_sold"),
            func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
        )
        .join(SaleItem, Product.id == SaleItem.product_id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
    )

    if start and end:
        query = query.filter(
            Sale.created_at.between(start, end)
        )

    query = query.group_by(Product.id, Product.name)

    if sort_by == "quantity":
        query = query.order_by(
            func.sum(SaleItem.quantity).desc()
        )
    else:
        query = query.order_by(
            func.sum(SaleItem.total).desc()
        )

    results = query.limit(10).all()

    return [
        {
            "product_id": row.product_id,
            "product_name": row.product_name,
            "quantity_sold": int(row.quantity_sold),
            "revenue": float(row.revenue),
        }
        for row in results
    ]


# -----------------------------
# Customer Revenue Analysis
# -----------------------------
def get_customer_analytics(
    db: Session,
    company_id: int,
    filter_type: str = "30days"
):

    start, end = get_date_range(filter_type)

    query = (
        db.query(
            Customer.id.label("customer_id"),
            Customer.full_name.label("customer_name"),
            func.count(Sale.id).label("orders"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_spend"),
            func.coalesce(func.avg(Sale.total_amount), 0).label("average_order"),
        )
        .join(Sale, Customer.id == Sale.customer_id)
        .filter(Sale.company_id == company_id)
    )

    if start and end:
        query = query.filter(
            Sale.created_at.between(start, end)
        )

    query = (
        query.group_by(Customer.id, Customer.full_name)
        .order_by(func.sum(Sale.total_amount).desc())
    )

    results = query.all()

    return [
        {
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "orders": row.orders,
            "total_spend": float(row.total_spend),
            "average_order_value": round(float(row.average_order), 2),
        }
        for row in results
    ]


# -----------------------------
# Payment Method Analysis
# -----------------------------
def get_payment_method_analytics(
    db: Session,
    company_id: int,
    filter_type: str = "30days"
):

    start, end = get_date_range(filter_type)

    query = (
        db.query(
            Sale.payment_method,
            func.count(Sale.id).label("transactions"),
            func.coalesce(func.sum(Sale.total_amount), 0).label("revenue"),
        )
        .filter(Sale.company_id == company_id)
    )

    if start and end:
        query = query.filter(
            Sale.created_at.between(start, end)
        )

    query = query.group_by(Sale.payment_method)

    results = query.all()

    return [
        {
            "payment_method": row.payment_method,
            "transactions": row.transactions,
            "revenue": float(row.revenue),
        }
        for row in results
    ]