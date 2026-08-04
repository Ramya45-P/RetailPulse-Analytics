from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.customer_schema import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
)

from app.services.customer_service import (
    create_customer,
    get_customers,
    get_customer,
    delete_customer,
    update_customer,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


# CREATE CUSTOMER
@router.post(
    "/",
    response_model=CustomerResponse,
)
def add_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_customer(
        db,
        customer,
        current_user.company_id,
    )


# GET ALL CUSTOMERS
@router.get(
    "/",
    response_model=list[CustomerResponse],
)
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_customers(
        db,
        current_user.company_id,
    )


# GET SINGLE CUSTOMER
@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def customer_details(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer(
        db,
        customer_id,
        current_user.company_id,
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return customer


# UPDATE CUSTOMER
@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def edit_customer(
    customer_id: int,
    customer: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_customer = update_customer(
        db,
        customer_id,
        customer,
        current_user.company_id,
    )

    if not updated_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return updated_customer


# DELETE CUSTOMER
@router.delete("/{customer_id}")
def remove_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = delete_customer(
        db,
        customer_id,
        current_user.company_id,
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return {
        "message": "Customer deleted successfully"
    }