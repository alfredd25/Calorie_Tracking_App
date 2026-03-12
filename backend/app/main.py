from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, food, meal

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(food.router)
app.include_router(meal.router)