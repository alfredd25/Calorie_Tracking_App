import json
from app.core.redis_client import redis_client
from app.repositories.food_repository import (
    search_foods,
    search_foods_trigram,
    autocomplete_foods,
)

CACHE_TTL = 1800


def search_food(db, query: str):
    cache_key = f"food_search:{query}"

    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    results = search_foods(db, query)

    if not results:
        results = search_foods_trigram(db, query)

    foods = [
        {
            "id": r.id,
            "name": r.name,
            "calories": r.calories,
            "protein": r.protein,
            "carbs": r.carbs,
            "fat": r.fat,
        }
        for r in results
    ]

    redis_client.setex(cache_key, CACHE_TTL, json.dumps(foods))
    return foods

def autocomplete_food(db, query: str):
    cache_key = f"food_autocomplete_v2:{query}"

    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    rows = autocomplete_foods(db, query)
    results = [
        {
            "id": r.id, 
            "name": r.name,
            "calories": r.calories,
            "protein": r.protein,
            "carbs": r.carbs,
            "fat": r.fat
        } for r in rows
    ]

    redis_client.setex(cache_key, CACHE_TTL, json.dumps(results))

    return results
