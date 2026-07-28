from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import User
from app.schemas.profile import UserProfileUpdate


def create_user(db: Session, email: str, password: str) -> User:
    user = User(email=email, password=password)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_reset_token(db: Session, reset_token: str) -> User | None:
    return db.query(User).filter(User.reset_token == reset_token).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_user_profile(
    db: Session, user_id: int, profile: UserProfileUpdate
) -> User | None:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    for key, value in profile.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
