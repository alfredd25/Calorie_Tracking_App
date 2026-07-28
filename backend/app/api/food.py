from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.services.food_service import search_food, autocomplete_food
from app.auth.jwt_handler import get_current_user

router = APIRouter()


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
