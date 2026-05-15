from fastapi import APIRouter, HTTPException
import os
from typing import Dict

router = APIRouter(prefix="/api/stylist", tags=["AI Stylist"])

SYSTEM_PROMPT = """
You are FitAI, a professional and high-end fashion stylist assistant. 
Your goal is to help users find the perfect outfit based on their preferences, body type, occasion, and current trends.
Be stylish, friendly, and expert in your advice. 
Recommend specific colors, fabrics, and styles.
If the user asks about virtual try-on, tell them they can use our Studio to see the clothes on themselves.
Keep your responses concise but insightful.
"""


def _get_gemini_client():
    """Lazily create a Gemini client using the new google-genai SDK."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("Gemini_api")
    if not api_key:
        return None
    from google import genai
    return genai.Client(api_key=api_key)


@router.post("/chat")
async def ai_stylist_chat(payload: Dict):
    """
    AI Stylist using Google Gemini 1.5 Flash (text).
    Uses the new google-genai SDK.
    """
    user_message = payload.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message is required.")

    client = _get_gemini_client()
    if not client:
        return {"reply": "I'm currently resting. Please set the GEMINI_API_KEY to start chatting!"}

    try:
        from google.genai import types

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=f"{SYSTEM_PROMPT}\n\nUser: {user_message}",
            config=types.GenerateContentConfig(
                response_modalities=["TEXT"],
            ),
        )
        return {"reply": response.text}

    except Exception as e:
        print(f"Gemini Stylist Error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"AI Stylist is temporarily unavailable. ({type(e).__name__})"
        )
