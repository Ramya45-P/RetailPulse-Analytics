from pydantic import BaseModel, EmailStr


class CompanyCreate(BaseModel):
    company_name: str
    company_code: str
    email: EmailStr
    phone: str
    address: str


class CompanyResponse(BaseModel):
    id: int
    company_name: str
    company_code: str
    email: EmailStr
    phone: str
    address: str

    class Config:
        from_attributes = True