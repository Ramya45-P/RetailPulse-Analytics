
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.sale_schema import (
    SaleCreate,
    SaleUpdate,
    SaleResponse,
    SaleDetailResponse,
)

from app.services.sale_service import (
    create_sale,
    get_sales,
    get_sale_details,
    update_sale,
    delete_sale,
)


router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


# ============================================================
# CREATE SALE
# ============================================================

@router.post(
    "/",
    response_model=SaleResponse
)
def create(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Always use the logged-in user's company
    sale.company_id = current_user.company_id

    return create_sale(
        db,
        sale,
    )


# ============================================================
# GET ALL SALES
# ============================================================

@router.get(
    "/",
    response_model=list[SaleResponse]
)
def get_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales(
        db,
        current_user.company_id,
    )


# ============================================================
# GET SALE DETAILS
# ============================================================

@router.get(
    "/{sale_id}",
    response_model=SaleDetailResponse
)
def get_details(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sale_details(
        db,
        sale_id,
        current_user.company_id,
    )


# ============================================================
# UPDATE SALE
# ============================================================
# ============================================================
# UPDATE SALE
# ============================================================

@router.put(
    "/{sale_id}",
    response_model=SaleResponse
)
def update(
    sale_id: int,
    sale: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale_data = SaleCreate(
        company_id=current_user.company_id,
        customer_id=sale.customer_id,
        customer_name=sale.customer_name,
        product_id=sale.product_id,
        category_id=sale.category_id,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        discount=sale.discount,
        tax=sale.tax,
        sales_channel=sale.sales_channel,
        payment_method=sale.payment_method,
    )

    return update_sale(
        db,
        sale_id,
        current_user.company_id,
        sale_data,
    )


# ============================================================
# DELETE SALE
# ============================================================

@router.delete(
    "/{sale_id}"
)
def delete(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_sale(
        db,
        sale_id,
        current_user.company_id,
    )

