import csv
import io
import json
import re
import uuid

from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile
from sqlalchemy import cast, Float
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.customer import Customer
from app.models.import_error import ImportErrorRecord
from app.models.import_history import ImportHistory
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User

from app.services.notification_service import (
    notify_admins,
    notify_system_alert,
)

MAX_FILE_SIZE = 10 * 1024 * 1024

IMPORT_TYPES = {
    "Products",
    "Customers",
    "Sales",
}

REQUIRED_COLUMNS = {
    "Products": [
        "Product Name",
        "SKU",
        "Category",
        "Unit Price",
        "Stock Quantity",
    ],
    "Customers": [
        "Name",
        "Email",
        "Phone",
    ],
    "Sales": [
        "Customer",
        "Product",
        "Quantity",
        "Unit Price",
        "Sale Date",
    ],
}

UPLOAD_DIR = Path("uploads/imports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def normalize(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_column(value: Any) -> str:
    return normalize(value).lower()


def validate_import_type(import_type: str):
    import_type = import_type.strip().title()

    if import_type not in IMPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported import type",
        )

    return import_type
def get_file_path(import_id: int) -> Path:
    return UPLOAD_DIR / f"{import_id}.csv"


def parse_csv_bytes(file_bytes: bytes, import_type: str):
    import_type = validate_import_type(import_type)

    try:
        text = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV file must use UTF-8 encoding",
        )

    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise HTTPException(
            status_code=400,
            detail="CSV file does not contain column headers",
        )

    actual_columns = [
        normalize(column)
        for column in reader.fieldnames
    ]

    required_columns = REQUIRED_COLUMNS[import_type]

    actual_normalized = {
        normalize_column(column): column
        for column in actual_columns
    }

    missing_columns = []

    for required in required_columns:
        if normalize_column(required) not in actual_normalized:
            missing_columns.append(required)

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Missing required columns: "
                f"{', '.join(missing_columns)}"
            ),
        )

    rows = []

    for row in reader:
        cleaned_row = {}

        for key, value in row.items():
            cleaned_row[normalize(key)] = normalize(value)

        if any(cleaned_row.values()):
            rows.append(cleaned_row)

    return actual_columns, rows


def is_valid_email(email: str) -> bool:
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return bool(re.match(pattern, email))


def is_valid_phone(phone: str) -> bool:
    digits = re.sub(r"\D", "", phone)
    return 10 <= len(digits) <= 15


def parse_float(value: str):
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def parse_int(value: str):
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def parse_sale_date(value: str):
    if not value:
        return None

    formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M:%S",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


def validate_product_row(
    db: Session,
    row: dict,
    company_id: int,
    seen_skus: set,
):
    errors = []

    name = normalize(row.get("Product Name"))
    sku = normalize(row.get("SKU"))
    category_name = normalize(row.get("Category"))
    unit_price = parse_float(row.get("Unit Price"))
    stock_quantity = parse_int(row.get("Stock Quantity"))

    if not name:
        errors.append("Product Name is required")

    if not sku:
        errors.append("SKU is required")

    if unit_price is None:
        errors.append("Unit Price must be a valid number")
    elif unit_price <= 0:
        errors.append("Unit Price must be greater than zero")

    if stock_quantity is None:
        errors.append(
            "Stock Quantity must be a valid integer"
        )
    elif stock_quantity < 0:
        errors.append(
            "Stock Quantity cannot be negative"
        )

    if not category_name:
        errors.append("Category is required")

    if sku:
        sku_key = sku.lower()

        if sku_key in seen_skus:
            errors.append("Duplicate SKU in CSV")

        existing = (
            db.query(Product)
            .filter(
                Product.company_id == company_id,
                Product.sku == sku,
            )
            .first()
        )

        if existing:
            errors.append("SKU already exists")

        seen_skus.add(sku_key)

    if category_name:
        category = (
            db.query(Category)
            .filter(
                Category.company_id == company_id,
                Category.name.ilike(category_name),
            )
            .first()
        )

        if not category:
            errors.append("Category does not exist")

    return errors


def validate_customer_row(
    db: Session,
    row: dict,
    company_id: int,
    seen_emails: set,
    seen_phones: set,
):
    errors = []

    name = normalize(row.get("Name"))
    email = normalize(row.get("Email")).lower()
    phone = normalize(row.get("Phone"))

    if not name:
        errors.append("Name is required")

    if not email:
        errors.append("Email is required")
    elif not is_valid_email(email):
        errors.append("Invalid email address")

    if not phone:
        errors.append("Phone is required")
    elif not is_valid_phone(phone):
        errors.append("Invalid phone number")

    if email:

        if email in seen_emails:
            errors.append("Duplicate email in CSV")

        existing = (
            db.query(Customer)
            .filter(
                Customer.company_id == company_id,
                Customer.email.ilike(email),
            )
            .first()
        )

        if existing:
            errors.append(
                "Customer email already exists"
            )

        seen_emails.add(email)

    if phone:

        if phone in seen_phones:
            errors.append(
                "Duplicate phone number in CSV"
            )

        existing = (
            db.query(Customer)
            .filter(
                Customer.company_id == company_id,
                Customer.phone == phone,
            )
            .first()
        )

        if existing:
            errors.append(
                "Customer phone number already exists"
            )

        seen_phones.add(phone)

    return errors


def find_customer(
    db: Session,
    company_id: int,
    value: str,
):
    value = normalize(value)

    if not value:
        return None

    return (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            (
                Customer.full_name.ilike(value)
                | Customer.email.ilike(value)
                | Customer.customer_id.ilike(value)
            ),
        )
        .first()
    )


def find_product(
    db: Session,
    company_id: int,
    value: str,
):
    value = normalize(value)

    if not value:
        return None

    return (
        db.query(Product)
        .filter(
            Product.company_id == company_id,
            (
                Product.name.ilike(value)
                | Product.sku.ilike(value)
            ),
        )
        .first()
    )


def is_duplicate_sale(
    db: Session,
    company_id: int,
    customer_id: int,
    product_id: int,
    quantity: int,
    unit_price: float,
    sale_date: datetime,
) -> bool:

    if not sale_date:
        return False

    start_of_day = sale_date.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )

    next_day = start_of_day + timedelta(days=1)

    existing_sale = (
        db.query(Sale)
        .join(
            SaleItem,
            SaleItem.sale_id == Sale.id,
        )
        .filter(
            Sale.company_id == company_id,
            Sale.customer_id == customer_id,
            SaleItem.product_id == product_id,
            SaleItem.quantity == quantity,
            Sale.sale_date >= start_of_day,
            Sale.sale_date < next_day,
            cast(
                SaleItem.unit_price,
                Float,
            ) == float(unit_price),
        )
        .first()
    )

    return existing_sale is not None


def validate_sale_row(
    db: Session,
    row: dict,
    company_id: int,
    seen_sales: set,
):
    errors = []

    customer_value = normalize(row.get("Customer"))
    product_value = normalize(row.get("Product"))

    quantity = parse_int(row.get("Quantity"))
    unit_price = parse_float(row.get("Unit Price"))
    sale_date = parse_sale_date(row.get("Sale Date"))

    customer = find_customer(
        db,
        company_id,
        customer_value,
    )

    if not customer:
        errors.append("Customer does not exist")

    product = find_product(
        db,
        company_id,
        product_value,
    )

    if not product:
        errors.append("Product does not exist")

    if quantity is None:
        errors.append(
            "Quantity must be a valid integer"
        )
    elif quantity <= 0:
        errors.append(
            "Quantity must be greater than zero"
        )

    if unit_price is None:
        errors.append(
            "Unit Price must be a valid number"
        )
    elif unit_price <= 0:
        errors.append(
            "Unit Price must be greater than zero"
        )

    if not sale_date:
        errors.append("Invalid Sale Date")

    if (
        product
        and quantity is not None
        and quantity > 0
    ):
        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.company_id == company_id,
                Inventory.product_id == product.id,
            )
            .first()
        )

        available_stock = (
            inventory.available_stock
            if inventory
            else product.stock_quantity
        )

        if quantity > available_stock:
            errors.append(
                f"Insufficient stock. "
                f"Available stock: {available_stock}"
            )

    if (
        customer
        and product
        and quantity is not None
        and quantity > 0
        and unit_price is not None
        and unit_price > 0
        and sale_date
    ):

        sale_key = (
            customer.id,
            product.id,
            quantity,
            round(float(unit_price), 2),
            sale_date.date(),
        )

        if sale_key in seen_sales:
            errors.append(
                "Duplicate sale transaction in CSV"
            )
        else:
            seen_sales.add(sale_key)

        if is_duplicate_sale(
            db=db,
            company_id=company_id,
            customer_id=customer.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
            sale_date=sale_date,
        ):
            errors.append(
                "Sale transaction already exists"
            )

    return errors


def validate_csv(
    db: Session,
    import_type: str,
    rows: list[dict],
    company_id: int,
):
    errors = []
    valid_records = 0
    duplicate_records = 0

    seen_skus = set()
    seen_emails = set()
    seen_phones = set()
    seen_sales = set()

    for index, row in enumerate(rows, start=2):

        row_errors = []

        if import_type == "Products":

            row_errors = validate_product_row(
                db,
                row,
                company_id,
                seen_skus,
            )

        elif import_type == "Customers":

            row_errors = validate_customer_row(
                db,
                row,
                company_id,
                seen_emails,
                seen_phones,
            )

        elif import_type == "Sales":

            row_errors = validate_sale_row(
                db,
                row,
                company_id,
                seen_sales,
            )

        if row_errors:

            duplicate_messages = [
                error
                for error in row_errors
                if (
                    "Duplicate" in error
                    or "already exists" in error
                )
            ]

            if duplicate_messages:
                duplicate_records += 1

            errors.append(
                {
                    "row_number": index,
                    "error_type": "Validation",
                    "error_message": "; ".join(
                        row_errors
                    ),
                    "row_data": row,
                }
            )

        else:
            valid_records += 1

    return {
        "valid_records": valid_records,
        "invalid_records": len(errors),
        "duplicate_records": duplicate_records,
        "errors": errors,
    }


def save_import_errors(
    db: Session,
    import_id: int,
    errors: list[dict],
):
    db.query(ImportErrorRecord).filter(
        ImportErrorRecord.import_id == import_id
    ).delete(
        synchronize_session=False
    )

    for error in errors:

        db.add(
            ImportErrorRecord(
                import_id=import_id,
                row_number=error["row_number"],
                error_type=error["error_type"],
                error_message=error["error_message"],
                row_data=json.dumps(
                    error.get("row_data", {}),
                    default=str,
                ),
            )
        )


def upload_import_file(
    db: Session,
    file: UploadFile,
    import_type: str,
    current_user: User,
):
    validate_import_type(import_type)

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a CSV file",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported",
        )

    file_bytes = file.file.read()

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 10 MB",
        )

    columns, rows = parse_csv_bytes(
        file_bytes,
        import_type,
    )

    history = ImportHistory(
        company_id=current_user.company_id,
        import_type=import_type,
        filename=file.filename,
        uploaded_by=current_user.id,
        total_records=len(rows),
        successful_records=0,
        failed_records=0,
        duplicate_records=0,
        status="Pending",
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    file_path = get_file_path(history.id)

    try:
        file_path.write_bytes(file_bytes)

    except Exception:

        db.delete(history)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Unable to save uploaded file",
        )

    preview = rows[:10]

    return {
        "import_id": history.id,
        "import_type": import_type,
        "filename": file.filename,
        "total_records": len(rows),
        "columns": columns,
        "preview": preview,
        "status": history.status,
    }


def validate_import(
    db: Session,
    import_id: int,
    current_user: User,
):
    history = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    file_path = get_file_path(import_id)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found",
        )

    file_bytes = file_path.read_bytes()

    try:

        _, rows = parse_csv_bytes(
            file_bytes,
            history.import_type,
        )

        result = validate_csv(
            db,
            history.import_type,
            rows,
            current_user.company_id,
        )

        history.total_records = len(rows)

        history.failed_records = result[
            "invalid_records"
        ]

        history.duplicate_records = result[
            "duplicate_records"
        ]

        if result["invalid_records"] > 0:
            history.status = "Completed with Errors"
        else:
            history.status = "Pending"

        save_import_errors(
            db,
            import_id,
            result["errors"],
        )

        db.commit()

        return {
            "import_id": import_id,
            "total_records": len(rows),
            "valid_records": result["valid_records"],
            "invalid_records": result["invalid_records"],
            "duplicate_records": result["duplicate_records"],
            "errors": result["errors"],
            "status": history.status,
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        notify_system_alert(
        db=db,
        company_id=current_user.company_id,
        title="Import Validation System Error",
        message=(
            f"An unexpected error occurred while validating "
            f"import #{import_id}: {str(e)}"
        ),
        priority="High",
        resource_type="Import",
        resource_id=import_id,
        expires_in_hours=24,
    )

    raise HTTPException(
        status_code=400,
        detail="Unable to validate import file",
    )


def generate_customer_id(
    db: Session,
    company_id: int,
):
    count = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id
        )
        .count()
    )

    return f"CUST{count + 1:04d}"


def generate_invoice_number():
    return (
        f"INV-{datetime.utcnow().strftime('%Y%m%d')}-"
        f"{uuid.uuid4().hex[:8].upper()}"
    )


def import_products(
    db: Session,
    rows: list[dict],
    company_id: int,
):
    successful = 0
    failed = 0

    for row in rows:

        try:

            with db.begin_nested():

                category = (
                    db.query(Category)
                    .filter(
                        Category.company_id == company_id,
                        Category.name.ilike(
                            normalize(row["Category"])
                        ),
                    )
                    .first()
                )

                if not category:
                    raise ValueError(
                        "Category does not exist"
                    )

                unit_price = float(
                    row["Unit Price"]
                )

                stock_quantity = int(
                    row["Stock Quantity"]
                )

                product = Product(
                    company_id=company_id,
                    category_id=category.id,
                    name=normalize(
                        row["Product Name"]
                    ),
                    sku=normalize(row["SKU"]),
                    unit_price=unit_price,
                    cost_price=unit_price,
                    stock_quantity=stock_quantity,
                    status="Active",
                )

                db.add(product)
                db.flush()

                inventory = Inventory(
                    company_id=company_id,
                    product_id=product.id,
                    current_stock=stock_quantity,
                    reserved_stock=0,
                    available_stock=stock_quantity,
                    reorder_level=10,
                    stock_status=(
                        "Out of Stock"
                        if stock_quantity == 0
                        else "In Stock"
                    ),
                )

                db.add(inventory)

            successful += 1

        except Exception:
            failed += 1

    return successful, failed


def import_customers(
    db: Session,
    rows: list[dict],
    company_id: int,
):
    successful = 0
    failed = 0

    for row in rows:

        try:

            with db.begin_nested():

                customer = Customer(
                    customer_id=generate_customer_id(
                        db,
                        company_id,
                    ),
                    company_id=company_id,
                    full_name=normalize(
                        row["Name"]
                    ),
                    email=normalize(
                        row["Email"]
                    ).lower(),
                    phone=normalize(
                        row["Phone"]
                    ),
                    customer_type="Retail",
                    customer_segment="New",
                    preferred_sales_channel="Retail Store",
                    is_active=True,
                )

                db.add(customer)

            successful += 1

        except Exception:
            failed += 1

    return successful, failed


def import_sales(
    db: Session,
    rows: list[dict],
    company_id: int,
):
    successful = 0
    failed = 0

    for row in rows:

        try:

            with db.begin_nested():

                customer = find_customer(
                    db,
                    company_id,
                    row["Customer"],
                )

                product = find_product(
                    db,
                    company_id,
                    row["Product"],
                )

                if not customer or not product:
                    raise ValueError(
                        "Customer or Product not found"
                    )

                quantity = int(
                    row["Quantity"]
                )

                unit_price = float(
                    row["Unit Price"]
                )

                sale_date = parse_sale_date(
                    row["Sale Date"]
                )

                if not sale_date:
                    raise ValueError(
                        "Invalid Sale Date"
                    )

                inventory = (
                    db.query(Inventory)
                    .filter(
                        Inventory.company_id == company_id,
                        Inventory.product_id == product.id,
                    )
                    .first()
                )

                if inventory:

                    available_stock = (
                        inventory.available_stock
                    )

                    if quantity > available_stock:
                        raise ValueError(
                            "Insufficient stock"
                        )

                    inventory.current_stock -= quantity
                    inventory.available_stock -= quantity

                    inventory.stock_status = (
                        "Out of Stock"
                        if inventory.available_stock == 0
                        else "In Stock"
                    )

                else:

                    if quantity > product.stock_quantity:
                        raise ValueError(
                            "Insufficient stock"
                        )

                    product.stock_quantity -= quantity

                total_amount = (
                    quantity * unit_price
                )

                sale = Sale(
                    company_id=company_id,
                    invoice_number=generate_invoice_number(),
                    customer_id=customer.id,
                    customer_name=customer.full_name,
                    sale_date=sale_date,
                    sales_channel="Imported",
                    payment_method="Imported",
                    payment_status="Paid",
                    total_amount=total_amount,
                )

                db.add(sale)
                db.flush()

                sale_item = SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    category_id=product.category_id,
                    quantity=quantity,
                    unit_price=unit_price,
                    discount=0,
                    tax=0,
                    total=total_amount,
                )

                db.add(sale_item)

            successful += 1

        except Exception:
            failed += 1

    return successful, failed


def process_import(
    db: Session,
    import_id: int,
    current_user: User,
):
    history = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    file_path = get_file_path(import_id)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found",
        )

    file_bytes = file_path.read_bytes()

    try:

        _, rows = parse_csv_bytes(
            file_bytes,
            history.import_type,
        )

        validation = validate_csv(
            db,
            history.import_type,
            rows,
            current_user.company_id,
        )

        history.status = "Processing"
        db.commit()

        valid_rows = []

        invalid_row_numbers = {
            error["row_number"]
            for error in validation["errors"]
        }

        for index, row in enumerate(
            rows,
            start=2,
        ):
            if index not in invalid_row_numbers:
                valid_rows.append(row)

        if history.import_type == "Products":

            successful, failed = import_products(
                db,
                valid_rows,
                current_user.company_id,
            )

        elif history.import_type == "Customers":

            successful, failed = import_customers(
                db,
                valid_rows,
                current_user.company_id,
            )

        else:

            successful, failed = import_sales(
                db,
                valid_rows,
                current_user.company_id,
            )

        validation_failures = validation["invalid_records"]

        history.total_records = len(rows)

        history.successful_records = successful

        history.failed_records = (
            failed + validation_failures
        )

        history.duplicate_records = (
            validation["duplicate_records"]
        )

        history.completed_at = datetime.utcnow()

        if history.failed_records == 0:
            history.status = "Completed"
        else:
            history.status = "Completed with Errors"

        db.commit()

        # =====================================================
        # TASK 14 — IMPORT NOTIFICATION
        # =====================================================

        if history.status == "Completed":

            notify_admins(
                db=db,
                company_id=current_user.company_id,
                notification_type="Import Completed",
                title="Data Import Completed",
                message=(
                    f"{history.import_type} import "
                    f"'{history.filename}' completed successfully. "
                    f"{history.successful_records} records imported."
                ),
                priority="Low",
                resource_type="Import",
                resource_id=history.id,
                expires_in_hours=48,
            )

        elif history.status == "Completed with Errors":

            notify_admins(
                db=db,
                company_id=current_user.company_id,
                notification_type="Import Completed",
                title="Data Import Completed with Errors",
                message=(
                    f"{history.import_type} import "
                    f"'{history.filename}' completed with errors. "
                    f"Successful: {history.successful_records}, "
                    f"Failed: {history.failed_records}, "
                    f"Duplicates: {history.duplicate_records}."
                ),
                priority="Medium",
                resource_type="Import",
                resource_id=history.id,
                expires_in_hours=48,
            )

        return {
            "import_id": history.id,
            "import_type": history.import_type,
            "total_records": history.total_records,
            "successful_records": history.successful_records,
            "failed_records": history.failed_records,
            "duplicate_records": history.duplicate_records,
            "validation_failures": validation_failures,
            "status": history.status,
        }

    except HTTPException:
        raise

    except Exception:

        db.rollback()

        history = (
            db.query(ImportHistory)
            .filter(
                ImportHistory.id == import_id,
                ImportHistory.company_id == current_user.company_id,
            )
            .first()
        )

        if history:

            history.status = "Failed"

            db.commit()

            # =================================================
            # TASK 14 — IMPORT FAILURE NOTIFICATION
            # =================================================

            notify_admins(
                db=db,
                company_id=current_user.company_id,
                notification_type="Import Failed",
                title="Data Import Failed",
                message=(
                    f"{history.import_type} import "
                    f"'{history.filename}' failed during processing."
                ),
                priority="High",
                resource_type="Import",
                resource_id=history.id,
                expires_in_hours=48,
            )

        raise HTTPException(
            status_code=500,
            detail="Import processing failed",
        )


def get_import_history(
    db: Session,
    current_user: User,
):
    return (
        db.query(ImportHistory)
        .filter(
            ImportHistory.company_id == current_user.company_id
        )
        .order_by(
            ImportHistory.created_at.desc()
        )
        .all()
    )


def get_import_details(
    db: Session,
    import_id: int,
    current_user: User,
):
    history = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    return {
        "id": history.id,
        "import_type": history.import_type,
        "filename": history.filename,
        "uploaded_by": history.uploaded_by,
        "total_records": history.total_records,
        "successful_records": history.successful_records,
        "failed_records": history.failed_records,
        "duplicate_records": history.duplicate_records,
        "status": history.status,
        "created_at": history.created_at,
        "completed_at": history.completed_at,
    }


def get_import_errors(
    db: Session,
    import_id: int,
    current_user: User,
):
    history = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    error_records = (
        db.query(ImportErrorRecord)
        .filter(
            ImportErrorRecord.import_id == import_id
        )
        .order_by(
            ImportErrorRecord.row_number
        )
        .all()
    )

    result = []

    for error in error_records:

        try:
            row_data = json.loads(
                error.row_data or "{}"
            )
        except json.JSONDecodeError:
            row_data = {}

        result.append(
            {
                "id": error.id,
                "import_id": error.import_id,
                "row_number": error.row_number,
                "error_type": error.error_type,
                "error_message": error.error_message,
                "row_data": row_data,
            }
        )

    return result