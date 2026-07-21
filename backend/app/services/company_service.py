from sqlalchemy.orm import Session

from app.models.company import Company
from app.schemas.company_schema import CompanyCreate


def create_company(db: Session, company: CompanyCreate):
    db_company = Company(
        company_name=company.company_name,
        company_code=company.company_code,
        email=company.email,
        phone=company.phone,
        address=company.address,
    )

    db.add(db_company)
    db.commit()
    db.refresh(db_company)

    return db_company