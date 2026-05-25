# ──────────────────────────────────────────────────────────────────────────────
# Email configuration requirements
# ──────────────────────────────────────────────────────────────────────────────
# The forgot-password flow requires the following environment variable:
#
#   RESEND_API_KEY      — your Resend API key (https://resend.com/api-keys)
#   RESEND_FROM_EMAIL   — sender address on your verified domain
#                         (defaults to noreply@nutritracks.tech)
#
# ⚠  The /forgot-password endpoint returns HTTP 500 until RESEND_API_KEY is set.
# ──────────────────────────────────────────────────────────────────────────────

import hashlib
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
)
from app.repositories.user_repository import (
    create_user,
    get_user_by_email,
    get_user_by_reset_token,
)
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.core.database import SessionLocal
from app.tasks.email_tasks import send_reset_email

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()
RESET_TOKEN_MINUTES = 15
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _expiry_is_valid(expiry: datetime) -> bool:
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry >= datetime.now(timezone.utc)


@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    hashed = hash_password(user.password)
    new_user = create_user(db, user.email, hashed)
    return {"user_id": new_user.id}


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)

    if not db_user:
        raise HTTPException(status_code=401, detail="invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token, "user_id": db_user.id}


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    if not os.getenv("RESEND_API_KEY"):
        raise HTTPException(status_code=500, detail="Email service is not configured")

    db_user = get_user_by_email(db, payload.email)
    if db_user:
        token = secrets.token_urlsafe(32)
        db_user.reset_token = _hash_reset_token(token)
        db_user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(
            minutes=RESET_TOKEN_MINUTES
        )
        db.commit()

        # CLIENT_URL defaults to http://localhost:3000 (Next.js dev server).
        # Override with the CLIENT_URL env var in production.
        client_url = os.getenv("CLIENT_URL", "http://localhost:3000").rstrip("/")
        reset_link = f"{client_url}/reset-password/{token}"

        # Dispatch to Celery so the request thread is never blocked by the API call.
        send_reset_email.delay(db_user.email, reset_link)

    return {"message": "If that email exists, a reset link has been sent."}


@router.get("/verify-reset-token")
@limiter.limit("10/minute")
def verify_reset_token(
    request: Request, token: str, db: Session = Depends(get_db)
):
    """Check whether a password-reset token is valid and unexpired.

    Does NOT consume or delete the token — it is only read.
    Used by the frontend on page mount to redirect early if the link is stale.
    """
    db_user = get_user_by_reset_token(db, _hash_reset_token(token))
    if (
        not db_user
        or not db_user.reset_token_expiry
        or not _expiry_is_valid(db_user.reset_token_expiry)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    return {"valid": True}


@router.post("/reset-password/{token}")
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    token: str,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    db_user = get_user_by_reset_token(db, _hash_reset_token(token))
    if (
        not db_user
        or not db_user.reset_token_expiry
        or not _expiry_is_valid(db_user.reset_token_expiry)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    db_user.password = hash_password(payload.password)
    db_user.reset_token = None
    db_user.reset_token_expiry = None
    db.commit()

    return {"message": "Password reset successful"}
