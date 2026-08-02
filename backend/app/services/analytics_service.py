from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.category import Category


def get_dashboard_analytics(db: Session, company_id: int):

    total_revenue = (
        db.query(func.sum(Sale.total_amount))
        .filter(Sale.company_id == company_id)
        .scalar()
        or 0
    )

    total_orders = (
        db.query(Sale)
        .filter(Sale.company_id == company_id)
        .count()
    )

    total_products_sold = (
        db.query(func.sum(SaleItem.quantity))
        .join(Sale)
        .filter(Sale.company_id == company_id)
        .scalar()
        or 0
    )

    average_order_value = (
        total_revenue / total_orders
        if total_orders > 0
        else 0
    )

    inventory_value = (
        db.query(
            func.sum(Product.stock_quantity * Product.cost_price)
        )
        .filter(Product.company_id == company_id)
        .scalar()
        or 0
    )

    low_stock = (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            Product.stock_quantity <= 10,
            Product.stock_quantity > 0,
        )
        .count()
    )

    out_of_stock = (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            Product.stock_quantity == 0,
        )
        .count()
    )

    total_categories = (
        db.query(Category)
        .filter(Category.company_id == company_id)
        .count()
    )

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products_sold": total_products_sold,
        "average_order_value": average_order_value,
        "total_inventory_value": inventory_value,
        "low_stock_products": low_stock,
        "out_of_stock_products": out_of_stock,
        "total_categories": total_categories,
    }