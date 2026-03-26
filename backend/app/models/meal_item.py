from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True)
    meal_id = Column(Integer, ForeignKey("meals.id"))
    food_id = Column(Integer, ForeignKey("foods.id"))
    quantity = Column(Float)
    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)

    meal = relationship("Meal", back_populates="items")
    food = relationship("Food")
