from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import SessionLocal
from app.services.food_service import search_food, autocomplete_food
from app.auth.jwt_handler import get_current_user

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/foods/search")
@limiter.limit("30/minute")
def search_food_endpoint(
    request: Request,
    q: str,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return search_food(db, q)


@router.get("/foods/autocomplete")
@limiter.limit("60/minute")
def autocomplete_endpoint(
    request: Request,
    q: str,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    return autocomplete_food(db, q)