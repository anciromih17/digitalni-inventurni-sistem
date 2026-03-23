from sqlalchemy.orm import Session
from app.repositories import reservation_repository
from app.grpc.grpc_client import get_item_availability, reserve_item

def create_reservation(db: Session, reservation):
    print(f"[CREATE RESERVATION] Request for item_id={reservation.item_id}, quantity={reservation.quantity}")

    availability = get_item_availability(reservation.item_id)

    print(f"[gRPC] Availability response: item_id={availability.item_id}, available_quantity={availability.available_quantity}, status={availability.status}")

    if availability.status == "NOT_FOUND":
        raise ValueError("Item not found in inventory service")

    if availability.available_quantity < reservation.quantity:
        raise ValueError("Not enough available quantity in inventory service")

    reserve_response = reserve_item(reservation.item_id, reservation.quantity)

    print(f"[gRPC] Reserve response: success={reserve_response.success}, message={reserve_response.message}")

    if not reserve_response.success:
        raise ValueError(reserve_response.message)

    return reservation_repository.create_reservation(db, reservation)

def get_all_reservations(db: Session):
    return reservation_repository.get_all_reservations(db)

def get_reservation_by_id(db: Session, reservation_id: int):
    return reservation_repository.get_reservation_by_id(db, reservation_id)

def update_reservation(db: Session, reservation_id: int, reservation):
    return reservation_repository.update_reservation(db, reservation_id, reservation)

def delete_reservation(db: Session, reservation_id: int):
    return reservation_repository.delete_reservation(db, reservation_id)

def search_reservations(db: Session, status=None, reserved_by=None):
    return reservation_repository.search_reservations(db, status, reserved_by)