from pydantic import BaseModel
from typing import List

class SalesSummaryResponse(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    total_items_sold: int
    total_discount: float
    total_tax: float


class SalesTrendItem(BaseModel):
    period: str
    revenue: float
    orders: int


class ProductAnalyticsItem(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: int
    revenue: float


class CustomerAnalyticsItem(BaseModel):
    customer_id: int
    customer_name: str
    orders: int
    total_spend: float
    average_order_value: float


class PaymentMethodItem(BaseModel):
    payment_method: str
    transactions: int
    revenue: float