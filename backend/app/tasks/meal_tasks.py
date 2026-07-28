import logging

from celery.exceptions import MaxRetriesExceededError

from app.core.celery_worker import celery_app
from app.core.database import SessionLocal
from app.repositories.meal_repository import update_daily_summary
from app.core.redis_client import redis_client

import app.models.user
import app.models.food
import app.models.meal
import app.models.meal_item
import app.models.daily_summary

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    max_retries=3,
    default_retry_delay=30,  # seconds before first retry
    retry_backoff=True,      # exponential back-off: 30s, 60s, 120s
)
def recalculate_daily_summary(self, user_id: int, date: str) -> None:
    """Recalculate and cache the daily nutrition summary for a user.

    Retries up to 3 times with exponential back-off on any exception so that
    transient database or Redis failures do not silently drop the update.
    """
    db = SessionLocal()
    try:
        update_daily_summary(db, user_id, date)
        cache_key = f"daily_summary:{user_id}:{date}"
        redis_client.delete(cache_key)
        logger.debug("Daily summary recalculated: user=%s date=%s", user_id, date)
    except MaxRetriesExceededError:
        logger.error(
            "Max retries exceeded for recalculate_daily_summary: user=%s date=%s",
            user_id,
            date,
        )
        raise
    except Exception as exc:
        logger.warning(
            "recalculate_daily_summary failed (attempt %s/3): user=%s date=%s error=%s",
            self.request.retries + 1,
            user_id,
            date,
            exc,
        )
        raise
    finally:
        db.close()
