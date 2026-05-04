from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────
# AUTH SCHEMAS
# ─────────────────────────────────────────────

class UserSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None


# ─────────────────────────────────────────────
# USER SCHEMAS
# ─────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    credits: int
    subscription: str
    created_at: datetime

    class Config:
        from_attributes = True  # Allows reading from SQLAlchemy ORM objects


# ─────────────────────────────────────────────
# PHOTO / GARMENT SCHEMAS
# ─────────────────────────────────────────────

class UserPhotoOut(BaseModel):
    id: int
    filename: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class GarmentOut(BaseModel):
    id: int
    name: Optional[str]
    category: Optional[str]
    filename: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# TRY-ON JOB SCHEMAS
# ─────────────────────────────────────────────

class TryOnRequest(BaseModel):
    user_photo_id: int
    garment_id: int

class TryOnJobOut(BaseModel):
    id: int
    user_id: int
    user_photo_id: int
    garment_id: int
    result_url: str
    status: str
    credits_used: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# CREDIT / SUBSCRIPTION SCHEMAS
# ─────────────────────────────────────────────

class CreditTransactionOut(BaseModel):
    id: int
    amount: int
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

class SubscriptionPlanInfo(BaseModel):
    plan: str
    price: str
    credits: str
    features: List[str]
