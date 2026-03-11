from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import User


def create_user(db: Session, email: str, password: str):
    user = User(email=email, password=password)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
