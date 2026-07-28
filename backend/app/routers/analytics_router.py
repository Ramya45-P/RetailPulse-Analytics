from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.category import Category


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/dashboard")
def get_dashboard_analytics(
    company_id: int,
    db: Session = Depends(get_db)
):

    # Total Revenue
    total_revenue = (
        db.query(func.sum(Sale.total_amount))
        .filter(Sale.company_id == company_id)
        .scalar()
        or 0
    )


    # Total Orders
    total_orders = (
        db.query(func.count(Sale.id))
        .filter(Sale.company_id == company_id)
        .scalar()
        or 0
    )


    # Products Sold
    total_products_sold = (
        db.query(func.sum(SaleItem.quantity))
        .join(
            Sale,
            Sale.id == SaleItem.sale_id
        )
        .filter(
            Sale.company_id == company_id
        )
        .scalar()
        or 0
    )


    # Average Order Value
    average_order_value = (
        total_revenue / total_orders
        if total_orders > 0
        else 0
    )


    # Inventory Value
    inventory_value = (
        db.query(
            func.sum(
                Inventory.available_stock *
                Product.cost_price
            )
        )
        .join(
            Product,
            Product.id == Inventory.product_id
        )
        .filter(
            Inventory.company_id == company_id
        )
        .scalar()
        or 0
    )


    # Low Stock Products
    low_stock_products = (
        db.query(func.count(Inventory.id))
        .filter(
            Inventory.company_id == company_id,
            Inventory.available_stock <= Inventory.reorder_level,
            Inventory.available_stock > 0
        )
        .scalar()
        or 0
    )


    # Out Of Stock Products
    out_of_stock_products = (
        db.query(func.count(Inventory.id))
        .filter(
            Inventory.company_id == company_id,
            Inventory.available_stock == 0
        )
        .scalar()
        or 0
    )


    # Categories
    total_categories = (
        db.query(func.count(Category.id))
        .filter(
            Category.company_id == company_id
        )
        .scalar()
        or 0
    )


    return {

        "kpis": {

            "total_revenue": round(total_revenue,2),

            "total_orders": total_orders,

            "total_products_sold": total_products_sold,

            "average_order_value":
                round(average_order_value,2),

            "total_inventory_value":
                round(inventory_value,2),

            "low_stock_products":
                low_stock_products,

            "out_of_stock_products":
                out_of_stock_products,

            "total_categories":
                total_categories
        }

    }