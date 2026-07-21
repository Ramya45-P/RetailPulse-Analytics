from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.product import Product
from app.schemas.product_schema import ProductCreate


def create_product(
    db: Session,
    product: ProductCreate
):

    existing = db.query(Product).filter(
        Product.company_id == product.company_id,
        Product.sku == product.sku
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="SKU already exists"
        )


    if product.unit_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price must be greater than zero"
        )


    if product.cost_price > product.unit_price:
        raise HTTPException(
            status_code=400,
            detail="Cost price cannot exceed unit price"
        )


    if product.stock_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Stock cannot be negative"
        )


    db_product = Product(
        company_id=product.company_id,
        category_id=product.category_id,
        name=product.name,
        sku=product.sku,
        brand=product.brand,
        description=product.description,
        unit_price=product.unit_price,
        cost_price=product.cost_price,
        stock_quantity=product.stock_quantity,
        unit_of_measure=product.unit_of_measure,
        status=product.status
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product

from sqlalchemy import or_


def get_products(
    db: Session,
    company_id: int,
    search: str = None,
    category_id: int = None,
    status: str = None,
    brand: str = None
):

    query = db.query(Product).filter(
        Product.company_id == company_id
    )

    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%")
            )
        )

    if category_id:
        query = query.filter(
            Product.category_id == category_id
        )

    if status:
        query = query.filter(
            Product.status == status
        )

    if brand:
        query = query.filter(
            Product.brand == brand
        )

    return query.all()

def delete_product(
    db: Session,
    product_id: int
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted"
    }
def update_product(
    db: Session,
    product_id: int,
    data: ProductCreate
):

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product.name = data.name
    product.sku = data.sku
    product.category_id = data.category_id
    product.brand = data.brand
    product.description = data.description
    product.unit_price = data.unit_price
    product.cost_price = data.cost_price
    product.stock_quantity = data.stock_quantity
    product.unit_of_measure = data.unit_of_measure
    product.status = data.status

    db.commit()
    db.refresh(product)

    return product
  
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

   