from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer_schema import (
    CustomerCreate,
    CustomerUpdate,
)


def generate_customer_id(db: Session, company_id: int):
    count = (
        db.query(Customer)
        .filter(Customer.company_id == company_id)
        .count()
    )

    return f"CUST{count + 1:04d}"


# CREATE CUSTOMER

def create_customer(
    db: Session,
    customer: CustomerCreate,
    company_id: int,
):
    # Check duplicate email
    existing_email = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.email == customer.email,
        )
        .first()
    )

    if existing_email:
        raise ValueError("Customer email already exists")

    # Check duplicate phone
    existing_phone = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.phone == customer.phone,
        )
        .first()
    )

    if existing_phone:
        raise ValueError("Customer phone number already exists")

    db_customer = Customer(
        customer_id=generate_customer_id(db, company_id),
        company_id=company_id,
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone,
        date_of_birth=customer.date_of_birth,
        gender=customer.gender,
        address=customer.address,
        city=customer.city,
        state=customer.state,
        country=customer.country,
        postal_code=customer.postal_code,
        customer_type=customer.customer_type,
        customer_segment=customer.customer_segment,
        preferred_sales_channel=customer.preferred_sales_channel,
        is_active=True,
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    return db_customer


# GET ALL CUSTOMERS

def get_customers(
    db: Session,
    company_id: int,
):
    return (
        db.query(Customer)
        .filter(Customer.company_id == company_id)
        .all()
    )


# GET SINGLE CUSTOMER

def get_customer(
    db: Session,
    customer_id: int,
    company_id: int,
):
    return (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.company_id == company_id,
        )
        .first()
    )


# UPDATE CUSTOMER

def update_customer(
    db: Session,
    customer_id: int,
    customer_data: CustomerUpdate,
    company_id: int,
):
    customer = get_customer(
        db,
        customer_id,
        company_id,
    )

    if not customer:
        return None

    # Check duplicate email
    existing_email = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.email == customer_data.email,
            Customer.id != customer_id,
        )
        .first()
    )

    if existing_email:
        raise ValueError("Customer email already exists")

    # Check duplicate phone
    existing_phone = (
        db.query(Customer)
        .filter(
            Customer.company_id == company_id,
            Customer.phone == customer_data.phone,
            Customer.id != customer_id,
        )
        .first()
    )

    if existing_phone:
        raise ValueError("Customer phone number already exists")

    customer.full_name = customer_data.full_name
    customer.email = customer_data.email
    customer.phone = customer_data.phone
    customer.date_of_birth = customer_data.date_of_birth
    customer.gender = customer_data.gender
    customer.address = customer_data.address
    customer.city = customer_data.city
    customer.state = customer_data.state
    customer.country = customer_data.country
    customer.postal_code = customer_data.postal_code
    customer.customer_type = customer_data.customer_type
    customer.customer_segment = customer_data.customer_segment
    customer.preferred_sales_channel = (
        customer_data.preferred_sales_channel
    )
    customer.is_active = customer_data.is_active

    db.commit()
    db.refresh(customer)

    return customer


# SOFT DELETE CUSTOMER

def delete_customer(
    db: Session,
    customer_id: int,
    company_id: int,
):
    customer = get_customer(
        db,
        customer_id,
        company_id,
    )

    if not customer:
        return None

    customer.is_active = False

    db.commit()
    db.refresh(customer)

    return customer