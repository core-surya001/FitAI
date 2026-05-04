from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./virtual_tryon.db")

# connect_args is needed only for SQLite to allow multi-threaded access
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

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
