from pydantic import BaseModel
from typing import Optional

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    goal: Optional[str] = None
    target_weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    tdee: Optional[float] = None
    daily_calorie_target: Optional[float] = None
    target_protein: Optional[float] = None
    target_carbs: Optional[float] = None
    target_fat: Optional[float] = None
    onboarding_complete: Optional[bool] = None
