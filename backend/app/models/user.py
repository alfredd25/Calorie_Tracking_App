from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

    # Onboarding / Profile Fields
    full_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    goal = Column(String, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    activity_level = Column(String, nullable=True)
    
    # Nutritional Targets
    tdee = Column(Float, nullable=True)
    daily_calorie_target = Column(Float, nullable=True)
    target_protein = Column(Float, nullable=True)
    target_carbs = Column(Float, nullable=True)
    target_fat = Column(Float, nullable=True)
    
    onboarding_complete = Column(Boolean, default=False)
