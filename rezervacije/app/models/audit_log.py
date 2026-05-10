from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False, default="reservations-service")
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    actor = Column(String, nullable=False, default="system")
    details = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
