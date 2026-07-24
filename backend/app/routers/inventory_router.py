from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product import Product


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


@router.get("/")
def get_inventory(
    company_id: int,
    db: Session = Depends(get_db)
):

    products = (
        db.query(Product)
        .filter(Product.company_id == company_id)
        .all()
    )

    return [
        {
            "id": product.id,
            "product_name": product.name,
            "stock": product.stock_quantity
        }
        for product in products
    ]