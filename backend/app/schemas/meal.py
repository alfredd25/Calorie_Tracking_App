from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date
from enum import Enum


class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class MealCreate(BaseModel):
    user_id: int
    date: date
    meal_type: MealType


class AddFoodRequest(BaseModel):
    meal_id: int
    food_id: int
    quantity: float

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return v


class FoodBrief(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class MealItemResponse(BaseModel):
    id: int
    food_id: int
    food: FoodBrief | None = None
    quantity: float
    calories: float
    protein: float
    carbs: float
    fat: float
    model_config = ConfigDict(from_attributes=True)


class MealListResponse(BaseModel):
    id: int
    meal_type: str
    items: list[MealItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

