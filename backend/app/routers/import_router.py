from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User

from app.schemas.import_schema import (
    ImportUploadResponse,
    ImportValidationResponse,
    ImportProcessResponse,
    ImportHistoryResponse,
    ImportErrorResponse,
)

from app.services.import_service import (
    upload_import_file,
    validate_import,
    process_import,
    get_import_history,
    get_import_details,
    get_import_errors,
)


router = APIRouter(
    prefix="/import",
    tags=["Data Import"],
)


@router.post(
    "/upload",
    response_model=ImportUploadResponse,
)
def upload_file(
    import_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return upload_import_file(
        db=db,
        file=file,
        import_type=import_type,
        current_user=current_user,
    )


@router.post(
    "/validate/{import_id}",
    response_model=ImportValidationResponse,
)
def validate_file(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return validate_import(
        db=db,
        import_id=import_id,
        current_user=current_user,
    )


@router.post(
    "/process/{import_id}",
    response_model=ImportProcessResponse,
)
def process_file(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return process_import(
        db=db,
        import_id=import_id,
        current_user=current_user,
    )


@router.get(
    "/history",
    response_model=list[ImportHistoryResponse],
)
def import_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return get_import_history(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/{import_id}",
)
def import_details(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return get_import_details(
        db=db,
        import_id=import_id,
        current_user=current_user,
    )


@router.get(
    "/{import_id}/errors",
    response_model=list[ImportErrorResponse],
)
def import_errors(
    import_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return get_import_errors(
        db=db,
        import_id=import_id,
        current_user=current_user,
    )