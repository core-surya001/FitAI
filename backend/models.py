from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


# ─────────────────────────────────────────────
# ENUM TYPES
# ─────────────────────────────────────────────

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    UNLIMITED = "unlimited"


# ─────────────────────────────────────────────
# USER TABLE
# ─────────────────────────────────────────────

class User(Base):
    """Stores user account information and subscription/credit data."""
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String, nullable=False)
    email           = Column(String, unique=True, index=True, nullable=False)
    password_hash   = Column(String, nullable=False)
    credits         = Column(Integer, default=50)                              # 50 free credits on signup
    subscription    = Column(String, default=SubscriptionPlan.FREE)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Relationships (ORM links to child tables)
    photos          = relationship("UserPhoto",  back_populates="owner", cascade="all, delete")
    garments        = relationship("Garment",    back_populates="owner", cascade="all, delete")
    tryon_jobs      = relationship("TryOnJob",   back_populates="owner", cascade="all, delete")
    transactions    = relationship("CreditTransaction", back_populates="owner", cascade="all, delete")


# ─────────────────────────────────────────────
# USER PHOTOS TABLE (Base model photos of the user)
# ─────────────────────────────────────────────

class UserPhoto(Base):
    """Stores photos of the user (the 'model' photos for try-on)."""
    __tablename__ = "user_photos"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)         # Original filename
    file_path   = Column(String, nullable=False)         # Path on disk / S3 URL
    created_at  = Column(DateTime, default=datetime.utcnow)

    owner       = relationship("User", back_populates="photos")


# ─────────────────────────────────────────────
# GARMENTS TABLE (Clothing/dress photos)
# ─────────────────────────────────────────────

class Garment(Base):
    """Stores uploaded clothing/garment photos."""
    __tablename__ = "garments"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    name        = Column(String, nullable=True)          # Optional label e.g. "Blue Floral Dress"
    category    = Column(String, nullable=True)          # e.g. tops, bottoms, dresses
    filename    = Column(String, nullable=False)
    file_path   = Column(String, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    owner       = relationship("User", back_populates="garments")


# ─────────────────────────────────────────────
# TRY-ON JOBS TABLE
# ─────────────────────────────────────────────

class TryOnJob(Base):
    """Tracks each virtual try-on generation request and its status."""
    __tablename__ = "tryon_jobs"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_photo_id   = Column(Integer, ForeignKey("user_photos.id"), nullable=False)
    garment_id      = Column(Integer, ForeignKey("garments.id"), nullable=False)
    status          = Column(String, default=JobStatus.PENDING)
    result_url      = Column(String, nullable=True)      # URL of the AI-generated output image
    error_message   = Column(String, nullable=True)      # Stored if the job fails
    credits_used    = Column(Integer, default=2)
    created_at      = Column(DateTime, default=datetime.utcnow)
    completed_at    = Column(DateTime, nullable=True)

    owner           = relationship("User", back_populates="tryon_jobs")
    user_photo      = relationship("UserPhoto")
    garment         = relationship("Garment")


# ─────────────────────────────────────────────
# CREDIT TRANSACTIONS TABLE (Audit log)
# ─────────────────────────────────────────────

class CreditTransaction(Base):
    """Audit log for every credit change (earned or spent)."""
    __tablename__ = "credit_transactions"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount      = Column(Integer, nullable=False)        # Positive = credited, Negative = debited
    reason      = Column(String, nullable=False)         # e.g. "signup_bonus", "try_on_generation", "pro_plan_purchase"
    created_at  = Column(DateTime, default=datetime.utcnow)

    owner       = relationship("User", back_populates="transactions")
