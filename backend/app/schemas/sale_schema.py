from typing import Optional
from pydantic import BaseModel
from datetime import datetime


# ============================================================
# CREATE SALE
# ============================================================

class SaleCreate(BaseModel):
    company_id: int

    # Customer is required for NEW sales
    customer_id: int
    customer_name: str

    product_id: int
    category_id: int

    quantity: int
    unit_price: float

    discount: float = 0
    tax: float = 0

    sales_channel: str
    payment_method: str


# ============================================================
# UPDATE SALE
# ============================================================

class SaleUpdate(BaseModel):
    customer_id: int
    customer_name: str

    product_id: int
    category_id: int

    quantity: int
    unit_price: float

    discount: float = 0
    tax: float = 0

    sales_channel: str
    payment_method: str


# ============================================================
# SALE RESPONSE
# ============================================================

class SaleResponse(BaseModel):
    id: int
    company_id: int

    # Old sales can have NULL
    customer_id: Optional[int] = None

    invoice_number: str
    customer_name: str

    sale_date: datetime

    sales_channel: str
    payment_method: str

    total_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# SALE ITEM RESPONSE
# ============================================================

class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    category_id: int

    quantity: int
    unit_price: float

    discount: float
    tax: float
    total: float

    product_name: Optional[str] = None
    sku: Optional[str] = None
    category_name: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# SALE DETAIL RESPONSE
# ============================================================

class SaleDetailResponse(BaseModel):
    id: int
    company_id: int

    customer_id: Optional[int] = None

    invoice_number: str
    customer_name: str

    sale_date: datetime

    sales_channel: str
    payment_method: str

    total_amount: float
    created_at: datetime

    items: list[SaleItemResponse]

    class Config:
        from_attributes = True