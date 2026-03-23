from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "OK"}

def test_get_all_reservations():
    response = client.get("/api/reservations/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_reservation():
    payload = {
        "item_id": 11,
        "reserved_by": "Ana",
        "start_date": "2026-03-25",
        "end_date": "2026-03-26",
        "quantity": 1,
        "status": "PENDING"
    }

    response = client.post("/api/reservations/", json=payload)

    assert response.status_code in [200, 201]
    body = response.json()
    assert body["item_id"] == 11
    assert body["reserved_by"] == "Ana"

def test_get_reservation_by_id_not_found():
    response = client.get("/api/reservations/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Reservation not found"