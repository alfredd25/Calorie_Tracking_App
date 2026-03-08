from sqlalchemy import text
from sqlalchemy.orm import Session


def search_foods(db: Session, query: str):
    sql = text("""
        SELECT id, name, calories, protein, carbs, fat
        FROM foods
        WHERE search_vector @@ plainto_tsquery(:query)
        ORDER BY ts_rank(search_vector, plainto_tsquery(:query)) DESC
        LIMIT 10
    """)
    result = db.execute(sql, {"query": query})
    return result.fetchall()


def search_foods_trigram(db: Session, query: str):
    sql = text("""
        SELECT id, name, calories, protein, carbs, fat
        FROM foods
        WHERE name % :query
        ORDER BY similarity(name, :query) DESC
        LIMIT 10
    """)
    result = db.execute(sql, {"query": query})
    return result.fetchall()

def autocomplete_foods(db: Session, query: str):
    sql = text("""
        SELECT id, name
        FROM foods
        WHERE name ILIKE :query
        ORDER BY name
        LIMIT 10
    """)
    result = db.execute(sql, {"query": f"{query}%"})
    return result.fetchall()

def get_food_by_id(db: Session, food_id: int):
    from app.models.food import Food
    return db.query(Food).filter(Food.id == food_id).first()