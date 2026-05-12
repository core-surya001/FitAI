import os
import shutil
import uuid
import tempfile
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/tryon", tags=["Virtual Try-On"])

# ── Fallback HF Spaces (tried in order) ─────────────────────────────────────
HF_SPACES = [
    "yisol/IDM-VTON",
    "Kwai-Kolors/Kolors-Virtual-Try-On",
]

# Reset client on each request — no caching of broken connections
def _make_gradio_client(space: str):
    from gradio_client import Client
    hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_token")
    return Client(space, token=hf_token)


def _get_local_path(file_path_or_url: str) -> str:
    """
    Given a file_path from the DB (either a local path or a Cloudinary/remote URL),
    return a local filesystem path that Gradio's handle_file can use.
    
    - If it's a local path → return as-is.
    - If it's a remote URL (Cloudinary, etc.) → download to a temp file and return that path.
    """
    if file_path_or_url.startswith("http://") or file_path_or_url.startswith("https://"):
        # Download the remote image to a temporary file
        suffix = os.path.splitext(file_path_or_url.split("?")[0])[1] or ".jpg"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        with httpx.Client(timeout=30) as client:
            response = client.get(file_path_or_url)
            response.raise_for_status()
            tmp.write(response.content)
        tmp.close()
        return tmp.name
    else:
        # Local relative path
        return file_path_or_url


def _run_idm_vton(client, model_path: str, garment_path: str) -> str:
    """Run IDM-VTON space. Returns local path of the result image."""
    from gradio_client import handle_file
    result = client.predict(
        dict={"background": handle_file(model_path), "layers": [], "composite": None},
        garm_img=handle_file(garment_path),
        garment_des="A stylish garment",
        is_checked=True,
        is_checked_crop=False,
        denoise_steps=30,
        seed=-1,
        api_name="/tryon"
    )
    if not result or len(result) == 0:
        raise Exception("AI model returned no result.")
    return result[0]


def _run_kolors_vton(client, model_path: str, garment_path: str) -> str:
    """Run Kolors Virtual Try-On space. Returns local path of the result image."""
    from gradio_client import handle_file
    result = client.predict(
        model_image=handle_file(model_path),
        garment_image=handle_file(garment_path),
        api_name="/tryon"
    )
    if not result:
        raise Exception("AI model returned no result.")
    # May return a string path or a dict with 'url'
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        return result.get("url") or result.get("path") or str(result)
    return str(result)


def _try_generate(model_path: str, garment_path: str) -> str:
    """Try each HF space in order. Returns the local path of the generated image."""
    last_error = None
    for space in HF_SPACES:
        try:
            print(f"[TryOn] Trying space: {space}")
            client = _make_gradio_client(space)
            if "IDM-VTON" in space or "idm-vton" in space:
                return _run_idm_vton(client, model_path, garment_path)
            elif "Kolors" in space:
                return _run_kolors_vton(client, model_path, garment_path)
            else:
                return _run_idm_vton(client, model_path, garment_path)
        except Exception as e:
            print(f"[TryOn] Space {space} failed: {e}")
            last_error = e
            continue
    raise Exception(f"All AI spaces failed. Last error: {last_error}")


@router.post("/generate", response_model=schemas.TryOnJobOut)
def generate_tryon(
    payload: schemas.TryOnRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Virtual Try-On using Hugging Face Spaces (Gradio).
    - Tries multiple spaces with automatic fallback.
    - Handles both local file paths and Cloudinary URLs.
    """
    # 1. Credit Check
    if current_user.credits < 2:
        raise HTTPException(status_code=403, detail="Not enough credits. Please upgrade your plan.")

    # 2. Get Model and Garment records from DB
    model_photo = db.query(models.UserPhoto).filter(models.UserPhoto.id == payload.user_photo_id).first()
    garment_photo = db.query(models.Garment).filter(models.Garment.id == payload.garment_id).first()

    if not model_photo or not garment_photo:
        raise HTTPException(status_code=404, detail="Model or Garment photo not found.")

    # 3. Resolve local file paths (downloads from Cloudinary if needed)
    model_local = None
    garment_local = None
    model_is_temp = False
    garment_is_temp = False

    try:
        original_model_path = model_photo.file_path
        original_garment_path = garment_photo.file_path

        model_local = _get_local_path(original_model_path)
        model_is_temp = original_model_path.startswith("http")

        garment_local = _get_local_path(original_garment_path)
        garment_is_temp = original_garment_path.startswith("http")

        # 4. Run AI generation (tries multiple HF spaces)
        temp_result_path = _try_generate(model_local, garment_local)

        # 5. Save Result
        result_filename = f"{uuid.uuid4().hex}.png"
        final_result_path = os.path.join("uploads", "results", result_filename)
        os.makedirs(os.path.dirname(final_result_path), exist_ok=True)
        shutil.move(temp_result_path, final_result_path)

        # 6. Upload result to Cloudinary if configured
        try:
            from cloudinary_helper import is_cloudinary_configured, upload_to_cloudinary
            if is_cloudinary_configured():
                with open(final_result_path, "rb") as f:
                    result_url = upload_to_cloudinary(f.read(), "fitai/results")
                os.remove(final_result_path)  # Remove local copy after cloud upload
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

        # 7. Save record + deduct credits
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
        return new_result

    except Exception as e:
        print(f"[TryOn] Generation error: {e}")
        db.rollback()
        error_msg = str(e)
        if "CONFIG_ERROR" in error_msg:
            user_msg = "The AI try-on service is temporarily unavailable (HF Space is down). Please try again in a few minutes."
        elif "All AI spaces failed" in error_msg:
            user_msg = "All AI try-on services are currently unavailable. Please try again later."
        else:
            user_msg = f"Try-on generation failed: {error_msg}"
        raise HTTPException(status_code=503, detail=user_msg)

    finally:
        # Clean up temp files downloaded from Cloudinary
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
    jobs = db.query(models.TryOnJob)\
             .filter(models.TryOnJob.user_id == current_user.id)\
             .filter(models.TryOnJob.status == "completed")\
             .order_by(models.TryOnJob.created_at.desc())\
             .all()
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

    # Remove local file (skip for Cloudinary/remote URLs)
    if job.result_url and not job.result_url.startswith("http"):
        file_path = job.result_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(job)
    db.commit()
