from sqlalchemy.orm import Session
from app.models.reservation import Reservation
from datetime import datetime

def create_reservation(db: Session, reservation_data):
    reservation = Reservation(**reservation_data.dict())
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation

def get_all_reservations(db: Session):
    return db.query(Reservation).all()

def get_reservation_by_id(db: Session, reservation_id: int):
    return db.query(Reservation).filter(Reservation.id == reservation_id).first()

def update_reservation(db: Session, reservation_id: int, update_data):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    
    if not reservation:
        return None

    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(reservation, key, value)

    reservation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(reservation)
    return reservation

def delete_reservation(db: Session, reservation_id: int):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()

    if not reservation:
        return False

    db.delete(reservation)
    db.commit()
    return True

def search_reservations(db: Session, status: str = None, reserved_by: str = None):
    query = db.query(Reservation)

    if status:
        query = query.filter(Reservation.status == status)

    if reserved_by:
        query = query.filter(Reservation.reserved_by == reserved_by)

    return query.all()