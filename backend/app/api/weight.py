from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.core.database import SessionLocal
from app.auth.jwt_handler import get_current_user
from app.models.weight_log import WeightLog
from app.schemas.weight import WeightLogCreate, WeightLogResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/log")
def log_weight(
    weight_data: WeightLogCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    existing_log = db.query(WeightLog).filter(
        WeightLog.user_id == current_user,
        WeightLog.date == weight_data.date
    ).first()
    
    if existing_log:
        existing_log.weight_kg = weight_data.weight_kg
        db.commit()
        db.refresh(existing_log)
        return existing_log
        
    new_log = WeightLog(
        user_id=current_user,
        date=weight_data.date,
        weight_kg=weight_data.weight_kg
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/history", response_model=list[WeightLogResponse])
def get_weight_history(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    seven_days_ago = date.today() - timedelta(days=7)
    logs = db.query(WeightLog).filter(
        WeightLog.user_id == current_user,
        WeightLog.date >= seven_days_ago
    ).order_by(WeightLog.date.asc()).all()
    
    return logs
