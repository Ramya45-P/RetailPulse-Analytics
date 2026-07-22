from pydantic import BaseModel
from datetime import datetime


class SaleCreate(BaseModel):
    company_id: int
    customer_name: str
    product_id: int
    category_id: int
    quantity: int
    unit_price: float
    discount: float = 0
    tax: float = 0
    sales_channel: str
    payment_method: str


class SaleResponse(BaseModel):
    id: int
    company_id: int
    invoice_number: str
    customer_name: str
    sale_date: datetime
    sales_channel: str
    payment_method: str
    total_amount: float
    created_at: datetime

    class Config:
        from_attributes = True