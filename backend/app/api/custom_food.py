from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.jwt_handler import get_current_user
from app.core.database import SessionLocal
from app.repositories import custom_food_repository as repo
from app.schemas.custom_food import (
    CustomFoodCreate,
    CustomFoodResponse,
    CustomFoodUpdate,
)
from app.schemas.custom_meal import LogCustomFoodRequest
from app.services.custom_food_service import log_custom_food_to_meal

router = APIRouter(prefix="/custom-foods", tags=["custom-foods"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", response_model=list[CustomFoodResponse])
def list_custom_foods(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return repo.list_custom_foods(db, current_user)


@router.post("", response_model=CustomFoodResponse, status_code=201)
def create_custom_food(
    payload: CustomFoodCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return repo.create_custom_food(db, current_user, payload)


@router.put("/{food_id}", response_model=CustomFoodResponse)
def update_custom_food(
    food_id: int,
    payload: CustomFoodUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    food = repo.get_custom_food(db, current_user, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Custom food not found")
    return repo.update_custom_food(db, food, payload)


@router.delete("/{food_id}", status_code=204)
def delete_custom_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    food = repo.get_custom_food(db, current_user, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Custom food not found")
    repo.delete_custom_food(db, food)
    return None


@router.post("/log", status_code=201)
def log_custom_food(
    payload: LogCustomFoodRequest,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    food = repo.get_custom_food(db, current_user, payload.custom_food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Custom food not found")
    item = log_custom_food_to_meal(
        db, current_user, food, payload.date, payload.meal_type, payload.quantity
    )
    return {"meal_item_id": item.id}
