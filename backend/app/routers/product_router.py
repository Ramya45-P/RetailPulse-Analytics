from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.database.database import get_db

from app.schemas.product_schema import (
    ProductCreate,
    ProductResponse,
)

from app.services.product_service import (
    create_product,
    get_products,
    update_product,
    delete_product,
)

from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post("/", response_model=ProductResponse)
def create(
    product: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product.company_id = current_user.company_id

    created_product = create_product(
        db,
        product,
    )

    ip_address = (
        request.client.host
        if request.client
        else None
    )

    print("DEBUG IP ADDRESS:", ip_address)

    user_agent = request.headers.get("user-agent")

    after_values = {
        "id": created_product.id,
        "name": created_product.name,
        "sku": created_product.sku,
        "category_id": created_product.category_id,
        "brand": created_product.brand,
        "description": created_product.description,
        "unit_price": float(created_product.unit_price),
        "cost_price": float(created_product.cost_price),
        "stock_quantity": created_product.stock_quantity,
        "unit_of_measure": created_product.unit_of_measure,
        "status": created_product.status,
    }

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="CREATE",
        resource_type="PRODUCT",
        resource_id=str(created_product.id),
        description=f"Created product: {created_product.id}",
        ip_address=ip_address,
        user_agent=user_agent,
        after_values=after_values,
        status="SUCCESS",
    )

    return created_product


@router.get("/", response_model=list[ProductResponse])
def get_all(
    search: str = None,
    category_id: int = None,
    status: str = None,
    brand: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_products(
        db,
        current_user.company_id,
        search,
        category_id,
        status,
        brand,
    )


@router.put("/{product_id}", response_model=ProductResponse)
def update(
    product_id: int,
    product: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product.company_id = current_user.company_id

    existing_product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id == current_user.company_id,
        )
        .first()
    )

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    before_values = {
        "id": existing_product.id,
        "name": existing_product.name,
        "sku": existing_product.sku,
        "category_id": existing_product.category_id,
        "brand": existing_product.brand,
        "description": existing_product.description,
        "unit_price": float(existing_product.unit_price),
        "cost_price": float(existing_product.cost_price),
        "stock_quantity": existing_product.stock_quantity,
        "unit_of_measure": existing_product.unit_of_measure,
        "status": existing_product.status,
    }

    updated_product = update_product(
        db,
        product_id,
        current_user.company_id,
        product,
    )

    ip_address = (
        request.client.host
        if request.client
        else None
    )

    user_agent = request.headers.get("user-agent")

    after_values = {
        "id": updated_product.id,
        "name": updated_product.name,
        "sku": updated_product.sku,
        "category_id": updated_product.category_id,
        "brand": updated_product.brand,
        "description": updated_product.description,
        "unit_price": float(updated_product.unit_price),
        "cost_price": float(updated_product.cost_price),
        "stock_quantity": updated_product.stock_quantity,
        "unit_of_measure": updated_product.unit_of_measure,
        "status": updated_product.status,
    }

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="UPDATE",
        resource_type="PRODUCT",
        resource_id=str(product_id),
        description=f"Updated product: {product_id}",
        ip_address=ip_address,
        user_agent=user_agent,
        before_values=before_values,
        after_values=after_values,
        status="SUCCESS",
    )

    return updated_product


@router.delete("/{product_id}")
def delete(
    product_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id == current_user.company_id,
        )
        .first()
    )

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    before_values = {
        "id": existing_product.id,
        "name": existing_product.name,
        "sku": existing_product.sku,
        "category_id": existing_product.category_id,
        "brand": existing_product.brand,
        "description": existing_product.description,
        "unit_price": float(existing_product.unit_price),
        "cost_price": float(existing_product.cost_price),
        "stock_quantity": existing_product.stock_quantity,
        "unit_of_measure": existing_product.unit_of_measure,
        "status": existing_product.status,
    }

    result = delete_product(
        db,
        product_id,
        current_user.company_id,
    )

    ip_address = (
        request.client.host
        if request.client
        else None
    )

    user_agent = request.headers.get("user-agent")

    create_audit_log(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        action="DELETE",
        resource_type="PRODUCT",
        resource_id=str(product_id),
        description=f"Deleted product: {product_id}",
        ip_address=ip_address,
        user_agent=user_agent,
        before_values=before_values,
        status="SUCCESS",
    )

    return result