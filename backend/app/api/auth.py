from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.user import UserCreate, UserLogin
from app.repositories.user_repository import create_user, get_user_by_email
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.core.database import SessionLocal

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    hashed = hash_password(user.password)
    new_user = create_user(db, user.email, hashed)
    return {"user_id": new_user.id}


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(status_code=401, detail="invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token, "user_id": db_user.id}