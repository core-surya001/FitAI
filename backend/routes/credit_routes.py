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


@router.post("/create-order/{plan_name}")
def create_order(
    plan_name: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    import os
    from fastapi import HTTPException

    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID") or os.getenv("RAZORPAY_KEY")
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET") or os.getenv("RAZORPAY_SECRET")

    # Guard: fail fast if keys are not configured — avoids confusing Razorpay auth errors
    if not razorpay_key_id or not razorpay_key_secret:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables."
        )

    try:
        import razorpay
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Payment module 'razorpay' is not installed on the server. Run: pip install razorpay"
        )

    plan_prices_inr = {"pro": 499, "unlimited": 1499}

    if plan_name not in plan_prices_inr:
        raise HTTPException(status_code=400, detail=f"Invalid plan: '{plan_name}'. Choose 'pro' or 'unlimited'.")

    amount = plan_prices_inr[plan_name] * 100  # Amount in paise (1 INR = 100 paise)

    # Initialize razorpay client only after key validation
    client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

    try:
        order_data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_{current_user.id}_{plan_name}",
            "notes": {
                "plan_name": plan_name,
                "user_id": current_user.id
            }
        }
        order = client.order.create(data=order_data)

        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": razorpay_key_id,
            "plan_name": plan_name
        }
    except Exception as e:
        print(f"Razorpay create-order error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")


from pydantic import BaseModel
class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_name: str

@router.post("/verify-payment")
def verify_payment(
    payment_data: PaymentVerification,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    import os
    import razorpay
    from fastapi import HTTPException
    
    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID") or os.getenv("RAZORPAY_KEY") or "dummy_key"
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET") or os.getenv("RAZORPAY_SECRET") or "dummy_secret"
    client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))

    try:
        # Verify the signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': payment_data.razorpay_order_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed.")

    # Payment is verified, update the user's subscription
    plan_credits = {"pro": 500, "unlimited": 999999}
    credits_to_add = plan_credits.get(payment_data.plan_name, 0)

    current_user.subscription = payment_data.plan_name
    if payment_data.plan_name != "unlimited":
        current_user.credits += credits_to_add
    else:
        current_user.credits = 999999  # Effectively unlimited

    txn = models.CreditTransaction(
        user_id = current_user.id,
        amount  = credits_to_add,
        reason  = f"subscription_{payment_data.plan_name}_payment_verified"
    )
    db.add(txn)
    db.commit()
    db.refresh(current_user)

    return {
        "message": f"Payment successful! Subscribed to {payment_data.plan_name} plan.",
        "new_credits": current_user.credits,
        "subscription": current_user.subscription
    }
