from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.schemas.sale_schema import SaleCreate


def create_sale(
    db: Session,
    sale: SaleCreate
):

    # Check product belongs to same company
    product = db.query(Product).filter(
        Product.id == sale.product_id,
        Product.company_id == sale.company_id
    ).first()


    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )


    # Quantity validation
        # Quantity validation
    if sale.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )


    # Unit price validation
    if sale.unit_price < 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price cannot be negative"
        )


    # Tax validation
    if sale.tax < 0:
        raise HTTPException(
            status_code=400,
            detail="Tax cannot be negative"
        )


    # Discount validation
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


    # Stock validation
    if sale.quantity > product.stock_quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient stock"
        )
    # Generate invoice number
    invoice = (
        f"INV-{datetime.now().strftime('%Y')}-"
        f"{int(datetime.now().timestamp())}"
    )


    # Calculate total
    subtotal = sale.quantity * sale.unit_price

    total = (
        subtotal
        - sale.discount
        + sale.tax
    )


    # Create Sale
    db_sale = Sale(
        company_id=sale.company_id,
        invoice_number=invoice,
        customer_name=sale.customer_name,
        sales_channel=sale.sales_channel,
        payment_method=sale.payment_method,
        total_amount=total
    )


    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)


    # Create Sale Item
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


    # Reduce product stock
    product.stock_quantity -= sale.quantity


    # Update product status
    if product.stock_quantity == 0:

        product.status = "Out Of Stock"

    elif product.stock_quantity <= 5:

        product.status = "Low Stock"

    else:

        product.status = "Active"



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
    sale_id: int
):

    sale = db.query(Sale).filter(
        Sale.id == sale_id
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