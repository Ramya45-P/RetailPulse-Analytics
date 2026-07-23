from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product
from app.models.category import Category
from app.models.sale import Sale
from app.models.sale_item import SaleItem


def get_dashboard_stats(
    db: Session,
    company_id: int
):

    products = db.query(Product).filter(
        Product.company_id == company_id
    ).all()

    categories = db.query(Category).filter(
        Category.company_id == company_id
    ).all()

    sales = db.query(Sale).filter(
        Sale.company_id == company_id
    ).all()

    total_products = len(products)

    active_products = len([
        p for p in products
        if p.status == "Active"
    ])

    inactive_products = total_products - active_products

    total_categories = len(categories)

    total_orders = len(sales)

    total_revenue = sum(
        sale.total_amount
        for sale in sales
    )

    average_order_value = (
        total_revenue / total_orders
        if total_orders > 0 else 0
    )

    total_units_sold = (
        db.query(func.sum(SaleItem.quantity))
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.company_id == company_id)
        .scalar()
        or 0
        
    )
    

    return {
        "totalUnitsSold": total_units_sold,
        "totalRevenue": total_revenue,
        "totalOrders": total_orders,
        "averageOrderValue": average_order_value,
        "totalProducts": total_products,
        "activeProducts": active_products,
        "inactiveProducts": inactive_products,
        "totalCategories": total_categories,
    }