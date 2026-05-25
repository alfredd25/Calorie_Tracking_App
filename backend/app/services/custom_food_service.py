from datetime import date

from sqlalchemy.orm import Session

from app.models.custom_food import CustomFood
from app.models.meal_item import MealItem
from app.repositories.meal_repository import create_meal
from app.tasks.meal_tasks import recalculate_daily_summary


def log_custom_food_to_meal(
    db: Session,
    user_id: int,
    custom_food: CustomFood,
    target_date: date,
    meal_type: str,
    quantity: float = 1,
) -> MealItem:
    """Add a custom food (a single serving entry) to a daily meal.

    Custom foods are stored as totals per serving, so quantity is a multiplier
    (defaults to 1 = one serving).
    """
    meal = create_meal(db, user_id, target_date, meal_type)
    item = MealItem(
        meal_id=meal.id,
        food_id=None,
        name=custom_food.name,
        quantity=quantity,
        calories=(custom_food.calories or 0) * quantity,
        protein=(custom_food.protein or 0) * quantity,
        carbs=(custom_food.carbs or 0) * quantity,
        fat=(custom_food.fat or 0) * quantity,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    recalculate_daily_summary.delay(user_id, str(target_date))
    return item
