from fastapi import FastAPI
from app.api import auth
from app.api.food import router as food_router
from app.api.meal import router as meal_router

app = FastAPI()

app.include_router(auth.router, prefix="/auth")
app.include_router(food_router)
app.include_router(meal_router)