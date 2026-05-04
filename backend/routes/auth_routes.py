from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from dotenv import load_dotenv
import os

import models, schemas, auth

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

SIGNUP_FREE_CREDITS = int(os.getenv("SIGNUP_FREE_CREDITS", 50))


@router.post("/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_data: schemas.UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user.
    - Checks if email is already in use.
    - Hashes the password securely.
    - Awards 50 free credits on signup.
    - Logs the signup credit in the transactions table.
    """
    # Check if email already exists
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Create the new user
    new_user = models.User(
        full_name     = user_data.full_name,
        email         = user_data.email,
        password_hash = auth.hash_password(user_data.password),
        credits       = SIGNUP_FREE_CREDITS,
        subscription  = "free"
    )
    db.add(new_user)
    db.flush()  # Get the user's ID before committing

    # Log the signup bonus as a credit transaction
    bonus_txn = models.CreditTransaction(
        user_id = new_user.id,
        amount  = SIGNUP_FREE_CREDITS,
        reason  = "signup_bonus"
    )
    db.add(bonus_txn)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT access token.
    - Verifies email and password.
    - Returns a Bearer token valid for 7 days.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns the currently authenticated user's profile.
    Requires a valid Bearer token in the Authorization header.
    """
    return current_user
