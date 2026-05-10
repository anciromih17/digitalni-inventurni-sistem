from app.models.audit_log import AuditLog


def create_audit_log(db, entry: dict):
    audit_log = AuditLog(**entry)
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(db, action: str | None = None, limit: int = 50):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)

    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
