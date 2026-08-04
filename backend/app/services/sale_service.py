from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.schemas.sale_schema import SaleCreate


def create_sale(
    db: Session,
    sale: SaleCreate
):

    product = db.query(Product).filter(
        Product.id == sale.product_id,
        Product.company_id == sale.company_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    customer = db.query(Customer).filter(
        Customer.id == sale.customer_id,
        Customer.company_id == sale.company_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if sale.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    if sale.unit_price < 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price cannot be negative"
        )

    if sale.tax < 0:
        raise HTTPException(
            status_code=400,
            detail="Tax cannot be negative"
        )

    if sale.discount < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot be negative"
        )

    if sale.discount > (sale.quantity * sale.unit_price):
        raise HTTPException(
            status_code=400,
            detail="Discount cannot exceed total product value"
        )

    if sale.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )

    invoice = (
        f"INV-{datetime.now().strftime('%Y')}-"
        f"{int(datetime.now().timestamp())}"
    )

    subtotal = sale.quantity * sale.unit_price
    total = subtotal - sale.discount + sale.tax

    db_sale = Sale(
        company_id=sale.company_id,
        customer_id=sale.customer_id,
        invoice_number=invoice,
        customer_name=sale.customer_name,
        sales_channel=sale.sales_channel,
        payment_method=sale.payment_method,
        total_amount=total
    )

    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    db_item = SaleItem(
        sale_id=db_sale.id,
        product_id=sale.product_id,
        category_id=sale.category_id,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        discount=sale.discount,
        tax=sale.tax,
        total=total
    )

    db.add(db_item)

    product.stock_quantity -= sale.quantity

    if product.stock_quantity == 0:
        product.status = "Out Of Stock"
    elif product.stock_quantity <= 5:
        product.status = "Low Stock"
    else:
        product.status = "Active"

    summary = db.query(CustomerPurchaseSummary).filter(
        CustomerPurchaseSummary.customer_id == sale.customer_id
    ).first()

    if summary is None:
        summary = CustomerPurchaseSummary(
            customer_id=sale.customer_id,
            total_orders=1,
            total_revenue=total,
            total_quantity=sale.quantity,
            average_order_value=total,
            purchase_frequency=1,
            first_purchase_date=datetime.utcnow(),
            last_purchase_date=datetime.utcnow(),
        )
        db.add(summary)
    else:
        summary.total_orders += 1
        summary.total_revenue += total
        summary.total_quantity += sale.quantity
        summary.average_order_value = (
            summary.total_revenue / summary.total_orders
        )
        summary.purchase_frequency = summary.total_orders
        summary.last_purchase_date = datetime.utcnow()

    db.commit()

    return db_sale
def get_sales(
    db: Session,
    company_id: int
):

    return db.query(Sale).filter(
        Sale.company_id == company_id
    ).all()


def delete_sale(
    db: Session,
    sale_id: int,
    company_id: int
):

    sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.company_id == company_id
    ).first()

    if not sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    db.delete(sale)
    db.commit()

    return {
        "message": "Sale deleted"
    }