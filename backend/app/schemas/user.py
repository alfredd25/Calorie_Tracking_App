import re

from pydantic import BaseModel, EmailStr, field_validator


def _validate_password_strength(value: str) -> str:
    """Shared password-strength validator used by registration and reset."""
    errors: list[str] = []

    if len(value) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[A-Z]", value):
        errors.append("at least one uppercase letter")
    if not re.search(r"[a-z]", value):
        errors.append("at least one lowercase letter")
    if not re.search(r"\d", value):
        errors.append("at least one digit")
    if not re.search(r"[^A-Za-z0-9]", value):
        errors.append("at least one special character")

    if errors:
        raise ValueError("Password must contain: " + ", ".join(errors) + ".")

    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return _validate_password_strength(value)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        return _validate_password_strength(value)
