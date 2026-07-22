from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.sale_schema import (
    SaleCreate,
    SaleResponse
)

from app.services.sale_service import (
    create_sale,
    get_sales,
    delete_sale
)


router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


@router.post("/", response_model=SaleResponse)
def create(
    sale: SaleCreate,
    db: Session = Depends(get_db)
):
    return create_sale(
        db,
        sale
    )


@router.get("/", response_model=list[SaleResponse])
def get_all(
    company_id: int,
    db: Session = Depends(get_db)
):
    return get_sales(
        db,
        company_id
    )


@router.delete("/{sale_id}")
def delete(
    sale_id: int,
    db: Session = Depends(get_db)
):
    return delete_sale(
        db,
        sale_id
    )