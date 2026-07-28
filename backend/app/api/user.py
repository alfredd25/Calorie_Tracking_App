from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.jwt_handler import get_current_user
from app.repositories.user_repository import get_user_by_id, update_user_profile
from app.schemas.profile import UserProfileUpdate

router = APIRouter()


@router.get("/me")
def get_user_profile(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    user = get_user_by_id(db, current_user)
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
        "onboarding_complete": user.onboarding_complete,
    }


@router.put("/profile")
def update_profile(
    profile: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user),
):
    user = update_user_profile(db, current_user, profile)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Profile updated successfully"}
