from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.sale_schema import (
    SaleCreate,
    SaleResponse,
)

from app.services.sale_service import (
    create_sale,
    get_sales,
    delete_sale,
)

router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


@router.post("/", response_model=SaleResponse)
def create(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale.company_id = current_user.company_id

    return create_sale(
        db,
        sale,
    )


@router.get("/", response_model=list[SaleResponse])
def get_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sales(
        db,
        current_user.company_id,
    )


@router.delete("/{sale_id}")
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