
from calendar import monthrange
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.scheduled_report import ScheduledReport
from app.models.report_history import ReportHistory
from app.routers.reporting_router import (
    ReportRequest,
    build_report,
    build_product_performance,
)

logger = logging.getLogger(__name__)

TIMEZONE = ZoneInfo("Asia/Kolkata")

scheduler = BackgroundScheduler(timezone=TIMEZONE)


def get_local_now() -> datetime:
    """Return the current time in India Standard Time."""
    return datetime.now(TIMEZONE)


def calculate_next_run(
    schedule: ScheduledReport,
    base: datetime | None = None,
    initial: bool = False,
) -> datetime:
    """Calculate the next scheduled execution time."""
    now = get_local_now()

    try:
        execution_time = datetime.strptime(
            schedule.execution_time,
            "%H:%M",
        ).time()
    except (ValueError, TypeError):
        execution_time = time(9, 0)

    if initial or base is None:
        reference = now
    else:
        reference = base

        if reference.tzinfo is None:
            reference = reference.replace(tzinfo=TIMEZONE)
        else:
            reference = reference.astimezone(TIMEZONE)

    candidate = datetime.combine(
        reference.date(),
        execution_time,
        tzinfo=TIMEZONE,
    )

    frequency = (schedule.frequency or "daily").lower()

    if initial or base is None:
        if candidate <= now:
            if frequency == "weekly":
                candidate += timedelta(days=7)
            elif frequency == "monthly":
                year = candidate.year
                month = candidate.month + 1

                if month > 12:
                    year += 1
                    month = 1

                day = min(
                    candidate.day,
                    monthrange(year, month)[1],
                )

                candidate = datetime(
                    year,
                    month,
                    day,
                    execution_time.hour,
                    execution_time.minute,
                    tzinfo=TIMEZONE,
                )
            else:
                candidate += timedelta(days=1)

        return candidate

    if frequency == "weekly":
        candidate += timedelta(days=7)
    elif frequency == "monthly":
        year = candidate.year
        month = candidate.month + 1

        if month > 12:
            year += 1
            month = 1

        day = min(
            candidate.day,
            monthrange(year, month)[1],
        )

        candidate = datetime(
            year,
            month,
            day,
            execution_time.hour,
            execution_time.minute,
            tzinfo=TIMEZONE,
        )
    else:
        candidate += timedelta(days=1)

    return candidate


def parse_report_request(
    schedule: ScheduledReport,
) -> ReportRequest:
    """Convert saved schedule filters into a report request."""
    saved_filters = schedule.report_filters or {}

    start_date = saved_filters.get("start_date")
    end_date = saved_filters.get("end_date")
    filters = saved_filters.get("filters", {})

    return ReportRequest(
        report_type=schedule.report_type,
        start_date=(
            date.fromisoformat(start_date)
            if start_date
            else None
        ),
        end_date=(
            date.fromisoformat(end_date)
            if end_date
            else None
        ),
        filters=filters if isinstance(filters, dict) else {},
        export_format=schedule.export_format,
    )


def execute_scheduled_reports() -> None:
    """Initialize missing run times and execute due active schedules."""
    db: Session = SessionLocal()

    try:
        now = get_local_now()

        schedules = (
            db.query(ScheduledReport)
            .filter(ScheduledReport.is_active.is_(True))
            .all()
        )

        for schedule in schedules:
            try:
                if not schedule.next_run_at:
                    schedule.next_run_at = calculate_next_run(
                        schedule,
                        initial=True,
                    )
                    db.commit()
                    continue

                due_time = schedule.next_run_at

                if due_time.tzinfo is None:
                    due_time = due_time.replace(tzinfo=TIMEZONE)
                else:
                    due_time = due_time.astimezone(TIMEZONE)

                if due_time > now:
                    continue

                request = parse_report_request(schedule)

                # Use the specialized builder for Product Performance.
                if request.report_type == "product_performance":
                    records = build_product_performance(
                        db,
                        schedule.company_id,
                        request,
                    )
                else:
                    records = build_report(
                        db,
                        schedule.company_id,
                        request,
                    )

                history = ReportHistory(
                    company_id=schedule.company_id,
                    generated_by=schedule.created_by,
                    report_name=schedule.name,
                    report_type=schedule.report_type,
                    report_filters=schedule.report_filters or {},
                    export_format=schedule.export_format,
                    status="SUCCESS",
                    row_count=len(records),
                    result_data=records,
                )

                db.add(history)

                schedule.last_run_at = now
                schedule.last_status = "SUCCESS"
                schedule.last_error = None
                schedule.next_run_at = calculate_next_run(
                    schedule,
                    base=due_time,
                )

                db.commit()

                logger.info(
                    "Scheduled report '%s' (ID %s) completed: %s rows.",
                    schedule.name,
                    schedule.id,
                    len(records),
                )

            except Exception as exc:
                db.rollback()

                failed_schedule = (
                    db.query(ScheduledReport)
                    .filter(ScheduledReport.id == schedule.id)
                    .first()
                )

                if failed_schedule is None:
                    logger.exception(
                        "Scheduled report disappeared during execution."
                    )
                    continue

                failed_at = get_local_now()

                failure_history = ReportHistory(
                    company_id=failed_schedule.company_id,
                    generated_by=failed_schedule.created_by,
                    report_name=failed_schedule.name,
                    report_type=failed_schedule.report_type,
                    report_filters=failed_schedule.report_filters or {},
                    export_format=failed_schedule.export_format,
                    status="FAILED",
                    row_count=0,
                    result_data=None,
                    failure_reason=str(exc)[:2000],
                )

                db.add(failure_history)

                failed_schedule.last_run_at = failed_at
                failed_schedule.last_status = "FAILED"
                failed_schedule.last_error = str(exc)[:2000]
                failed_schedule.next_run_at = calculate_next_run(
                    failed_schedule,
                    base=(
                        failed_schedule.next_run_at or failed_at
                    ),
                )

                db.commit()

                logger.exception(
                    "Scheduled report '%s' (ID %s) failed.",
                    failed_schedule.name,
                    failed_schedule.id,
                )

    except Exception:
        db.rollback()
        logger.exception("Scheduled report processing failed.")
    finally:
        db.close()


def start_report_scheduler() -> None:
    """Start the background scheduler."""
    if not scheduler.running:
        scheduler.add_job(
            execute_scheduled_reports,
            trigger="interval",
            seconds=30,
            id="retailpulse_scheduled_reports",
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )

        scheduler.start()
        print("SCHEDULER RUNNING:", scheduler.running)
        print("REGISTERED JOBS:", scheduler.get_jobs())
        logger.info("RetailPulse report scheduler started.")


def stop_report_scheduler() -> None:
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("RetailPulse report scheduler stopped.")
