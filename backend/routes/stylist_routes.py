from fastapi import APIRouter, Depends, HTTPException, status
import os
import google.generativeai as genai
from typing import List, Dict

router = APIRouter(prefix="/api/stylist", tags=["AI Stylist"])

SYSTEM_PROMPT = """
You are FitAI, a professional and high-end fashion stylist assistant. 
Your goal is to help users find the perfect outfit based on their preferences, body type, occasion, and current trends.
Be stylish, friendly, and expert in your advice. 
Recommend specific colors, fabrics, and styles.
If the user asks about virtual try-on, tell them they can use our Studio to see the clothes on themselves.
Keep your responses concise but insightful.
"""

def _get_gemini_model():
    """Lazily initialize Gemini model so env vars are always read at request time."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("Gemini_api")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')


@router.post("/chat")
async def ai_stylist_chat(payload: Dict):
    """
    Real AI Stylist using Google Gemini.
    - Handles user fashion queries.
    - Provides expert style advice.
    """
    user_message = payload.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")

    model = _get_gemini_model()

    if not model:
        # Fallback if API key is missing
        return {"reply": "I'm currently resting. Please set my GEMINI_API_KEY environment variable to start chatting!"}

    try:
        # Generate response using Gemini
        chat = model.start_chat(history=[])
        response = chat.send_message(f"{SYSTEM_PROMPT}\n\nUser: {user_message}")
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI Stylist is temporarily unavailable. Please try again shortly. ({type(e).__name__})"
        )
