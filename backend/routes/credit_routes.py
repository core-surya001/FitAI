from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/credits", tags=["Credits & Subscriptions"])


# ── Subscription plan definitions ─────────────────────────────────────────────
PLANS = [
    {
        "plan": "free",
        "price": "₹0",
        "credits": "50 (one-time on signup)",
        "features": [
            "50 free credits on signup",
            "2 credits per try-on",
            "Basic image quality",
            "Save up to 10 results"
        ]
    },
    {
        "plan": "pro",
        "price": "₹499/month",
        "credits": "500 credits/month",
        "features": [
            "500 credits every month",
            "2 credits per try-on (250 tries/month)",
            "HD image quality",
            "Unlimited lookbook saves",
            "Priority processing queue",
            "Email support"
        ]
    },
    {
        "plan": "unlimited",
        "price": "₹1499/month",
        "credits": "Unlimited",
        "features": [
            "Unlimited try-on generations",
            "Ultra HD image quality",
            "Fastest processing priority",
            "Unlimited lookbook saves",
            "Dedicated support",
            "Early access to new features"
        ]
    }
]


@router.get("/plans", response_model=List[schemas.SubscriptionPlanInfo])
def get_plans():
    """
    Returns all available subscription plans and their pricing.
    This is a public endpoint (no auth required).
    """
    return PLANS


@router.get("/balance")
def get_credit_balance(current_user: models.User = Depends(auth.get_current_user)):
    """Returns the current user's credit balance and subscription plan."""
    return {
        "credits": current_user.credits,
        "subscription": current_user.subscription,
        "credits_per_generation": 2
    }


@router.get("/history", response_model=List[schemas.CreditTransactionOut])
def get_credit_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns a complete audit log of all credit changes for the user.
    Useful for the 'billing history' page.
    """
    return (
        db.query(models.CreditTransaction)
        .filter(models.CreditTransaction.user_id == current_user.id)
        .order_by(models.CreditTransaction.created_at.desc())
        .all()
    )


@router.post("/subscribe/{plan_name}")
def subscribe_to_plan(
    plan_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    MOCK subscription endpoint.

    In production, this should:
    1. Create a Razorpay/Stripe checkout session.
    2. Return a payment URL to redirect the user.
    3. Use a webhook to confirm payment before granting credits.

    For now, it simulates a successful subscription.
    """
    plan_credits = {"pro": 500, "unlimited": 999999}

    if plan_name not in plan_credits:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid plan: '{plan_name}'. Choose 'pro' or 'unlimited'.")

    credits_to_add = plan_credits[plan_name]

    # Update user subscription and credits
    current_user.subscription = plan_name
    if plan_name != "unlimited":
        current_user.credits += credits_to_add
    else:
        current_user.credits = 999999  # Effectively unlimited

    # Log the transaction
    txn = models.CreditTransaction(
        user_id = current_user.id,
        amount  = credits_to_add,
        reason  = f"subscription_{plan_name}"
    )
    db.add(txn)
    db.commit()
    db.refresh(current_user)

    return {
        "message": f"Successfully subscribed to {plan_name} plan!",
        "new_credits": current_user.credits,
        "subscription": current_user.subscription
    }
