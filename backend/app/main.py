from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import Base, engine
from app.models.company import Company
from app.models.user import User
from app.models.category import Category
from app.models.product import Product

from app.routers.company_router import router as company_router
from app.routers.auth_router import router as auth_router
from app.routers.profile_router import router as profile_router
from app.routers.category_router import router as category_router
from app.routers.product_router import router as product_router
from app.routers.dashboard_router import router as dashboard_router

app = FastAPI(
    title="RetailPulse Analytics API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(company_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {
        "message": "RetailPulse Analytics API is running successfully!"
    }