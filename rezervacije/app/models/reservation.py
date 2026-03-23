from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.database import Base

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False)
    reserved_by = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)