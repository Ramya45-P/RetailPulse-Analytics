from pydantic import BaseModel
from datetime import datetime


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    brand: str | None = None
    description: str | None = None
    unit_price: float
    cost_price: float
    stock_quantity: int = 0
    unit_of_measure: str | None = None
    status: str = "Active"
    company_id: int


class ProductResponse(BaseModel):
    id: int
    company_id: int
    category_id: int
    name: str
    sku: str
    brand: str | None
    description: str | None
    unit_price: float
    cost_price: float
    stock_quantity: int
    unit_of_measure: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True