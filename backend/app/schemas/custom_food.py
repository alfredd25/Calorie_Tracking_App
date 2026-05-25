from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class CustomFoodBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    calories: float = Field(..., ge=0)
    protein: float = Field(..., ge=0)
    carbs: float = Field(..., ge=0)
    fat: float = Field(..., ge=0)


class CustomFoodCreate(CustomFoodBase):
    pass


class CustomFoodUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    calories: float | None = Field(None, ge=0)
    protein: float | None = Field(None, ge=0)
    carbs: float | None = Field(None, ge=0)
    fat: float | None = Field(None, ge=0)


class CustomFoodResponse(CustomFoodBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
