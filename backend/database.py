from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# Support both standard naming and the typo found in user's Render dashboard
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("Daabase_url") or "sqlite:///./virtual_tryon.db"

# connect_args is needed only for SQLite to allow multi-threaded access
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Handle Render's default 'postgres://' which should be 'postgresql://' for SQLAlchemy
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)

# Each request gets its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db():
    """Dependency injection function to provide a DB session to each API route."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
