from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_user
from app.core.database import SessionLocal
from app.repositories import custom_meal_repository as repo
from app.schemas.custom_meal import (
    CustomMealCreate,
    CustomMealResponse,
    CustomMealUpdate,
    LogCustomMealRequest,
)
from app.services.custom_meal_service import (
    log_custom_meal_to_diary,
    serialize_custom_meal,
)

router = APIRouter(prefix="/custom-meals", tags=["custom-meals"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[CustomMealResponse])
def list_custom_meals(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meals = repo.list_custom_meals(db, current_user)
    return [serialize_custom_meal(db, current_user, m) for m in meals]


@router.post("", response_model=CustomMealResponse, status_code=201)
def create_custom_meal(
    payload: CustomMealCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meal = repo.create_custom_meal(db, current_user, payload)
    return serialize_custom_meal(db, current_user, meal)


@router.put("/{meal_id}", response_model=CustomMealResponse)
def update_custom_meal(
    meal_id: int,
    payload: CustomMealUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meal = repo.get_custom_meal(db, current_user, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Custom meal not found")
    meal = repo.update_custom_meal(db, meal, payload)
    return serialize_custom_meal(db, current_user, meal)


@router.delete("/{meal_id}", status_code=204)
def delete_custom_meal(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meal = repo.get_custom_meal(db, current_user, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Custom meal not found")
    repo.delete_custom_meal(db, meal)
    return None


@router.post("/{meal_id}/log", status_code=201)
def log_custom_meal(
    meal_id: int,
    payload: LogCustomMealRequest,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    meal = repo.get_custom_meal(db, current_user, meal_id)
    if not meal:
        raise HTTPException(status_code=404, detail="Custom meal not found")
    items_added = log_custom_meal_to_diary(
        db, current_user, meal, payload.date, payload.meal_type
    )
    return {"items_added": items_added}
