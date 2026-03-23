from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.reservation_schema import ReservationCreate, ReservationUpdate, ReservationResponse
from app.services import reservation_service

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])

@router.post("/", response_model=ReservationResponse)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    try:
        print(f"[CREATE RESERVATION] Request received for item_id={reservation.item_id}, reserved_by={reservation.reserved_by}")
        created = reservation_service.create_reservation(db, reservation)
        print(f"[CREATE RESERVATION] Reservation created with ID={created.id}")
        return created
    except ValueError as e:
        print(f"[CREATE RESERVATION ERROR] {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[ReservationResponse])
def get_all_reservations(db: Session = Depends(get_db)):
    print("[GET ALL RESERVATIONS] Request received")
    reservations = reservation_service.get_all_reservations(db)
    print(f"[GET ALL RESERVATIONS] Returned {len(reservations)} reservations")
    return reservations

@router.get("/{reservation_id}", response_model=ReservationResponse)
def get_reservation(reservation_id: int, db: Session = Depends(get_db)):
    print(f"[GET RESERVATION] Request received for ID={reservation_id}")
    reservation = reservation_service.get_reservation_by_id(db, reservation_id)
    if not reservation:
        print("[GET RESERVATION ERROR] Reservation not found")
        raise HTTPException(status_code=404, detail="Reservation not found")
    print(f"[GET RESERVATION] Reservation found ID={reservation.id}")
    return reservation

@router.put("/{reservation_id}", response_model=ReservationResponse)
def update_reservation(reservation_id: int, reservation: ReservationUpdate, db: Session = Depends(get_db)):
    print(f"[UPDATE RESERVATION] Request received for ID={reservation_id}")
    updated = reservation_service.update_reservation(db, reservation_id, reservation)
    if not updated:
        print("[UPDATE RESERVATION ERROR] Reservation not found")
        raise HTTPException(status_code=404, detail="Reservation not found")
    print(f"[UPDATE RESERVATION] Reservation updated ID={updated.id}")
    return updated

@router.delete("/{reservation_id}")
def delete_reservation(reservation_id: int, db: Session = Depends(get_db)):
    print(f"[DELETE RESERVATION] Request received for ID={reservation_id}")
    deleted = reservation_service.delete_reservation(db, reservation_id)
    if not deleted:
        print("[DELETE RESERVATION ERROR] Reservation not found")
        raise HTTPException(status_code=404, detail="Reservation not found")
    print(f"[DELETE RESERVATION] Reservation deleted ID={reservation_id}")
    return {"message": "Reservation deleted"}

@router.get("/search/")
def search_reservations(status: str = None, reserved_by: str = None, db: Session = Depends(get_db)):
    print(f"[SEARCH RESERVATIONS] status={status}, reserved_by={reserved_by}")
    results = reservation_service.search_reservations(db, status, reserved_by)
    print(f"[SEARCH RESERVATIONS] Found {len(results)} results")
    return results