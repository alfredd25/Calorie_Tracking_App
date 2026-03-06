from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserLogin
from app.repositories.user_repository import create_user, get_user_by_email
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.core.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    hashed = hash_password(user.password)
    new_user = create_user(db, user.email, hashed)
    return {"user_id": new_user.id}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)

    if not db_user:
        return {"error": "invalid credentials"}

    if not verify_password(user.password, db_user.password):
        return {"error": "invalid credentials"}

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token}