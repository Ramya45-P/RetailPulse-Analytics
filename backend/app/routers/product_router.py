from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.product_schema import (
    ProductCreate,
    ProductResponse
)
from app.services.product_service import (
    create_product,
    get_products,
    update_product,
    delete_product
)


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post("/", response_model=ProductResponse)
def create(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    return create_product(
        db,
        product
    )

@router.get("/", response_model=list[ProductResponse])
def get_all(
    company_id: int,
    search: str = None,
    category_id: int = None,
    status: str = None,
    brand: str = None,
    db: Session = Depends(get_db)
):

    return get_products(
    db,
    company_id,
    search,
    category_id,
    status,
    brand
)

@router.put("/{product_id}", response_model=ProductResponse)
def update(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    return update_product(
        db,
        product_id,
        product
    )


@router.delete("/{product_id}")
def delete(
    product_id: int,
    db: Session = Depends(get_db)
):
    return delete_product(
        db,
        product_id
    )