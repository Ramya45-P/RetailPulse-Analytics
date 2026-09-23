from datetime import datetime, date, time
from typing import Optional
from io import StringIO, BytesIO
import csv
import json

from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)

from app.database.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.audit_log import AuditLog


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


# ============================================================
# BUILD AUDIT LOG QUERY
# Shared by normal listing + CSV + PDF export
# ============================================================

def build_audit_query(
    db: Session,
    current_user: User,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort: str = "newest",
):
    query = (
        db.query(AuditLog)
        .filter(
            AuditLog.company_id == current_user.company_id
        )
    )

    # ========================================================
    # SEARCH
    # ========================================================

    if search:
        search_value = f"%{search.strip()}%"

        query = query.outerjoin(
            User,
            AuditLog.user_id == User.id,
        ).filter(
            or_(
                User.full_name.ilike(search_value),
                User.email.ilike(search_value),
                AuditLog.action.ilike(search_value),
                AuditLog.resource_type.ilike(search_value),
                AuditLog.resource_id.ilike(search_value),
                AuditLog.description.ilike(search_value),
            )
        )

    # ========================================================
    # FILTER BY USER
    # ========================================================

    if user_id is not None:
        query = query.filter(
            AuditLog.user_id == user_id
        )

    # ========================================================
    # FILTER BY ACTION
    # ========================================================

    if action:
        query = query.filter(
            AuditLog.action == action
        )

    # ========================================================
    # FILTER BY RESOURCE TYPE
    # ========================================================

    if resource_type:
        query = query.filter(
            AuditLog.resource_type == resource_type
        )

    # ========================================================
    # FILTER BY STATUS
    # ========================================================

    if status:
        query = query.filter(
            AuditLog.status == status
        )

    # ========================================================
    # DATE RANGE
    # ========================================================

    if start_date:
        start_datetime = datetime.combine(
            start_date,
            time.min
        )

        query = query.filter(
            AuditLog.created_at >= start_datetime
        )

    if end_date:
        end_datetime = datetime.combine(
            end_date,
            time.max
        )

        query = query.filter(
            AuditLog.created_at <= end_datetime
        )

    # ========================================================
    # SORTING
    # ========================================================

    if sort.lower() == "oldest":
        query = query.order_by(
            AuditLog.created_at.asc()
        )
    else:
        query = query.order_by(
            AuditLog.created_at.desc()
        )

    return query


# ============================================================
# CONVERT AUDIT LOG TO RESPONSE
# Adds User Name + User Email
# ============================================================

def serialize_audit_log(
    log: AuditLog,
    db: Session,
):
    user = None

    if log.user_id is not None:
        user = (
            db.query(User)
            .filter(
                User.id == log.user_id,
                User.company_id == log.company_id,
            )
            .first()
        )

    return {
        "id": log.id,
        "company_id": log.company_id,
        "user_id": log.user_id,
        "user_name": user.full_name if user else None,
        "user_email": user.email if user else None,
        "action": log.action,
        "resource_type": log.resource_type,
        "resource_id": log.resource_id,
        "description": log.description,
        "ip_address": log.ip_address,
        "user_agent": log.user_agent,
        "before_values": log.before_values,
        "after_values": log.after_values,
        "status": log.status,
        "created_at": log.created_at,
    }


# ============================================================
# GET AUDIT LOGS
# Pagination + Search + Filters + Sorting
# ============================================================

@router.get("/")
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),

    search: Optional[str] = Query(None),

    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),

    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),

    sort: str = Query("newest"),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    query = build_audit_query(
        db=db,
        current_user=current_user,
        search=search,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort=sort,
    )

    # ========================================================
    # TOTAL COUNT
    # ========================================================

    total = query.count()

    # ========================================================
    # PAGINATION
    # ========================================================

    offset = (page - 1) * limit

    logs = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    # ========================================================
    # SERIALIZE WITH USER INFORMATION
    # ========================================================

    items = [
        serialize_audit_log(log, db)
        for log in logs
    ]

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "sort": sort,
    }


# ============================================================
# EXPORT AUDIT LOGS AS CSV
# ============================================================

@router.get("/export/csv")
def export_audit_logs_csv(
    search: Optional[str] = Query(None),

    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),

    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),

    sort: str = Query("newest"),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    query = build_audit_query(
        db=db,
        current_user=current_user,
        search=search,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort=sort,
    )

    logs = query.all()

    # ========================================================
    # CREATE CSV IN MEMORY
    # ========================================================

    output = StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Audit ID",
        "Company ID",
        "User ID",
        "User Name",
        "User Email",
        "Action",
        "Resource Type",
        "Resource ID",
        "Description",
        "IP Address",
        "User Agent",
        "Before Values",
        "After Values",
        "Status",
        "Created At",
    ])

    for log in logs:

        user = None

        if log.user_id is not None:
            user = (
                db.query(User)
                .filter(
                    User.id == log.user_id,
                    User.company_id == log.company_id,
                )
                .first()
            )

        writer.writerow([
            log.id,
            log.company_id,
            log.user_id,
            user.full_name if user else "",
            user.email if user else "",
            log.action,
            log.resource_type,
            log.resource_id,
            log.description,
            log.ip_address,
            log.user_agent,
            json.dumps(
                log.before_values,
                default=str
            ) if log.before_values is not None else "",
            json.dumps(
                log.after_values,
                default=str
            ) if log.after_values is not None else "",
            log.status,
            (
                log.created_at.isoformat()
                if log.created_at
                else ""
            ),
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; "
                "filename=audit_logs.csv"
            )
        },
    )


# ============================================================
# EXPORT AUDIT LOGS AS PDF
# ============================================================

@router.get("/export/pdf")
def export_audit_logs_pdf(
    search: Optional[str] = Query(None),

    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),

    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),

    sort: str = Query("newest"),

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    query = build_audit_query(
        db=db,
        current_user=current_user,
        search=search,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort=sort,
    )

    logs = query.all()

    # ========================================================
    # CREATE PDF IN MEMORY
    # ========================================================

    pdf_buffer = BytesIO()

    document = SimpleDocTemplate(
        pdf_buffer,
        pagesize=landscape(A4),
        rightMargin=20,
        leftMargin=20,
        topMargin=20,
        bottomMargin=20,
    )

    styles = getSampleStyleSheet()

    title = Paragraph(
        "RetailPulse Audit Logs",
        styles["Title"],
    )

    subtitle = Paragraph(
        f"Company ID: {current_user.company_id}",
        styles["Normal"],
    )

    elements = [
        title,
        Spacer(1, 8),
        subtitle,
        Spacer(1, 15),
    ]

    # ========================================================
    # PDF TABLE
    # ========================================================

    table_data = [
        [
            "ID",
            "User",
            "Action",
            "Resource",
            "Resource ID",
            "Description",
            "IP Address",
            "Status",
            "Created At",
        ]
    ]

    for log in logs:

        user = None

        if log.user_id is not None:
            user = (
                db.query(User)
                .filter(
                    User.id == log.user_id,
                    User.company_id == log.company_id,
                )
                .first()
            )

        table_data.append([
            str(log.id),
            (
                user.full_name
                if user
                else str(log.user_id or "")
            ),
            str(log.action or ""),
            str(log.resource_type or ""),
            str(log.resource_id or ""),
            str(log.description or ""),
            str(log.ip_address or ""),
            str(log.status or ""),
            (
                log.created_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if log.created_at
                else ""
            ),
        ])

    table = Table(
        table_data,
        repeatRows=1,
        colWidths=[
            35,
            80,
            55,
            65,
            65,
            180,
            75,
            55,
            100,
        ],
    )

    table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.grey,
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),
            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                7,
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.grey,
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "TOP",
            ),
            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                4,
            ),
        ])
    )

    elements.append(table)

    document.build(elements)

    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; "
                "filename=audit_logs.pdf"
            )
        },
    )


# ============================================================
# GET SINGLE AUDIT LOG
# ============================================================

@router.get("/{audit_id}")
def get_audit_log(
    audit_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_admin),
):
    log = (
        db.query(AuditLog)
        .filter(
            AuditLog.id == audit_id,
            AuditLog.company_id == current_user.company_id,
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found",
        )

    return serialize_audit_log(log, db)