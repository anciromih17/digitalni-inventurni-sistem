from sqlalchemy.orm import Session
from app.repositories import reservation_repository
from app.grpc.grpc_client import get_item_availability, reserve_item, return_item
from app.mq.mq_producer import producer

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

    saved_reservation = reservation_repository.create_reservation(db, reservation)

    try:
        producer.send_event({
            "eventType": "RESERVATION_CREATED",
            "source": "reservations-service",
            "reservationId": saved_reservation.id,
            "itemId": saved_reservation.item_id,
            "reservedBy": saved_reservation.reserved_by
        })
    except Exception as e:
        print("[ActiveMQ ERROR] Failed to send reservation event:", str(e))

    return saved_reservation

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

def return_reservation_items(db: Session, reservation_id: int, quantity: int | None = None):
    reservation = reservation_repository.get_reservation_by_id(db, reservation_id)

    if not reservation:
        raise ValueError("Reservation not found")

    if reservation.status == "RETURNED":
        raise ValueError("Reservation is already fully returned")

    remaining_quantity = reservation.quantity - reservation.returned_quantity
    return_quantity = quantity if quantity is not None else remaining_quantity

    if return_quantity <= 0:
        raise ValueError("Return quantity must be greater than 0")

    if return_quantity > remaining_quantity:
        raise ValueError("Return quantity exceeds remaining reserved quantity")

    return_response = return_item(reservation.item_id, return_quantity)

    print(f"[gRPC] Return response: success={return_response.success}, message={return_response.message}")

    if not return_response.success:
        raise ValueError(return_response.message)

    updated_reservation = reservation_repository.return_reservation_items(
        db, reservation_id, return_quantity
    )

    try:
        producer.send_event({
            "eventType": "RESERVATION_RETURNED",
            "source": "reservations-service",
            "reservationId": updated_reservation.id,
            "itemId": updated_reservation.item_id,
            "returnedQuantity": return_quantity,
            "totalReturnedQuantity": updated_reservation.returned_quantity,
            "status": updated_reservation.status,
        })
    except Exception as e:
        print("[ActiveMQ ERROR] Failed to send return event:", str(e))

    return {
        "reservation_id": updated_reservation.id,
        "item_id": updated_reservation.item_id,
        "returned_quantity": return_quantity,
        "total_returned_quantity": updated_reservation.returned_quantity,
        "remaining_quantity": updated_reservation.quantity - updated_reservation.returned_quantity,
        "status": updated_reservation.status,
        "message": "Equipment returned successfully",
    }
