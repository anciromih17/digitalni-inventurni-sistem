from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from app.db.database import engine, Base
from app.models import Reservation
from app.api.reservation_api import router as reservation_router

app = FastAPI(
    title="Reservations Service",
    description="Microservice for managing equipment reservations",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

app.include_router(reservation_router)

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"status": "OK"}