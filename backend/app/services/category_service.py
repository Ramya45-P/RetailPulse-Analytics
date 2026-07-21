from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.category import Category
from app.schemas.category_schema import CategoryCreate


def create_category(
    db: Session,
    category: CategoryCreate
):

    existing = db.query(Category).filter(
        Category.company_id == category.company_id,
        Category.name == category.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    db_category = Category(
        company_id=category.company_id,
        name=category.name,
        description=category.description,
        status=category.status
    )

    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    return db_category



def get_categories(
    db: Session,
    company_id: int
):

    return db.query(Category).filter(
        Category.company_id == company_id
    ).all()



def update_category(
    db: Session,
    category_id: int,
    data: CategoryCreate
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    category.name = data.name
    category.description = data.description
    category.status = data.status

    db.commit()
    db.refresh(category)

    return category



def delete_category(
    db: Session,
    category_id: int
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted"
    }