from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.company_schema import CompanyCreate, CompanyResponse
from app.services.company_service import create_company

router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)


@router.post("/", response_model=CompanyResponse)
def register_company(
    company: CompanyCreate,
    db: Session = Depends(get_db)
):
    return create_company(db, company)