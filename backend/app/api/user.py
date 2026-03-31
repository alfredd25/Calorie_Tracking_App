from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.auth.jwt_handler import get_current_user
from app.models.user import User
from app.schemas.profile import UserProfileUpdate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/me")
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "age": user.age,
        "gender": user.gender,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "goal": user.goal,
        "target_weight_kg": user.target_weight_kg,
        "activity_level": user.activity_level,
        "tdee": user.tdee,
        "daily_calorie_target": user.daily_calorie_target,
        "target_protein": user.target_protein,
        "target_carbs": user.target_carbs,
        "target_fat": user.target_fat,
        "onboarding_complete": user.onboarding_complete
    }

@router.put("/profile")
def update_user_profile(
    profile: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    for key, value in profile.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated successfully"}
