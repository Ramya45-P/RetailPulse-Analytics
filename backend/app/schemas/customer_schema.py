from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re


ALLOWED_SEGMENTS = {"New", "Regular", "Loyal", "VIP"}
ALLOWED_CUSTOMER_TYPES = {"Retail", "Wholesale", "Corporate"}


class CustomerBase(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    email: EmailStr

    phone: str = Field(
        ...,
        min_length=10,
        max_length=15
    )

    date_of_birth: Optional[datetime] = None

    gender: Optional[str] = None

    address: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None

    country: Optional[str] = None

    postal_code: Optional[str] = None

    customer_type: str = Field(
        default="Retail"
    )

    customer_segment: str = Field(
        default="New"
    )

    preferred_sales_channel: Optional[str] = "Retail Store"

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Full name is required")

        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        value = value.strip()

        if not re.fullmatch(r"\+?[0-9]{10,15}", value):
            raise ValueError(
                "Phone number must contain 10 to 15 digits"
            )

        return value

    @field_validator("customer_type")
    @classmethod
    def validate_customer_type(cls, value):
        if value not in ALLOWED_CUSTOMER_TYPES:
            raise ValueError(
                "Customer type must be Retail, Wholesale, or Corporate"
            )

        return value

    @field_validator("customer_segment")
    @classmethod
    def validate_customer_segment(cls, value):
        if value not in ALLOWED_SEGMENTS:
            raise ValueError(
                "Customer segment must be New, Regular, Loyal, or VIP"
            )

        return value


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