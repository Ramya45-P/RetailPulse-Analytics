from pydantic import BaseModel


class AnalyticsResponse(BaseModel):
    total_revenue: float
    total_orders: int
    total_products_sold: int
    average_order_value: float
    total_inventory_value: float
    low_stock_products: int
    out_of_stock_products: int
    total_categories: int