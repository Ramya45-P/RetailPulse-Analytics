from pydantic import BaseModel
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    description: str | None = None
    status: str = "Active"
    company_id: int


class CategoryResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True