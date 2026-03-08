from app.core.celery_worker import celery_app
from app.core.database import SessionLocal
from app.repositories.meal_repository import update_daily_summary
from app.core.redis_client import redis_client


@celery_app.task
def recalculate_daily_summary(user_id: int, date: str):
    db = SessionLocal()
    try:
        update_daily_summary(db, user_id, date)
        cache_key = f"daily_summary:{user_id}:{date}"
        redis_client.delete(cache_key)
    finally:
        db.close()