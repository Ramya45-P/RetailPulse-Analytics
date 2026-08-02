from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.schemas.analytics_schema import AnalyticsResponse
from app.services.analytics_service import get_dashboard_analytics

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "/dashboard",
    response_model=AnalyticsResponse,
)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_analytics(
        db,
        current_user.company_id,
    )