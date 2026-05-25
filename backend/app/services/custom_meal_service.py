from datetime import date
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.custom_food import CustomFood
from app.models.custom_meal import CustomMeal
from app.models.food import Food
from app.models.meal_item import MealItem
from app.repositories.meal_repository import create_meal
from app.tasks.meal_tasks import recalculate_daily_summary


def _resolve_items(db: Session, user_id: int, meal: CustomMeal):
    """Return a list of (display_name, calories, protein, carbs, fat, db_food_id_or_none)
    for each item in the custom meal, scaled by quantity.

    For 'database' foods, quantity is grams (USDA per-100g standard).
    For 'custom' foods, quantity is a serving multiplier.
    """
    custom_ids = [i.food_id for i in meal.items if i.source == "custom"]
    db_ids = [i.food_id for i in meal.items if i.source == "database"]

    custom_map: dict[int, CustomFood] = {}
    if custom_ids:
        rows = (
            db.query(CustomFood)
            .filter(CustomFood.id.in_(custom_ids), CustomFood.user_id == user_id)
            .all()
        )
        custom_map = {f.id: f for f in rows}

    db_map: dict[int, Food] = {}
    if db_ids:
        rows = db.query(Food).filter(Food.id.in_(db_ids)).all()
        db_map = {f.id: f for f in rows}

    resolved = []
    for item in meal.items:
        if item.source == "custom":
            f = custom_map.get(item.food_id)
            if not f:
                continue
            mult = item.quantity or 1
            resolved.append(
                {
                    "name": f.name,
                    "calories": (f.calories or 0) * mult,
                    "protein": (f.protein or 0) * mult,
                    "carbs": (f.carbs or 0) * mult,
                    "fat": (f.fat or 0) * mult,
                    "db_food_id": None,
                    "quantity": item.quantity,
                }
            )
        else:  # 'database'
            f = db_map.get(item.food_id)
            if not f:
                continue
            scale = (item.quantity or 0) / 100.0
            resolved.append(
                {
                    "name": f.name,
                    "calories": (f.calories or 0) * scale,
                    "protein": (f.protein or 0) * scale,
                    "carbs": (f.carbs or 0) * scale,
                    "fat": (f.fat or 0) * scale,
                    "db_food_id": f.id,
                    "quantity": item.quantity,
                }
            )
    return resolved


def compute_totals(resolved: Iterable[dict]) -> dict:
    totals = {"total_kcal": 0.0, "total_protein": 0.0, "total_carbs": 0.0, "total_fat": 0.0}
    for r in resolved:
        totals["total_kcal"] += r["calories"]
        totals["total_protein"] += r["protein"]
        totals["total_carbs"] += r["carbs"]
        totals["total_fat"] += r["fat"]
    return totals


def serialize_custom_meal(db: Session, user_id: int, meal: CustomMeal) -> dict:
    resolved = _resolve_items(db, user_id, meal)
    totals = compute_totals(resolved)
    return {
        "id": meal.id,
        "user_id": meal.user_id,
        "name": meal.name,
        "items": [
            {"id": i.id, "source": i.source, "food_id": i.food_id, "quantity": i.quantity}
            for i in meal.items
        ],
        "created_at": meal.created_at,
        **totals,
    }


def log_custom_meal_to_diary(
    db: Session,
    user_id: int,
    meal: CustomMeal,
    target_date: date,
    meal_type: str,
) -> int:
    """Log every item in the custom meal as individual MealItems in the diary.

    Returns the number of items added.
    """
    diary_meal = create_meal(db, user_id, target_date, meal_type)
    resolved = _resolve_items(db, user_id, meal)

    count = 0
    for r in resolved:
        item = MealItem(
            meal_id=diary_meal.id,
            food_id=r["db_food_id"],
            name=None if r["db_food_id"] else r["name"],
            quantity=r["quantity"],
            calories=r["calories"],
            protein=r["protein"],
            carbs=r["carbs"],
            fat=r["fat"],
        )
        db.add(item)
        count += 1
    db.commit()

    recalculate_daily_summary.delay(user_id, str(target_date))
    return count
