from sqlalchemy import Column, Integer, ForeignKey, Date, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date)
    meal_type = Column(String)

    items = relationship("MealItem", back_populates="meal", lazy="joined")
