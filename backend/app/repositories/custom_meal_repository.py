from sqlalchemy.orm import Session

from app.models.custom_meal import CustomMeal, CustomMealItem
from app.schemas.custom_meal import CustomMealCreate, CustomMealUpdate


def list_custom_meals(db: Session, user_id: int) -> list[CustomMeal]:
    return (
        db.query(CustomMeal)
        .filter(CustomMeal.user_id == user_id)
        .order_by(CustomMeal.created_at.desc())
        .all()
    )


def get_custom_meal(db: Session, user_id: int, meal_id: int) -> CustomMeal | None:
    return (
        db.query(CustomMeal)
        .filter(CustomMeal.id == meal_id, CustomMeal.user_id == user_id)
        .first()
    )


def create_custom_meal(db: Session, user_id: int, payload: CustomMealCreate) -> CustomMeal:
    meal = CustomMeal(user_id=user_id, name=payload.name)
    for item in payload.items:
        meal.items.append(
            CustomMealItem(
                source=item.source.value,
                food_id=item.food_id,
                quantity=item.quantity,
            )
        )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


def update_custom_meal(
    db: Session, meal: CustomMeal, payload: CustomMealUpdate
) -> CustomMeal:
    if payload.name is not None:
        meal.name = payload.name
    if payload.items is not None:
        # Replace items wholesale
        meal.items.clear()
        db.flush()
        for item in payload.items:
            meal.items.append(
                CustomMealItem(
                    source=item.source.value,
                    food_id=item.food_id,
                    quantity=item.quantity,
                )
            )
    db.commit()
    db.refresh(meal)
    return meal


def delete_custom_meal(db: Session, meal: CustomMeal) -> None:
    db.delete(meal)
    db.commit()
