from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    customer_type: str
    preferred_sales_channel: Optional[str] = "Retail Store"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    is_active: bool


class CustomerResponse(CustomerBase):
    id: int
    customer_id: str
    company_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True