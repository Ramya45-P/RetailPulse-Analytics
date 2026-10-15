# backend/app/routers/reporting_router.py

import csv
import io
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import MetaData, Table, inspect, select,func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product


router = APIRouter(prefix="/reports", tags=["Reporting"])


# ---------------------------------------------------------
# REQUEST SCHEMAS
# ---------------------------------------------------------

class ReportRequest(BaseModel):
    report_type: str
    start_date: date | None = None
    end_date: date | None = None
    filters: dict[str, Any] = Field(default_factory=dict)
    export_format: str = "CSV"


class ScheduledReportRequest(BaseModel):
    name: str
    report_type: str
    report_filters: dict[str, Any] = Field(default_factory=dict)
    frequency: str
    execution_time: str = "09:00"
    recipients: list[str] = Field(default_factory=list)
    export_format: str = "CSV"
    is_active: bool = True


class ScheduledReportUpdate(BaseModel):
    name: str | None = None
    report_type: str | None = None
    report_filters: dict[str, Any] | None = None
    frequency: str | None = None
    execution_time: str | None = None
    recipients: list[str] | None = None
    export_format: str | None = None
    is_active: bool | None = None


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

REPORT_TABLES = {
    "sales": ["sales", "sales_transactions", "orders"],
    "inventory": ["inventory", "products"],
    "customers": ["customers", "customer"],
    "product_performance": ["sales", "sales_transactions", "orders"],
    "stock_movement": [
        "inventory_movements",
        "stock_movements",
        "inventory_movement",
    ],
}

ALLOWED_REPORT_TYPES = set(REPORT_TABLES.keys())


def get_company_id(user):
    company_id = getattr(user, "company_id", None)

    if company_id is None:
        raise HTTPException(
            status_code=400,
            detail="The logged-in user does not have a company assigned.",
        )

    return company_id


def json_safe(value):
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}

    if isinstance(value, (list, tuple)):
        return [json_safe(v) for v in value]

    return value


def get_report_table(db: Session, report_type: str):
    if report_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported report type. Choose sales, inventory, "
                "customers, product_performance, or stock_movement."
            ),
        )

    inspector = inspect(db.get_bind())
    existing_tables = set(inspector.get_table_names())

    table_name = next(
        (
            name
            for name in REPORT_TABLES[report_type]
            if name in existing_tables
        ),
        None,
    )

    if table_name is None:
        raise HTTPException(
            status_code=404,
            detail=f"No database table was found for report type '{report_type}'.",
        )

    metadata = MetaData()
    table = Table(
        table_name,
        metadata,
        autoload_with=db.get_bind(),
    )

    return table


def build_product_performance(db, company_id, request):
    query = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.sku.label("sku"),
            func.sum(SaleItem.quantity).label("quantity_sold"),
            func.sum(SaleItem.total).label("total_revenue"),
            func.avg(SaleItem.unit_price).label("average_selling_price"),
            func.count(func.distinct(Sale.id)).label("orders_count"),
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(
            Sale.company_id == company_id,
            Product.company_id == company_id,
        )
    )

    # Apply the selected date range.
    if request.start_date:
        query = query.filter(
            Sale.sale_date >= datetime.combine(
                request.start_date, time.min
            )
        )

    if request.end_date:
        query = query.filter(
            Sale.sale_date < datetime.combine(
                request.end_date + timedelta(days=1), time.min
            )
        )

    # Apply supported product filters.
    filters = request.filters or {}
    print(
        "DEBUG product categories:",
        db.query(
            Product.id,
            Product.name,
            Product.category_id,
            Product.company_id,
        )
        .filter(Product.company_id == company_id)
        .all()
    )
    print("DEBUG report_type:", request.report_type)
    print("DEBUG report filters:", filters)

    if filters.get("product_id") is not None:
        query = query.filter(Product.id == filters["product_id"])

    if filters.get("category_id") is not None:
        query = query.filter(
            Product.category_id == filters["category_id"]
        )

    if filters.get("sku"):
        query = query.filter(Product.sku == filters["sku"])

    if filters.get("brand"):
        query = query.filter(Product.brand == filters["brand"])

    print("DEBUG product filters:", filters)
    print(
        "DEBUG SQL:",
        query.statement.compile(
            compile_kwargs={"literal_binds": True}
        )
    )

    rows = (
        query.group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(SaleItem.total).desc())
        .limit(5000)
        .all()
    )

    return [
        json_safe({
            "product_id": row.product_id,
            "product_name": row.product_name,
            "sku": row.sku,
            "quantity_sold": row.quantity_sold or 0,
            "total_revenue": row.total_revenue or 0,
            "average_selling_price": row.average_selling_price or 0,
            "orders_count": row.orders_count or 0,
        })
        for row in rows
    ]


def build_report(
    db: Session,
    company_id: int,
    request: ReportRequest,
):
    if request.report_type == "product_performance":
        return build_product_performance(
            db, company_id, request
        )
    table = get_report_table(db, request.report_type)

    statement = select(table)

    # Restrict the query to the current company whenever supported.
    if "company_id" in table.c:
        statement = statement.where(table.c.company_id == company_id)

    # Apply date filtering when the table has a recognized date column.
    date_column = next(
        (
            name
            for name in (
                "created_at",
                "order_date",
                "sale_date",
                "transaction_date",
                "movement_date",
                "date",
            )
            if name in table.c
        ),
        None,
    )

    if date_column:
        column = table.c[date_column]

        if request.start_date:
            statement = statement.where(
                column >= datetime.combine(
                    request.start_date, time.min
                )
            )

        if request.end_date:
            statement = statement.where(
                column <= datetime.combine(
                    request.end_date, time.max
                )
            )

    # Apply only filters whose column names actually exist.
    for field, value in request.filters.items():
        if field in table.c and value is not None:
            statement = statement.where(table.c[field] == value)

    statement = statement.limit(5000)

    rows = db.execute(statement).mappings().all()
    records = [json_safe(dict(row)) for row in rows]

    return records


# ---------------------------------------------------------
# GENERATE REPORT
# ---------------------------------------------------------

@router.post("/generate")
def generate_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)

    request.report_type = request.report_type.strip().lower()
    request.export_format = request.export_format.strip().upper()

    if request.export_format not in {"CSV", "PDF", "JSON"}:
        raise HTTPException(
            status_code=400,
            detail="Export format must be CSV, PDF, or JSON.",
        )

    if (
        request.start_date
        and request.end_date
        and request.start_date > request.end_date
    ):
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date.",
        )

    if request.report_type == "product_performance":
        records = build_product_performance(db, company_id, request)
    else:
        records = build_report(db, company_id, request)

    history = ReportHistory(
        company_id=company_id,
        generated_by=current_user.id,
        report_name=request.report_type.replace("_", " ").title(),
        report_type=request.report_type,
        report_filters={
            "start_date": (
                request.start_date.isoformat()
                if request.start_date
                else None
            ),
            "end_date": (
                request.end_date.isoformat()
                if request.end_date
                else None
            ),
            "filters": request.filters,
        },
        export_format=request.export_format,
        status="SUCCESS",
        row_count=len(records),
        result_data=records,
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "message": "Report generated successfully.",
        "report_id": history.id,
        "report_name": history.report_name,
        "report_type": history.report_type,
        "export_format": history.export_format,
        "row_count": history.row_count,
        "data": records,
    }


# ---------------------------------------------------------
# REPORT HISTORY
# ---------------------------------------------------------

@router.get("/history")
def get_report_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)

    query = db.query(ReportHistory).filter(
        ReportHistory.company_id == company_id
    )

    total = query.count()

    reports = (
        query.order_by(ReportHistory.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "reports": [
            {
                "id": item.id,
                "report_name": item.report_name,
                "report_type": item.report_type,
                "export_format": item.export_format,
                "status": item.status,
                "row_count": item.row_count,
                "created_at": item.created_at,
            }
            for item in reports
        ],
    }


# ---------------------------------------------------------
# DOWNLOAD REPORT AS CSV, JSON, OR PDF
# ---------------------------------------------------------

@router.get("/history/{report_id}/download")
def download_report(
    report_id: int,
    format: str = Query("CSV"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)
    export_format = format.upper()

    if export_format not in {"CSV", "JSON", "PDF"}:
        raise HTTPException(
            status_code=400,
            detail="Format must be CSV, JSON, or PDF.",
        )

    report = (
        db.query(ReportHistory)
        .filter(
            ReportHistory.id == report_id,
            ReportHistory.company_id == company_id,
        )
        .first()
    )

    if report is None:
        raise HTTPException(status_code=404, detail="Report not found.")

    records = report.result_data or []
    filename = f"report_{report.id}.{export_format.lower()}"

    if export_format == "JSON":
        import json

        content = json.dumps(records, indent=2, ensure_ascii=False)
        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )

    if export_format == "CSV":
        output = io.StringIO()

        if records:
            headers = list(records[0].keys())
            writer = csv.DictWriter(
                output,
                fieldnames=headers,
                extrasaction="ignore",
            )
            writer.writeheader()
            writer.writerows(records)
        else:
            output.write("No data available\n")

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )

    # PDF export
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table as PDFTable,
            TableStyle,
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF export requires the reportlab package.",
        )

    buffer = io.BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
    )

    styles = getSampleStyleSheet()
    elements = [
        Paragraph(report.report_name, styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"Report ID: {report.id}", styles["Normal"]),
        Paragraph(f"Rows: {len(records)}", styles["Normal"]),
        Spacer(1, 12),
    ]

    if records:
        headers = list(records[0].keys())
        table_data = [headers]

        for record in records:
            table_data.append(
                [str(record.get(header, "")) for header in headers]
            )

        pdf_table = PDFTable(table_data, repeatRows=1)
        pdf_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                ]
            )
        )
        elements.append(pdf_table)
    else:
        elements.append(Paragraph("No data available.", styles["Normal"]))

    document.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


# ---------------------------------------------------------
# SCHEDULED REPORTS: LIST
# ---------------------------------------------------------

@router.get("/schedules")
def get_scheduled_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)

    schedules = (
        db.query(ScheduledReport)
        .filter(ScheduledReport.company_id == company_id)
        .order_by(ScheduledReport.created_at.desc())
        .all()
    )

    return {
        "total": len(schedules),
        "schedules": [
            {
                "id": item.id,
                "name": item.name,
                "report_type": item.report_type,
                "report_filters": item.report_filters,
                "frequency": item.frequency,
                "execution_time": item.execution_time,
                "recipients": item.recipients,
                "export_format": item.export_format,
                "is_active": item.is_active,
                "last_run_at": item.last_run_at,
                "next_run_at": item.next_run_at,
                "last_status": item.last_status,
                "last_error": item.last_error,
                "created_at": item.created_at,
            }
            for item in schedules
        ],
    }


# ---------------------------------------------------------
# CREATE SCHEDULE
# ---------------------------------------------------------

@router.post("/schedules")
def create_scheduled_report(
    request: ScheduledReportRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)

    report_type = request.report_type.strip().lower()
    export_format = request.export_format.strip().upper()
    frequency = request.frequency.strip().lower()

    if report_type not in ALLOWED_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid report type.")

    if export_format not in {"CSV", "PDF", "JSON"}:
        raise HTTPException(status_code=400, detail="Invalid export format.")

    if frequency not in {"daily", "weekly", "monthly"}:
        raise HTTPException(
            status_code=400,
            detail="Frequency must be daily, weekly, or monthly.",
        )

    try:
        parsed_time = datetime.strptime(request.execution_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Execution time must use HH:MM format, such as 09:00.",
        )

    schedule = ScheduledReport(
        company_id=company_id,
        created_by=current_user.id,
        name=request.name,
        report_type=report_type,
        report_filters=request.report_filters,
        frequency=frequency,
        execution_time=parsed_time.strftime("%H:%M"),
        recipients=request.recipients,
        export_format=export_format,
        is_active=request.is_active,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return {
        "message": "Scheduled report created successfully.",
        "schedule_id": schedule.id,
        "name": schedule.name,
        "frequency": schedule.frequency,
        "is_active": schedule.is_active,
    }


# ---------------------------------------------------------
# UPDATE SCHEDULE
# ---------------------------------------------------------

@router.patch("/schedules/{schedule_id}")
def update_scheduled_report(
    schedule_id: int,
    request: ScheduledReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)

    schedule = (
        db.query(ScheduledReport)
        .filter(
            ScheduledReport.id == schedule_id,
            ScheduledReport.company_id == company_id,
        )
        .first()
    )

    if schedule is None:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    updates = request.model_dump(exclude_unset=True)

    if "report_type" in updates and updates["report_type"] is not None:
        updates["report_type"] = updates["report_type"].strip().lower()

        if updates["report_type"] not in ALLOWED_REPORT_TYPES:
            raise HTTPException(status_code=400, detail="Invalid report type.")

    if "export_format" in updates and updates["export_format"] is not None:
        updates["export_format"] = updates["export_format"].strip().upper()

        if updates["export_format"] not in {"CSV", "PDF", "JSON"}:
            raise HTTPException(status_code=400, detail="Invalid export format.")

    if "frequency" in updates and updates["frequency"] is not None:
        updates["frequency"] = updates["frequency"].strip().lower()

        if updates["frequency"] not in {"daily", "weekly", "monthly"}:
            raise HTTPException(status_code=400, detail="Invalid frequency.")

    if "execution_time" in updates and updates["execution_time"] is not None:
        try:
            updates["execution_time"] = datetime.strptime(
                updates["execution_time"], "%H:%M"
            ).strftime("%H:%M")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Execution time must use HH:MM format.",
            )


    # Determine whether the schedule's timing needs to be recalculated.
    timing_changed = (
        "frequency" in updates
        or "execution_time" in updates
    )

    reactivated = (
        updates.get("is_active") is True
        and not schedule.is_active
    )

    for field, value in updates.items():
        setattr(schedule, field, value)

    # The scheduler initializes a new next_run_at when it is missing.
    if timing_changed or reactivated:
        schedule.next_run_at = None

    db.commit()
    db.refresh(schedule)

    return {
        "message": "Scheduled report updated successfully.",
        "schedule_id": schedule.id,
        "is_active": schedule.is_active,
    }


# ---------------------------------------------------------
# DELETE SCHEDULE
# ---------------------------------------------------------

@router.delete("/schedules/{schedule_id}")
def delete_scheduled_report(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_company_id(current_user)

    schedule = (
        db.query(ScheduledReport)
        .filter(
            ScheduledReport.id == schedule_id,
            ScheduledReport.company_id == company_id,
        )
        .first()
    )

    if schedule is None:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    db.delete(schedule)
    db.commit()

    return {"message": "Scheduled report deleted successfully."}
