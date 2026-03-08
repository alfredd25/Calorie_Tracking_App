from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import SessionLocal
from app.services.meal_service import add_food_to_meal, get_daily_summary
from app.repositories.meal_repository import create_meal
from pydantic import BaseModel

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CreateMealRequest(BaseModel):
    user_id: int
    date: date
    meal_type: str


class AddFoodRequest(BaseModel):
    user_id: int
    meal_type: str
    date: date
    food_id: int
    quantity: float


@router.post("/meals/create")
def create_meal_endpoint(request: CreateMealRequest, db: Session = Depends(get_db)):
    meal = create_meal(db, request.user_id, request.date, request.meal_type)
    return meal


@router.post("/meals/add-food")
def add_food_endpoint(request: AddFoodRequest, db: Session = Depends(get_db)):
    try:
        meal_item = add_food_to_meal(
            db,
            request.user_id,
            request.date,
            request.meal_type,
            request.food_id,
            request.quantity
        )
        return meal_item
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/meals/day-summary")
def day_summary(user_id: int, date: date, db: Session = Depends(get_db)):
    summary = get_daily_summary(db, user_id, str(date))
    if not summary:
        raise HTTPException(status_code=404, detail="No data for this date")
    return summary


@router.get("/meals/list")
def list_meals(user_id: int, date: date, db: Session = Depends(get_db)):
    from app.models.meal import Meal
    meals = db.query(Meal).filter_by(user_id=user_id, date=date).all()
    return meals