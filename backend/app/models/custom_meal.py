from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class CustomMeal(Base):
    __tablename__ = "custom_meals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items = relationship(
        "CustomMealItem",
        back_populates="meal",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class CustomMealItem(Base):
    __tablename__ = "custom_meal_items"

    id = Column(Integer, primary_key=True)
    custom_meal_id = Column(
        Integer, ForeignKey("custom_meals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 'custom' or 'database'
    source = Column(String, nullable=False)
    food_id = Column(Integer, nullable=False)  # references custom_foods.id or foods.id depending on source
    quantity = Column(Float, nullable=False, default=1)

    meal = relationship("CustomMeal", back_populates="items")
