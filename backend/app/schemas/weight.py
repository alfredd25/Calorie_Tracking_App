from pydantic import BaseModel
from datetime import date

class WeightLogCreate(BaseModel):
    date: date
    weight_kg: float

class WeightLogResponse(BaseModel):
    id: int
    user_id: int
    date: date
    weight_kg: float

    class Config:
        from_attributes = True
