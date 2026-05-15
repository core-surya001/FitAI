import os
import uuid
import base64
import tempfile
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/tryon", tags=["Virtual Try-On"])


def _get_local_path(file_path_or_url: str) -> str:
    """
    Given a file_path from the DB (local path or remote URL),
    return a local filesystem path usable for reading.
    """
    if file_path_or_url.startswith("http://") or file_path_or_url.startswith("https://"):
        suffix = os.path.splitext(file_path_or_url.split("?")[0])[1] or ".jpg"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        with httpx.Client(timeout=30) as client:
            response = client.get(file_path_or_url)
            response.raise_for_status()
            tmp.write(response.content)
        tmp.close()
        return tmp.name
    return file_path_or_url


def _image_to_base64(path: str) -> tuple[str, str]:
    """Read an image file and return (base64_string, mime_type)."""
    ext = os.path.splitext(path)[1].lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    mime = mime_map.get(ext, "image/jpeg")
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return data, mime


def _try_generate_gemini(model_path: str, garment_path: str) -> bytes:
    """
    Use Google Gemini to generate a virtual try-on result.
    Sends both images and asks Gemini to produce a realistic composite.
    Returns the raw PNG bytes of the generated image.
    """
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("Gemini_api")
    if not api_key:
        raise Exception("GEMINI_API_KEY is not configured on the server.")

    genai.configure(api_key=api_key)

    # Use Gemini 2.0 Flash which supports image output
    model = genai.GenerativeModel("gemini-2.0-flash-preview-image-generation")

    model_b64, model_mime = _image_to_base64(model_path)
    garment_b64, garment_mime = _image_to_base64(garment_path)

    prompt = (
        "You are a virtual try-on AI. I will give you two images:\n"
        "1. A person (the model photo)\n"
        "2. A clothing item / garment\n\n"
        "Your task: Generate a realistic, high-quality image of the SAME PERSON "
        "wearing the EXACT garment from image 2. "
        "Keep the person's face, body, pose, and background the same. "
        "Only change the clothing to the provided garment. "
        "Make it look photorealistic and natural. "
        "Output ONLY the final image with the person wearing the garment."
    )

    response = model.generate_content(
        [
            prompt,
            {"mime_type": model_mime, "data": model_b64},
            {"mime_type": garment_mime, "data": garment_b64},
        ],
        generation_config={"response_modalities": ["IMAGE", "TEXT"]},
    )

    # Extract the image bytes from the response
    for part in response.candidates[0].content.parts:
        if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
            return part.inline_data.data  # raw bytes

    raise Exception(
        "Gemini did not return an image. "
        "The model may have refused or only returned text. "
        f"Text response: {response.text[:300] if hasattr(response, 'text') else 'none'}"
    )


@router.post("/generate", response_model=schemas.TryOnJobOut)
def generate_tryon(
    payload: schemas.TryOnRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Virtual Try-On using Google Gemini 2.0 Flash (image generation).
    - Completely free using the existing GEMINI_API_KEY.
    - Credits are only deducted on success.
    """
    # 1. Credit Check
    if current_user.credits < 2:
        raise HTTPException(
            status_code=403,
            detail="Not enough credits. Please upgrade your plan."
        )

    # 2. Get Model and Garment records from DB
    model_photo = db.query(models.UserPhoto).filter(
        models.UserPhoto.id == payload.user_photo_id
    ).first()
    garment_photo = db.query(models.Garment).filter(
        models.Garment.id == payload.garment_id
    ).first()

    if not model_photo or not garment_photo:
        raise HTTPException(status_code=404, detail="Model or Garment photo not found.")

    model_local = None
    garment_local = None
    model_is_temp = False
    garment_is_temp = False

    try:
        original_model_path = model_photo.file_path
        original_garment_path = garment_photo.file_path

        # 3. Resolve local file paths (download from Cloudinary if needed)
        model_local = _get_local_path(original_model_path)
        model_is_temp = original_model_path.startswith("http")

        garment_local = _get_local_path(original_garment_path)
        garment_is_temp = original_garment_path.startswith("http")

        # 4. Run AI generation via Gemini
        print(f"[TryOn] Starting Gemini try-on for user {current_user.id}")
        image_bytes = _try_generate_gemini(model_local, garment_local)
        print(f"[TryOn] Gemini returned {len(image_bytes)} bytes")

        # 5. Save result image
        result_filename = f"{uuid.uuid4().hex}.png"
        final_result_path = os.path.join("uploads", "results", result_filename)
        os.makedirs(os.path.dirname(final_result_path), exist_ok=True)

        with open(final_result_path, "wb") as f:
            f.write(image_bytes)

        # 6. Upload result to Cloudinary if configured, else serve locally
        try:
            from cloudinary_helper import is_cloudinary_configured, upload_to_cloudinary
            if is_cloudinary_configured():
                result_url = upload_to_cloudinary(image_bytes, "fitai/results")
                os.remove(final_result_path)
            else:
                base_url = os.getenv("BASE_URL", "").rstrip("/")
                result_url = (
                    f"{base_url}/uploads/results/{result_filename}"
                    if base_url
                    else f"uploads/results/{result_filename}"
                )
        except Exception:
            base_url = os.getenv("BASE_URL", "").rstrip("/")
            result_url = (
                f"{base_url}/uploads/results/{result_filename}"
                if base_url
                else f"uploads/results/{result_filename}"
            )

        # 7. Save record + deduct credits ONLY on success
        new_result = models.TryOnJob(
            user_id       = current_user.id,
            user_photo_id = model_photo.id,
            garment_id    = garment_photo.id,
            status        = "completed",
            result_url    = result_url
        )
        db.add(new_result)
        current_user.credits -= 2
        db.add(models.CreditTransaction(
            user_id = current_user.id,
            amount  = -2,
            reason  = "virtual_tryon_generation"
        ))
        db.commit()
        db.refresh(new_result)
        print(f"[TryOn] Job {new_result.id} saved. URL: {result_url}")
        return new_result

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print(f"[TryOn] Generation error: {e}")
        error_msg = str(e)

        if "GEMINI_API_KEY" in error_msg:
            user_msg = "AI service is not configured. Please contact support."
        elif "quota" in error_msg.lower() or "rate" in error_msg.lower() or "429" in error_msg:
            user_msg = "AI service rate limit reached. Please wait a minute and try again."
        elif "refused" in error_msg.lower() or "safety" in error_msg.lower():
            user_msg = "The AI could not process these images due to content guidelines. Try different photos."
        elif "did not return an image" in error_msg:
            user_msg = "The AI generation did not produce an image. Please try again with clearer photos."
        else:
            user_msg = f"Try-on generation failed: {error_msg}"

        raise HTTPException(status_code=503, detail=user_msg)

    finally:
        # Clean up any temp files downloaded from Cloudinary
        if model_is_temp and model_local and os.path.exists(model_local):
            os.remove(model_local)
        if garment_is_temp and garment_local and os.path.exists(garment_local):
            os.remove(garment_local)


@router.get("/history", response_model=list[schemas.TryOnJobOut])
def get_tryon_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all past virtual try-on generations for the current user."""
    jobs = (
        db.query(models.TryOnJob)
        .filter(models.TryOnJob.user_id == current_user.id)
        .filter(models.TryOnJob.status == "completed")
        .order_by(models.TryOnJob.created_at.desc())
        .all()
    )
    return jobs


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tryon_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a past generated look."""
    job = db.query(models.TryOnJob).filter(
        models.TryOnJob.id == job_id,
        models.TryOnJob.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Remove local file only (skip for remote URLs)
    if job.result_url and not job.result_url.startswith("http"):
        file_path = job.result_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(job)
    db.commit()
