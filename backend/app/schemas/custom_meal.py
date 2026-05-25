from datetime import date, datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FoodSource(str, Enum):
    custom = "custom"
    database = "database"


class CustomMealItemInput(BaseModel):
    source: FoodSource
    food_id: int
    quantity: float = Field(..., gt=0)


class CustomMealItemResponse(BaseModel):
    id: int
    source: str
    food_id: int
    quantity: float

    model_config = ConfigDict(from_attributes=True)


class CustomMealCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    items: list[CustomMealItemInput] = Field(default_factory=list)


class CustomMealUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    items: list[CustomMealItemInput] | None = None


class CustomMealResponse(BaseModel):
    id: int
    user_id: int
    name: str
    items: list[CustomMealItemResponse] = []
    total_kcal: float = 0
    total_protein: float = 0
    total_carbs: float = 0
    total_fat: float = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LogCustomMealRequest(BaseModel):
    date: date
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]


class LogCustomFoodRequest(BaseModel):
    custom_food_id: int
    date: date
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    quantity: float = Field(1, gt=0)

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return v
