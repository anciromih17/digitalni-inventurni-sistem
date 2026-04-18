from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ReservationBase(BaseModel):
    item_id: int
    reserved_by: str
    start_date: str
    end_date: str
    quantity: int
    status: Optional[str] = "PENDING"

class ReservationCreate(ReservationBase):
    pass

class ReservationUpdate(BaseModel):
    item_id: Optional[int] = None
    reserved_by: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    quantity: Optional[int] = None
    status: Optional[str] = None

class ReservationResponse(ReservationBase):
    id: int
    returned_quantity: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReservationReturnRequest(BaseModel):
    quantity: Optional[int] = None

class ReservationReturnResponse(BaseModel):
    reservation_id: int
    item_id: int
    returned_quantity: int
    total_returned_quantity: int
    remaining_quantity: int
    status: str
    message: str
