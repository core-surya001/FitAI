import os
import uuid
import tempfile
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/tryon", tags=["Virtual Try-On"])


def _get_local_path(file_path_or_url: str) -> str:
    """
    Download remote URL to a temp file and return its local path.
    Returns local paths as-is.
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


def _try_generate_gemini(model_path: str, garment_path: str) -> bytes:
    """
    Use Google Gemini 2.0 Flash (image generation) for virtual try-on.
    Uses the NEW google-genai SDK which supports image output.
    Returns raw PNG bytes of the generated result.
    """
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("Gemini_api")
    if not api_key:
        raise Exception("GEMINI_API_KEY is not configured on the server.")

    client = genai.Client(api_key=api_key)

    # Read both images
    with open(model_path, "rb") as f:
        model_bytes = f.read()
    with open(garment_path, "rb") as f:
        garment_bytes = f.read()

    # Detect mime types
    def _mime(path: str) -> str:
        ext = os.path.splitext(path)[1].lower()
        return {"jpg": "image/jpeg", "jpeg": "image/jpeg",
                "png": "image/png", "webp": "image/webp"}.get(ext.lstrip("."), "image/jpeg")

    model_mime   = _mime(model_path)
    garment_mime = _mime(garment_path)

    prompt = (
        "You are a virtual try-on AI. You will receive two images:\n"
        "Image 1: A person (the model)\n"
        "Image 2: A clothing item / garment\n\n"
        "Task: Generate a single photorealistic image of the SAME PERSON from Image 1 "
        "wearing the EXACT garment from Image 2. "
        "Preserve the person's face, skin, hair, pose, and background exactly. "
        "Only replace the clothing with the garment provided. "
        "Make the result look natural and realistic, as if photographed. "
        "Output only the final combined image."
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash-preview-image-generation",
        contents=[
            types.Part.from_text(text=prompt),
            types.Part.from_bytes(data=model_bytes,   mime_type=model_mime),
            types.Part.from_bytes(data=garment_bytes, mime_type=garment_mime),
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    # Extract the image bytes from the response parts
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data  # raw bytes

    # If no image part found, surface any text for debugging
    text_parts = []
    for candidate in response.candidates:
        for part in candidate.content.parts:
            if hasattr(part, "text") and part.text:
                text_parts.append(part.text)
    raise Exception(
        f"Gemini returned no image. "
        f"Text response: {' '.join(text_parts)[:300] if text_parts else 'none'}"
    )


@router.post("/generate", response_model=schemas.TryOnJobOut)
def generate_tryon(
    payload: schemas.TryOnRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Virtual Try-On using Google Gemini 2.0 Flash image generation.
    Completely free using GEMINI_API_KEY. Credits deducted only on success.
    """
    # 1. Credit check
    if current_user.credits < 2:
        raise HTTPException(
            status_code=403,
            detail="Not enough credits. Please upgrade your plan."
        )

    # 2. Fetch DB records
    model_photo   = db.query(models.UserPhoto).filter(models.UserPhoto.id == payload.user_photo_id).first()
    garment_photo = db.query(models.Garment).filter(models.Garment.id == payload.garment_id).first()

    if not model_photo or not garment_photo:
        raise HTTPException(status_code=404, detail="Model or Garment photo not found.")

    model_local    = None
    garment_local  = None
    model_is_temp  = False
    garment_is_temp = False

    try:
        # 3. Resolve file paths
        model_local     = _get_local_path(model_photo.file_path)
        model_is_temp   = model_photo.file_path.startswith("http")
        garment_local   = _get_local_path(garment_photo.file_path)
        garment_is_temp = garment_photo.file_path.startswith("http")

        # 4. Generate via Gemini
        print(f"[TryOn] Starting Gemini generation for user {current_user.id}")
        image_bytes = _try_generate_gemini(model_local, garment_local)
        print(f"[TryOn] Gemini returned {len(image_bytes)} bytes")

        # 5. Save result image to disk
        result_filename = f"{uuid.uuid4().hex}.png"
        result_dir = os.path.join("uploads", "results")
        os.makedirs(result_dir, exist_ok=True)
        final_result_path = os.path.join(result_dir, result_filename)
        with open(final_result_path, "wb") as f:
            f.write(image_bytes)

        # 6. Upload to Cloudinary if configured, otherwise use BASE_URL
        result_url = None
        try:
            from cloudinary_helper import is_cloudinary_configured, upload_to_cloudinary
            if is_cloudinary_configured():
                result_url = upload_to_cloudinary(image_bytes, "fitai/results")
                os.remove(final_result_path)
        except Exception:
            pass

        if not result_url:
            base_url = os.getenv("BASE_URL", "").rstrip("/")
            result_url = (
                f"{base_url}/uploads/results/{result_filename}"
                if base_url else
                f"uploads/results/{result_filename}"
            )

        # 7. Persist to DB and deduct credits ONLY on success
        new_result = models.TryOnJob(
            user_id       = current_user.id,
            user_photo_id = model_photo.id,
            garment_id    = garment_photo.id,
            status        = "completed",
            result_url    = result_url,
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
        error_msg = str(e)
        print(f"[TryOn] Error: {error_msg}")

        if "GEMINI_API_KEY" in error_msg:
            user_msg = "AI service is not configured. Please contact support."
        elif "429" in error_msg or "quota" in error_msg.lower() or "exhausted" in error_msg.lower():
            user_msg = "Gemini free quota reached. Please wait a minute and try again."
        elif "safety" in error_msg.lower() or "block" in error_msg.lower():
            user_msg = "The AI could not process these images. Please try with clearer, full-body photos."
        elif "returned no image" in error_msg:
            user_msg = "The AI did not produce an image. Try again with clear, well-lit photos."
        else:
            user_msg = f"Try-on generation failed: {error_msg[:200]}"

        raise HTTPException(status_code=503, detail=user_msg)

    finally:
        if model_is_temp and model_local and os.path.exists(model_local):
            os.remove(model_local)
        if garment_is_temp and garment_local and os.path.exists(garment_local):
            os.remove(garment_local)


@router.get("/history", response_model=list[schemas.TryOnJobOut])
def get_tryon_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
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
    job = db.query(models.TryOnJob).filter(
        models.TryOnJob.id == job_id,
        models.TryOnJob.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.result_url and not job.result_url.startswith("http"):
        fp = job.result_url.lstrip("/")
        if os.path.exists(fp):
            os.remove(fp)
    db.delete(job)
    db.commit()
