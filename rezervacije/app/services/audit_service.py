from app.repositories import audit_repository


def log_reservation_audit(db, action: str, reservation_id: int | None, actor: str, details: dict):
    return audit_repository.create_audit_log(
        db,
        {
            "service_name": "reservations-service",
            "entity_type": "reservation",
            "entity_id": reservation_id,
            "action": action,
            "actor": actor or "system",
            "details": details or {},
        },
    )


def get_audit_logs(db, action: str | None = None, limit: int = 50):
    return audit_repository.get_audit_logs(db, action=action, limit=limit)
