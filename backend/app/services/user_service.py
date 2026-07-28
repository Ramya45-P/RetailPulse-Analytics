from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


def create_user(db: Session, user: UserCreate):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    hashed_password = hash_password(user.password)


    db_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password,
        company_id=user.company_id,
    )


    db.add(db_user)
    db.commit()
    db.refresh(db_user)


    return db_user

def login_user(db: Session, email: str, password: str):

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return None

    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {
            "sub": user.email,
            "user_id": user.id,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "company_id": user.company_id,
    }
