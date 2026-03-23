from app.db.database import SessionLocal
from app.models.reservation import Reservation
from app.repositories import reservation_repository
from app.schemas.reservation_schema import ReservationCreate, ReservationUpdate

def test_create_reservation_repository():
    db = SessionLocal()

    reservation_data = ReservationCreate(
        item_id=99,
        reserved_by="Repository Test",
        start_date="2026-03-30",
        end_date="2026-03-31",
        quantity=1,
        status="PENDING"
    )

    reservation = reservation_repository.create_reservation(db, reservation_data)

    assert reservation.id is not None
    assert reservation.item_id == 99
    assert reservation.reserved_by == "Repository Test"

    db.delete(reservation)
    db.commit()
    db.close()

def test_get_all_reservations_repository():
    db = SessionLocal()
    reservations = reservation_repository.get_all_reservations(db)
    assert isinstance(reservations, list)
    db.close()

def test_get_reservation_by_id_repository():
    db = SessionLocal()

    reservation = Reservation(
        item_id=77,
        reserved_by="Find Me",
        start_date="2026-04-01",
        end_date="2026-04-02",
        quantity=1,
        status="PENDING"
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    found = reservation_repository.get_reservation_by_id(db, reservation.id)

    assert found is not None
    assert found.id == reservation.id

    db.delete(reservation)
    db.commit()
    db.close()

def test_update_reservation_repository():
    db = SessionLocal()

    reservation = Reservation(
        item_id=55,
        reserved_by="Update Me",
        start_date="2026-04-05",
        end_date="2026-04-06",
        quantity=1,
        status="PENDING"
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    update_data = ReservationUpdate(status="CONFIRMED")
    updated = reservation_repository.update_reservation(db, reservation.id, update_data)

    assert updated is not None
    assert updated.status == "CONFIRMED"

    db.delete(updated)
    db.commit()
    db.close()

def test_delete_reservation_repository():
    db = SessionLocal()

    reservation = Reservation(
        item_id=44,
        reserved_by="Delete Me",
        start_date="2026-04-10",
        end_date="2026-04-11",
        quantity=1,
        status="PENDING"
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    deleted = reservation_repository.delete_reservation(db, reservation.id)

    assert deleted is True

    not_found = reservation_repository.get_reservation_by_id(db, reservation.id)
    assert not_found is None

    db.close()

def test_search_reservations_repository():
    db = SessionLocal()

    reservation = Reservation(
        item_id=33,
        reserved_by="Search User",
        start_date="2026-04-15",
        end_date="2026-04-16",
        quantity=1,
        status="PENDING"
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    results = reservation_repository.search_reservations(
        db,
        status="PENDING",
        reserved_by="Search User"
    )

    assert isinstance(results, list)
    assert len(results) > 0

    db.delete(reservation)
    db.commit()
    db.close()