from fastapi import APIRouter, Depends, HTTPException, status
import os
import google.generativeai as genai
from typing import List, Dict

router = APIRouter(prefix="/api/stylist", tags=["AI Stylist"])

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
else:
    model = None

SYSTEM_PROMPT = """
You are FitAI, a professional and high-end fashion stylist assistant. 
Your goal is to help users find the perfect outfit based on their preferences, body type, occasion, and current trends.
Be stylish, friendly, and expert in your advice. 
Recommend specific colors, fabrics, and styles.
If the user asks about virtual try-on, tell them they can use our Studio to see the clothes on themselves.
Keep your responses concise but insightful.
"""

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

    if not model:
        # Fallback if API key is missing
        return {"reply": "I'm currently resting. Please set my API key to start chatting!"}

    try:
        # Generate response using Gemini
        chat = model.start_chat(history=[])
        response = chat.send_message(f"{SYSTEM_PROMPT}\n\nUser: {user_message}")
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        return {"reply": "Sorry, I'm having a bit of a creative block. Can you ask me again?"}
