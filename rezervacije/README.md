**Mikrostoritev je implementirana z uporabo:**

FastAPI
PostgreSQL
gRPC (client)
Docker
Pytest
GitHub Actions
Swagger / OpenAPI

**System Architecture**

Reservations Service je del mikroservisne arhitekture, kjer:

Web aplikacija komunicira z mikrostoritvami preko REST API
Mikrostoritve med seboj komunicirajo preko gRPC
Vsaka mikrostoritev ima svojo podatkovno bazo
Sistem je zagnan preko Docker Compose

**Communication Flow**
Web UI / Client
        ↓ REST
Reservations Service
        ↓ gRPC
Inventory Service
        ↓
Inventory Database

**Flow pri ustvarjanju rezervacije:**

- Uporabnik pošlje REST zahtevo za rezervacijo.
- Reservations Service preko gRPC pokliče Inventory Service.
- Inventory Service preveri razpoložljivost opreme.
- Če je oprema na voljo, Inventory zmanjša available_quantity.
- Reservations Service shrani rezervacijo v svojo bazo.
- REST odgovor se vrne uporabniku.

**Struktura:**
rezervacije/
│
├── app/
│   ├── api/
│   │   └── reservation_api.py
│   ├── db/
│   │   ├── database.py
│   │   └── session.py
│   ├── models/
│   │   └── reservation.py
│   ├── repositories/
│   │   └── reservation_repository.py
│   ├── schemas/
│   │   └── reservation_schema.py
│   ├── services/
│   │   └── reservation_service.py
│   ├── grpc/
│   │   ├── grpc_client.py
│   │   ├── inventory.proto
│   │   ├── inventory_pb2.py
│   │   └── inventory_pb2_grpc.py
│   └── main.py
│
├── tests/
│   ├── test_reservation_endpoints.py
│   └── test_reservation_repository.py
│
├── Dockerfile
├── requirements.txt
├── pytest.ini
└── README.md

**Database**

Mikrostoritev uporablja PostgreSQL podatkovno bazo.

**Reservation Table*

Tabela vsebuje:

id
item_id
reserved_by
start_date
end_date
quantity
status
created_at
updated_at

Vsaka mikrostoritev ima svojo bazo:

inventorydb
reservationsdb

**REST API ENDPOINT:**
Swagger: http://localhost:8001/docs

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| POST   | /api/reservations        | Create reservation    |
| GET    | /api/reservations        | Get all reservations  |
| GET    | /api/reservations/{id}   | Get reservation by ID |
| PUT    | /api/reservations/{id}   | Update reservation    |
| DELETE | /api/reservations/{id}   | Delete reservation    |
| GET    | /api/reservations/search | Search reservations   |
| GET    | /health                  | Service health check  |

**gRPC Metode:**
| Method              | Purpose                  |
| ------------------- | ------------------------ |
| GetItemAvailability | Check available quantity |
| ReserveItem         | Reserve item quantity    |


**Testing:**
Implementirano z uporabo pytest.
**Endpoint tests:*
Testirajo:

health endpoint
create reservation
get reservations
error handling
Repository tests


**Repository tests:*
Testirajo:

create reservation
get reservation
update reservation
delete reservation
search reservations