from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product
from app.models.inventory import Inventory
from app.models.sale import Sale
from app.models.sale_item import SaleItem


# =========================================================
# TASK 11 CONFIGURATION
# =========================================================

LOOKBACK_DAYS = 30
FORECAST_DAYS = 7
LEAD_TIME_DAYS = 5
SAFETY_STOCK_DAYS = 3


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def calculate_average_daily_demand(
    total_units_sold: float
) -> float:

    return round(
        total_units_sold / LOOKBACK_DAYS,
        4
    )


def calculate_forecasted_demand(
    average_daily_demand: float
) -> float:

    return round(
        average_daily_demand * FORECAST_DAYS,
        2
    )


def calculate_safety_stock(
    average_daily_demand: float
) -> float:

    return round(
        average_daily_demand * SAFETY_STOCK_DAYS,
        2
    )


def calculate_reorder_point(
    average_daily_demand: float,
    safety_stock: float
) -> float:

    reorder_point = (
        average_daily_demand * LEAD_TIME_DAYS
    ) + safety_stock

    return round(
        reorder_point,
        2
    )


def calculate_days_remaining(
    current_stock: float,
    average_daily_demand: float
):

    if average_daily_demand <= 0:
        return None

    return round(
        current_stock / average_daily_demand,
        2
    )

def classify_stock_risk(
    current_stock: float,
    average_daily_demand: float,
    days_remaining,
    reorder_point: float,
    target_stock: float
) -> str:

    print(
    "STOCK RISK DEBUG:",
    {
        "current_stock": current_stock,
        "average_daily_demand": average_daily_demand,
        "days_remaining": days_remaining,
        "reorder_point": reorder_point,
        "target_stock": target_stock,
    }
)

    # -----------------------------------------------------
    # OUT OF STOCK
    # -----------------------------------------------------

    if current_stock <= 0:
        return "Out of Stock"

    # -----------------------------------------------------
    # STOCKOUT RISK
    # -----------------------------------------------------

    if (
        average_daily_demand > 0
        and days_remaining is not None
        and days_remaining <= LEAD_TIME_DAYS
    ):
        return "Stockout Risk"

    # -----------------------------------------------------
    # LOW STOCK
    # -----------------------------------------------------

    if current_stock <= reorder_point:
        return "Low Stock"

    # -----------------------------------------------------
    # OVERSTOCK
    # -----------------------------------------------------

    if (
        target_stock > 0
        and current_stock > target_stock * 2
    ):
        return "Overstock"

    # -----------------------------------------------------
    # ZERO DEMAND
    # -----------------------------------------------------

    if average_daily_demand <= 0:
        return "Healthy"

    # -----------------------------------------------------
    # HEALTHY
    # -----------------------------------------------------

    return "Healthy"


    
def calculate_recommended_reorder_quantity(
    current_stock: float,
    target_stock: float
) -> int:

    reorder_quantity = max(
        0,
        target_stock - current_stock
    )

    return int(
        round(reorder_quantity)
    )


def generate_recommendation(
    stock_risk: str,
    reorder_quantity: int,
    current_stock: float,
    average_daily_demand: float
) -> str:

    if stock_risk == "Out of Stock":
        return "Reorder immediately"

    if stock_risk == "Stockout Risk":
        return "Reorder immediately"

    if stock_risk == "Low Stock":
        if reorder_quantity > 0:
            return "Reorder soon"

        return "Monitor stock"

    if stock_risk == "Overstock":
        return "Reduce or pause replenishment"

    if average_daily_demand <= 0:
        return "No sales history available"

    return "Stock level is healthy"


# =========================================================
# GET PRODUCT DEMAND
# =========================================================

def get_product_demand(
    db: Session,
    company_id: int,
    product_id: int,
    start_date: datetime
) -> float:

    total_units_sold = (
        db.query(
            func.sum(SaleItem.quantity)
        )
        .join(
            Sale,
            SaleItem.sale_id == Sale.id
        )
        .filter(
            Sale.company_id == company_id,
            SaleItem.product_id == product_id,
            Sale.sale_date >= start_date
        )
        .scalar()
    )

    return float(
        total_units_sold or 0
    )


# =========================================================
# BUILD PRODUCT INVENTORY FORECAST
# =========================================================

def build_inventory_forecast(
    db: Session,
    company_id: int,
    product: Product,
    start_date: datetime
):

    # -----------------------------------------------------
    # GET INVENTORY
    # -----------------------------------------------------

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.company_id == company_id,
            Inventory.product_id == product.id
        )
        .first()
    )

    # -----------------------------------------------------
    # INVENTORY VALIDATION
    # -----------------------------------------------------

    if inventory:

        current_stock = float(
            inventory.available_stock or 0
        )

        reserved_stock = float(
            inventory.reserved_stock or 0
        )

        reorder_level = float(
            inventory.reorder_level or 0
        )

    else:

        # Fallback to Product stock if inventory
        # information is not available.

        current_stock = float(
            product.stock_quantity or 0
        )

        reserved_stock = 0

        reorder_level = 0

    # -----------------------------------------------------
    # HISTORICAL SALES
    # -----------------------------------------------------

    total_units_sold = get_product_demand(
        db=db,
        company_id=company_id,
        product_id=product.id,
        start_date=start_date
    )

    # -----------------------------------------------------
    # AVERAGE DAILY DEMAND
    # -----------------------------------------------------

    average_daily_demand = (
        calculate_average_daily_demand(
            total_units_sold
        )
    )

    # -----------------------------------------------------
    # FORECASTED DEMAND
    # -----------------------------------------------------

    forecasted_demand = (
        calculate_forecasted_demand(
            average_daily_demand
        )
    )

    # -----------------------------------------------------
    # SAFETY STOCK
    # -----------------------------------------------------

    safety_stock = (
        calculate_safety_stock(
            average_daily_demand
        )
    )

    # -----------------------------------------------------
    # REORDER POINT
    # -----------------------------------------------------

    calculated_reorder_point = (
        calculate_reorder_point(
            average_daily_demand,
            safety_stock
        )
    )

    # -----------------------------------------------------
    # KEEP EXISTING REORDER LEVEL WHEN HIGHER
    # -----------------------------------------------------

    reorder_point = max(
        calculated_reorder_point,
        reorder_level
    )

    reorder_point = round(
        reorder_point,
        2
    )

    # -----------------------------------------------------
    # TARGET STOCK
    # -----------------------------------------------------

    target_stock = round(
        forecasted_demand + safety_stock,
        2
    )

    # Existing reorder level should also be respected.

    target_stock = max(
        target_stock,
        reorder_point
    )

    # -----------------------------------------------------
    # DAYS OF STOCK REMAINING
    # -----------------------------------------------------

    days_remaining = (
        calculate_days_remaining(
            current_stock,
            average_daily_demand
        )
    )

    # -----------------------------------------------------
    # STOCK RISK
    # -----------------------------------------------------

    stock_risk = classify_stock_risk(
        current_stock=current_stock,
        average_daily_demand=average_daily_demand,
        days_remaining=days_remaining,
        reorder_point=reorder_point,
        target_stock=target_stock
    )

    # -----------------------------------------------------
    # RECOMMENDED REORDER QUANTITY
    # -----------------------------------------------------

    recommended_reorder_quantity = (
        calculate_recommended_reorder_quantity(
            current_stock=current_stock,
            target_stock=target_stock
        )
    )

    # -----------------------------------------------------
    # REORDER REQUIRED
    # -----------------------------------------------------

    reorder_required = (
        recommended_reorder_quantity > 0
        and stock_risk != "Overstock"
    )

    # -----------------------------------------------------
    # RECOMMENDATION
    # -----------------------------------------------------

    recommendation = generate_recommendation(
        stock_risk=stock_risk,
        reorder_quantity=recommended_reorder_quantity,
        current_stock=current_stock,
        average_daily_demand=average_daily_demand
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
    "product_id": product.id,
    "product_name": product.name,
    "sku": product.sku,

    "category_id": product.category_id,

    "supplier_name": getattr(
        product,
        "supplier_name",
        None
    ),

        "current_stock": round(
            current_stock,
            2
        ),

        "reserved_stock": round(
            reserved_stock,
            2
        ),

        "available_stock": round(
            current_stock,
            2
        ),

        "total_units_sold": round(
            total_units_sold,
            2
        ),

        "average_daily_demand": average_daily_demand,

        "forecast_period_days": FORECAST_DAYS,

        "forecasted_demand": forecasted_demand,

        "safety_stock": safety_stock,

        "lead_time_days": LEAD_TIME_DAYS,

        "reorder_point": reorder_point,

        "target_stock": target_stock,

        "days_of_stock_remaining": days_remaining,

        "recommended_reorder_quantity":
            recommended_reorder_quantity,

        "reorder_required":
            reorder_required,

        "stock_risk":
            stock_risk,

        "recommendation":
            recommendation
    }


# =========================================================
# GET INVENTORY FORECAST FOR COMPANY
# =========================================================

def get_inventory_forecast(
    db: Session,
    company_id: int
):

    start_date = (
        datetime.utcnow()
        - timedelta(days=LOOKBACK_DAYS)
    )

    products = (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            Product.status == "Active"
        )
        .order_by(
            Product.name.asc()
        )
        .all()
    )

    result = []

    for product in products:

        forecast = build_inventory_forecast(
            db=db,
            company_id=company_id,
            product=product,
            start_date=start_date
        )

        result.append(
            forecast
        )

    return result


# =========================================================
# GET PRODUCT RECOMMENDATION
# =========================================================

def get_product_inventory_recommendation(
    db: Session,
    company_id: int,
    product_id: int
):

    start_date = (
        datetime.utcnow()
        - timedelta(days=LOOKBACK_DAYS)
    )

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.company_id == company_id,
            Product.status == "Active"
        )
        .first()
    )

    if not product:
        return None

    return build_inventory_forecast(
        db=db,
        company_id=company_id,
        product=product,
        start_date=start_date
    )
