from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from enum import Enum

from app.core.database import SessionLocal
from app.services.meal_service import add_food_to_meal, get_daily_summary
from app.repositories.meal_repository import create_meal
from app.repositories.meal_repository import remove_meal_item, get_weekly_summary, get_streak
from app.auth.jwt_handler import get_current_user
from pydantic import BaseModel, field_validator
from app.models.meal import Meal
from app.schemas.meal import MealListResponse

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class CreateMealRequest(BaseModel):
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


@router.post("/meals/create")
def create_meal_endpoint(
    request: CreateMealRequest,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meal = create_meal(db, current_user, request.date, request.meal_type)
    return {"meal_id": meal.id}


@router.post("/meals/add-food")
def add_food_endpoint(
    request: AddFoodRequest,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meal = db.query(Meal).filter(Meal.id == request.meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    if meal.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not your meal")
    try:
        meal_item = add_food_to_meal(
            db,
            meal.user_id,
            meal.date,
            meal.meal_type,
            request.food_id,
            request.quantity,
        )
        return meal_item
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/meals/day-summary")
def day_summary(
    date: date,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    summary = get_daily_summary(db, current_user, str(date))
    if not summary:
        raise HTTPException(status_code=404, detail="No data for this date")
    return summary


@router.get("/meals/list", response_model=list[MealListResponse])
def list_meals(
    date: date,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meals = db.query(Meal).filter_by(user_id=current_user, date=date).all()
    return [MealListResponse.model_validate(m) for m in meals]


@router.delete("/meals/remove-food/{meal_item_id}")
def remove_food_endpoint(
    meal_item_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    result = remove_meal_item(db, meal_item_id, current_user)
    if not result:
        raise HTTPException(status_code=404, detail="Meal item not found")
    return {"success": True}


@router.get("/meals/weekly-summary")
def weekly_summary(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    rows = get_weekly_summary(db, current_user)
    return [
        {
            "date": str(row.date),
            "calories": row.calories,
            "protein": row.protein,
            "carbs": row.carbs,
            "fat": row.fat,
        }
        for row in rows
    ]


@router.get("/meals/streak")
def streak(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    count = get_streak(db, current_user)
    return {"streak": count}