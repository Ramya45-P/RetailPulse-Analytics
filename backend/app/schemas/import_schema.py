from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ImportUploadResponse(BaseModel):
    import_id: int
    import_type: str
    filename: str
    total_records: int
    columns: List[str]
    preview: List[Dict[str, Any]]
    status: str


class ImportValidationError(BaseModel):
    row_number: int
    error_type: str
    error_message: str
    row_data: Optional[Dict[str, Any]] = None


class ImportValidationResponse(BaseModel):
    import_id: int
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    errors: List[ImportValidationError]
    status: str


class ImportProcessResponse(BaseModel):
    import_id: int
    import_type: str
    total_records: int
    successful_records: int
    failed_records: int
    duplicate_records: int
    validation_failures: int
    status: str


class ImportHistoryResponse(BaseModel):
    id: int
    import_type: str
    filename: str
    uploaded_by: int
    total_records: int
    successful_records: int
    failed_records: int
    duplicate_records: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class ImportErrorResponse(BaseModel):
    id: int
    import_id: int
    row_number: int
    error_type: str
    error_message: str
    row_data: Optional[Dict[str, Any]] = None