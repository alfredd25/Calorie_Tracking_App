from sqlalchemy.orm import Session

from app.models.custom_food import CustomFood
from app.schemas.custom_food import CustomFoodCreate, CustomFoodUpdate


def list_custom_foods(db: Session, user_id: int) -> list[CustomFood]:
    return (
        db.query(CustomFood)
        .filter(CustomFood.user_id == user_id)
        .order_by(CustomFood.created_at.desc())
        .all()
    )


def get_custom_food(db: Session, user_id: int, food_id: int) -> CustomFood | None:
    return (
        db.query(CustomFood)
        .filter(CustomFood.id == food_id, CustomFood.user_id == user_id)
        .first()
    )


def create_custom_food(db: Session, user_id: int, payload: CustomFoodCreate) -> CustomFood:
    food = CustomFood(
        user_id=user_id,
        name=payload.name,
        calories=payload.calories,
        protein=payload.protein,
        carbs=payload.carbs,
        fat=payload.fat,
    )
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


def update_custom_food(
    db: Session, food: CustomFood, payload: CustomFoodUpdate
) -> CustomFood:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(food, key, value)
    db.commit()
    db.refresh(food)
    return food


def delete_custom_food(db: Session, food: CustomFood) -> None:
    db.delete(food)
    db.commit()
