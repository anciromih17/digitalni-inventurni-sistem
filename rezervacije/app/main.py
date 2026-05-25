from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from sqlalchemy import text
from app.db.database import engine, Base
from app.models import Reservation, AuditLog
from app.api.reservation_api import router as reservation_router

app = FastAPI(
    title="Reservations Service",
    description="Microservice for managing equipment reservations",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

with engine.connect() as connection:
    connection.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                service_name VARCHAR NOT NULL DEFAULT 'reservations-service',
                entity_type VARCHAR NOT NULL,
                entity_id INTEGER NULL,
                action VARCHAR NOT NULL,
                actor VARCHAR NOT NULL DEFAULT 'system',
                details JSON NOT NULL DEFAULT '{}'::json,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
    )
    connection.execute(
        text(
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS returned_quantity INTEGER NOT NULL DEFAULT 0"
        )
    )
    connection.commit()

app.include_router(reservation_router)

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "OK"}
