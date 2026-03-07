from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.dialects.postgresql import TSVECTOR
from app.core.database import Base

class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)

    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fat = Column(Float)

    search_vector = Column(TSVECTOR)