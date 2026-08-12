from datetime import datetime
import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.schemas.sale_schema import SaleCreate


# ============================================================
# CREATE SALE
# ============================================================

def create_sale(
    db: Session,
    sale: SaleCreate
):
    # --------------------------------------------------------
    # Validate Customer
    # --------------------------------------------------------

    if sale.customer_id is not None:

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == sale.customer_id,
                Customer.company_id == sale.company_id
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

    # --------------------------------------------------------
    # Validate Product
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == sale.product_id,
            Product.company_id == sale.company_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # --------------------------------------------------------
    # Validate Category
    # --------------------------------------------------------

    category = (
        db.query(Category)
        .filter(
            Category.id == sale.category_id,
            Category.company_id == sale.company_id
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # --------------------------------------------------------
    # Validate Quantity
    # --------------------------------------------------------

    if sale.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    # --------------------------------------------------------
    # Validate Unit Price
    # --------------------------------------------------------

    if sale.unit_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price must be greater than zero"
        )

    # --------------------------------------------------------
    # Validate Discount
    # --------------------------------------------------------

    if sale.discount < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot be negative"
        )

    # --------------------------------------------------------
    # Validate Tax
    # --------------------------------------------------------

    if sale.tax < 0:
        raise HTTPException(
            status_code=400,
            detail="Tax cannot be negative"
        )

    # --------------------------------------------------------
    # Find Inventory
    # --------------------------------------------------------

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == product.id,
            Inventory.company_id == sale.company_id
        )
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found for this product"
        )

    # --------------------------------------------------------
    # Determine Available Stock
    # --------------------------------------------------------

    available_stock = inventory.available_stock

    if available_stock is None:
        available_stock = (
            inventory.current_stock -
            (inventory.reserved_stock or 0)
        )

    # --------------------------------------------------------
    # Validate Stock
    # --------------------------------------------------------

    if sale.quantity > available_stock:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock. "
                f"Available stock: {available_stock}"
            )
        )

    # --------------------------------------------------------
    # Calculate Subtotal
    # --------------------------------------------------------

    subtotal = (
        sale.quantity *
        sale.unit_price
    )

    # --------------------------------------------------------
    # Validate Discount
    # --------------------------------------------------------

    if sale.discount > subtotal:

        raise HTTPException(
            status_code=400,
            detail=(
                "Discount cannot exceed "
                "subtotal"
            )
        )

    # --------------------------------------------------------
    # Calculate Grand Total
    # --------------------------------------------------------

    grand_total = (
        subtotal
        - sale.discount
        + sale.tax
    )

    if grand_total < 0:

        raise HTTPException(
            status_code=400,
            detail="Final amount cannot be negative"
        )

    # --------------------------------------------------------
    # Generate Unique Invoice Number
    # --------------------------------------------------------

    invoice_number = (
        f"INV-{datetime.utcnow().strftime('%Y%m%d')}-"
        f"{uuid.uuid4().hex[:8].upper()}"
    )

    # Safety check for duplicate invoice
    existing_invoice = (
        db.query(Sale)
        .filter(
            Sale.invoice_number == invoice_number
        )
        .first()
    )

    if existing_invoice:
        raise HTTPException(
            status_code=409,
            detail="Invoice number already exists"
        )

    # --------------------------------------------------------
    # Create Sale
    # --------------------------------------------------------

    db_sale = Sale(
        company_id=sale.company_id,
        customer_id=sale.customer_id,
        invoice_number=invoice_number,
        customer_name=sale.customer_name,
        sales_channel=sale.sales_channel,
        payment_method=sale.payment_method,
        total_amount=grand_total
    )

    db.add(db_sale)

    # Flush so sale.id is available before commit
    db.flush()

    # --------------------------------------------------------
    # Create Sale Item
    # --------------------------------------------------------

    db_item = SaleItem(
        sale_id=db_sale.id,
        product_id=sale.product_id,
        category_id=sale.category_id,
        quantity=sale.quantity,
        unit_price=sale.unit_price,
        discount=sale.discount,
        tax=sale.tax,
        total=grand_total
    )

    db.add(db_item)

    # --------------------------------------------------------
    # Inventory Movement
    # --------------------------------------------------------

    previous_quantity = inventory.current_stock

    new_current_quantity = (
        previous_quantity -
        sale.quantity
    )

    new_available_quantity = (
        available_stock -
        sale.quantity
    )

    if new_current_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Inventory stock cannot become negative"
        )

    # Update Inventory
    inventory.current_stock = new_current_quantity
    inventory.available_stock = new_available_quantity

    # --------------------------------------------------------
    # Update Inventory Status
    # --------------------------------------------------------

    if new_available_quantity <= 0:

        inventory.stock_status = "Out Of Stock"

    elif new_available_quantity <= inventory.reorder_level:

        inventory.stock_status = "Low Stock"

    else:

        inventory.stock_status = "In Stock"

    # --------------------------------------------------------
    # Create Inventory Movement
    # --------------------------------------------------------

    movement = InventoryMovement(
        inventory_id=inventory.id,
        movement_type="SALE",
        quantity_changed=-sale.quantity,
        previous_quantity=previous_quantity,
        updated_quantity=new_current_quantity,
        reason="Sale transaction",
        remarks=f"Invoice {invoice_number}",
        performed_by=None
    )

    db.add(movement)

    # --------------------------------------------------------
    # Update Product Stock
    # --------------------------------------------------------
    #
    # Your existing application already uses
    # Product.stock_quantity in several places.
    #
    # Keep it synchronized with Inventory.
    #

    if hasattr(product, "stock_quantity"):

        product.stock_quantity = new_current_quantity

        if product.stock_quantity <= 0:
            product.status = "Out Of Stock"

        elif product.stock_quantity <= 5:
            product.status = "Low Stock"

        else:
            product.status = "Active"

    # --------------------------------------------------------
    # Update Customer Purchase Summary
    # --------------------------------------------------------

    if sale.customer_id is not None:

        summary = (
            db.query(CustomerPurchaseSummary)
            .filter(
                CustomerPurchaseSummary.customer_id
                == sale.customer_id
            )
            .first()
        )

        now = datetime.utcnow()

        if summary is None:

            summary = CustomerPurchaseSummary(
                customer_id=sale.customer_id,
                total_orders=1,
                total_revenue=grand_total,
                total_quantity=sale.quantity,
                average_order_value=grand_total,
                purchase_frequency=1,
                first_purchase_date=now,
                last_purchase_date=now
            )

            db.add(summary)

        else:

            summary.total_orders += 1

            summary.total_revenue += grand_total

            summary.total_quantity += sale.quantity

            summary.average_order_value = (
                summary.total_revenue /
                summary.total_orders
            )

            summary.purchase_frequency = (
                summary.total_orders
            )

            summary.last_purchase_date = now

    # --------------------------------------------------------
    # Commit Everything
    # --------------------------------------------------------

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create sale"
        )

    db.refresh(db_sale)

    return db_sale


# ============================================================
# GET ALL SALES
# ============================================================

def get_sales(
    db: Session,
    company_id: int
):

    return (
        db.query(Sale)
        .filter(
            Sale.company_id == company_id
        )
        .order_by(
            Sale.sale_date.desc()
        )
        .all()
    )


# ============================================================
# GET SALE DETAILS
# ============================================================

def get_sale_details(
    db: Session,
    sale_id: int,
    company_id: int
):

    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not sale:

        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    items = []

    for item in sale.items:

        product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            )
            .first()
        )

        product_name = None
        sku = None
        category_name = None

        if product:

            product_name = product.name
            sku = product.sku

            category = (
                db.query(Category)
                .filter(
                    Category.id == product.category_id,
                    Category.company_id == company_id
                )
                .first()
            )

            if category:
                category_name = category.name

        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "category_id": item.category_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "discount": item.discount,
            "tax": item.tax,
            "total": item.total,
            "product_name": product_name,
            "sku": sku,
            "category_name": category_name,
        })

    return {
        "id": sale.id,
        "company_id": sale.company_id,
        "customer_id": sale.customer_id,
        "invoice_number": sale.invoice_number,
        "customer_name": sale.customer_name,
        "sale_date": sale.sale_date,
        "sales_channel": sale.sales_channel,
        "payment_method": sale.payment_method,
        "total_amount": sale.total_amount,
        "created_at": sale.created_at,
        "items": items,
    }

# ============================================================
# UPDATE SALE
# ============================================================

def update_sale(
    db: Session,
    sale_id: int,
    company_id: int,
    sale: SaleCreate
):
    db_sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not db_sale:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    # --------------------------------------------------------
    # Validate Customer
    # --------------------------------------------------------

    if sale.customer_id is not None:

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == sale.customer_id,
                Customer.company_id == company_id
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

    # --------------------------------------------------------
    # Validate Product
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == sale.product_id,
            Product.company_id == company_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # --------------------------------------------------------
    # Validate Category
    # --------------------------------------------------------

    category = (
        db.query(Category)
        .filter(
            Category.id == sale.category_id,
            Category.company_id == company_id
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # --------------------------------------------------------
    # Validate Quantity
    # --------------------------------------------------------

    if sale.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    # --------------------------------------------------------
    # Validate Unit Price
    # --------------------------------------------------------

    if sale.unit_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price must be greater than zero"
        )

    # --------------------------------------------------------
    # Validate Discount
    # --------------------------------------------------------

    if sale.discount < 0:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot be negative"
        )

    # --------------------------------------------------------
    # Validate Tax
    # --------------------------------------------------------

    if sale.tax < 0:
        raise HTTPException(
            status_code=400,
            detail="Tax cannot be negative"
        )

    # --------------------------------------------------------
    # Calculate New Total
    # --------------------------------------------------------

    subtotal = sale.quantity * sale.unit_price

    if sale.discount > subtotal:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot exceed subtotal"
        )

    grand_total = (
        subtotal
        - sale.discount
        + sale.tax
    )

    if grand_total < 0:
        raise HTTPException(
            status_code=400,
            detail="Final amount cannot be negative"
        )

    # --------------------------------------------------------
    # Get Existing Sale Item
    # --------------------------------------------------------

    if not db_sale.items:
        raise HTTPException(
            status_code=400,
            detail="Sale item not found"
        )

    item = db_sale.items[0]

    # --------------------------------------------------------
    # Restore OLD inventory quantity
    # --------------------------------------------------------

    old_inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == item.product_id,
            Inventory.company_id == company_id
        )
        .first()
    )

    if old_inventory:

        old_inventory.current_stock += item.quantity
        old_inventory.available_stock += item.quantity

        old_product = (
            db.query(Product)
            .filter(
                Product.id == item.product_id,
                Product.company_id == company_id
            )
            .first()
        )

        if old_product:
            old_product.stock_quantity = old_inventory.current_stock

            if old_product.stock_quantity <= 0:
                old_product.status = "Out Of Stock"
            elif old_product.stock_quantity <= 5:
                old_product.status = "Low Stock"
            else:
                old_product.status = "Active"

    # --------------------------------------------------------
    # Get inventory for NEW product
    # --------------------------------------------------------

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == sale.product_id,
            Inventory.company_id == company_id
        )
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found for this product"
        )

    available_stock = inventory.available_stock

    if available_stock is None:
        available_stock = (
            inventory.current_stock
            - (inventory.reserved_stock or 0)
        )

    # --------------------------------------------------------
    # Validate NEW stock
    # --------------------------------------------------------

    if sale.quantity > available_stock:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock. "
                f"Available stock: {available_stock}"
            )
        )

    # --------------------------------------------------------
    # Update Inventory
    # --------------------------------------------------------

    previous_quantity = inventory.current_stock

    new_current_quantity = (
        inventory.current_stock - sale.quantity
    )

    new_available_quantity = (
        available_stock - sale.quantity
    )

    if new_current_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Inventory stock cannot become negative"
        )

    inventory.current_stock = new_current_quantity
    inventory.available_stock = new_available_quantity

    if new_available_quantity <= 0:
        inventory.stock_status = "Out Of Stock"
    elif new_available_quantity <= inventory.reorder_level:
        inventory.stock_status = "Low Stock"
    else:
        inventory.stock_status = "In Stock"

    # --------------------------------------------------------
    # Update Product Stock
    # --------------------------------------------------------

    product.stock_quantity = new_current_quantity

    if product.stock_quantity <= 0:
        product.status = "Out Of Stock"
    elif product.stock_quantity <= 5:
        product.status = "Low Stock"
    else:
        product.status = "Active"

    # --------------------------------------------------------
    # Inventory Movement
    # --------------------------------------------------------

    movement = InventoryMovement(
        inventory_id=inventory.id,
        movement_type="SALE",
        quantity_changed=-sale.quantity,
        previous_quantity=previous_quantity,
        updated_quantity=new_current_quantity,
        reason="Sale updated",
        remarks=f"Invoice {db_sale.invoice_number}",
        performed_by=None
    )

    db.add(movement)

    # --------------------------------------------------------
    # Update Sale
    # --------------------------------------------------------

    db_sale.customer_id = sale.customer_id
    db_sale.customer_name = sale.customer_name
    db_sale.sales_channel = sale.sales_channel
    db_sale.payment_method = sale.payment_method
    db_sale.total_amount = grand_total

    # --------------------------------------------------------
    # Update Sale Item
    # --------------------------------------------------------

    item.product_id = sale.product_id
    item.category_id = sale.category_id
    item.quantity = sale.quantity
    item.unit_price = sale.unit_price
    item.discount = sale.discount
    item.tax = sale.tax
    item.total = grand_total

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update sale"
        )

    db.refresh(db_sale)

    return db_sale


# ============================================================
# DELETE SALE
# ============================================================

def delete_sale(
    db: Session,
    sale_id: int,
    company_id: int
):

    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.company_id == company_id
        )
        .first()
    )

    if not sale:

        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    # --------------------------------------------------------
    # Restore inventory before deleting sale
    # --------------------------------------------------------

    for item in sale.items:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == item.product_id,
                Inventory.company_id == company_id
            )
            .first()
        )

        if inventory:

            previous_quantity = inventory.current_stock

            inventory.current_stock += item.quantity

            inventory.available_stock += item.quantity

            if inventory.available_stock <= 0:

                inventory.stock_status = "Out Of Stock"

            elif inventory.available_stock <= inventory.reorder_level:

                inventory.stock_status = "Low Stock"

            else:

                inventory.stock_status = "In Stock"

            # Keep Product stock synchronized

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.product_id,
                    Product.company_id == company_id
                )
                .first()
            )

            if product:

                product.stock_quantity = (
                    inventory.current_stock
                )

                if product.stock_quantity <= 0:

                    product.status = "Out Of Stock"

                elif product.stock_quantity <= 5:

                    product.status = "Low Stock"

                else:

                    product.status = "Active"

            # Inventory movement for reversal

            movement = InventoryMovement(
                inventory_id=inventory.id,
                movement_type="SALE_CANCEL",
                quantity_changed=item.quantity,
                previous_quantity=previous_quantity,
                updated_quantity=inventory.current_stock,
                reason="Sale deleted",
                remarks=f"Invoice {sale.invoice_number}",
                performed_by=None
            )

            db.add(movement)

    
    
    

    # --------------------------------------------------------
    # Delete Sale
    # --------------------------------------------------------

    db.delete(sale)

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete sale"
        )

    return {
        "message": "Sale deleted successfully"
    }