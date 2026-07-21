from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.category_schema import (
    CategoryCreate,
    CategoryResponse
)
from app.services.category_service import (
    create_category,
    get_categories,
    update_category,
    delete_category
)

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post("/", response_model=CategoryResponse)
def create(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    return create_category(db, category)



@router.get("/", response_model=list[CategoryResponse])
def get_all(
    company_id: int,
    db: Session = Depends(get_db)
):
    return get_categories(
        db,
        company_id
    )



@router.put("/{category_id}", response_model=CategoryResponse)
def update(
    category_id: int,
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    return update_category(
        db,
        category_id,
        category
    )



@router.delete("/{category_id}")
def delete(
    category_id: int,
    db: Session = Depends(get_db)
):
    return delete_category(
        db,
        category_id
    )