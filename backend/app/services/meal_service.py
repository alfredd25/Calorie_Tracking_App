from app.repositories.meal_repository import create_meal, add_meal_item
from app.repositories.food_repository import get_food_by_id
from app.core.redis_client import redis_client
from app.tasks.meal_tasks import recalculate_daily_summary
import json

CACHE_TTL = 600  # 10 minutes


def add_food_to_meal(
    db, user_id: int, date, meal_type: str, food_id: int, quantity: float
):
    meal = create_meal(db, user_id, date, meal_type)

    food = get_food_by_id(db, food_id)
    if not food:
        raise ValueError("Food not found")

    meal_item = add_meal_item(db, meal.id, food, quantity)

    # Trigger background recalculation
    recalculate_daily_summary.delay(user_id, str(date))

    return meal_item


def get_daily_summary(db, user_id: int, date: str):
    cache_key = f"daily_summary:{user_id}:{date}"

    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    from app.models.daily_summary import DailySummary

    summary = db.query(DailySummary).filter_by(user_id=user_id, date=date).first()

    if not summary:
        return None

    result = {
        "user_id": summary.user_id,
        "date": str(summary.date),
        "calories": summary.calories,
        "protein": summary.protein,
        "carbs": summary.carbs,
        "fat": summary.fat,
    }

    redis_client.setex(cache_key, CACHE_TTL, json.dumps(result))

    return result
