from app.main import app

from app.database.database import SessionLocal
from app.services.audit_service import create_audit_log


def test_audit_log():
    db = SessionLocal()

    try:
        audit_log = create_audit_log(
            db=db,
            company_id=1,
            user_id=3,
            action="CREATE",
            resource_type="TEST",
            resource_id="TEST-001",
            description="Controlled audit service test",
            after_values={
                "test": True,
                "message": "Audit service is working",
            },
        )

        print("Audit log created successfully!")
        print("ID:", audit_log.id)
        print("Company ID:", audit_log.company_id)
        print("User ID:", audit_log.user_id)
        print("Action:", audit_log.action)
        print("Resource Type:", audit_log.resource_type)
        print("Resource ID:", audit_log.resource_id)
        print("Description:", audit_log.description)
        print("Status:", audit_log.status)
        print("Created At:", audit_log.created_at)

    except Exception as e:
        db.rollback()
        print("Audit log creation failed!")
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    test_audit_log()