from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.category import Category


def get_dashboard_stats(
    db: Session,
    company_id: int
):

    total_products = db.query(Product).filter(
        Product.company_id == company_id
    ).count()


    total_categories = db.query(Category).filter(
        Category.company_id == company_id
    ).count()


    products = db.query(Product).filter(
        Product.company_id == company_id
    ).all()


    total_stock = sum(
        product.stock_quantity
        for product in products
    )


    low_stock = db.query(Product).filter(
        Product.company_id == company_id,
        Product.stock_quantity < 10
    ).count()


    return {
        "total_products": total_products,
        "total_categories": total_categories,
        "total_stock": total_stock,
        "low_stock_products": low_stock
    }