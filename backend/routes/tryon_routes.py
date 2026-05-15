import os
import uuid
import tempfile
import httpx
import replicate
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/tryon", tags=["Virtual Try-On"])


def _get_local_path(file_path_or_url: str) -> str:
    """
    Given a file_path from the DB (either a local path or a Cloudinary/remote URL),
    return a local filesystem path usable for reading.
    - If it's a remote URL → download to a temp file and return that path.
    - If it's a local path → return as-is.
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


def _try_generate_replicate(model_path: str, garment_path: str) -> str:
    """
    Run virtual try-on via Replicate API (cuuupid/idm-vton).
    Returns the URL of the generated result image.
    Requires REPLICATE_API_TOKEN env var to be set.
    """
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        raise Exception("REPLICATE_API_TOKEN is not configured on the server.")

    # Open both image files as binary
    with open(model_path, "rb") as human_img, open(garment_path, "rb") as garm_img:
        output = replicate.run(
            # IDM-VTON hosted on Replicate — fully managed, no cold start
            "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
            input={
                "human_img": human_img,
                "garm_img": garm_img,
                "garment_des": "A stylish garment",
                "is_checked": True,
                "is_checked_crop": False,
                "denoise_steps": 30,
                "seed": 42,
            },
        )

    # Replicate returns a list of URLs or a single URL
    if isinstance(output, list):
        if len(output) == 0:
            raise Exception("Replicate returned an empty result.")
        result_url = str(output[0])
    elif hasattr(output, "url"):
        result_url = output.url
    else:
        result_url = str(output)

    if not result_url or not result_url.startswith("http"):
        raise Exception(f"Replicate returned an invalid URL: {result_url!r}")

    return result_url


@router.post("/generate", response_model=schemas.TryOnJobOut)
def generate_tryon(
    payload: schemas.TryOnRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Virtual Try-On using Replicate (cuuupid/idm-vton).
    - Handles both local file paths and Cloudinary URLs.
    - Deducts 2 credits only on success.
    """
    # 1. Credit Check
    if current_user.credits < 2:
        raise HTTPException(status_code=403, detail="Not enough credits. Please upgrade your plan.")

    # 2. Get Model and Garment records from DB
    model_photo = db.query(models.UserPhoto).filter(models.UserPhoto.id == payload.user_photo_id).first()
    garment_photo = db.query(models.Garment).filter(models.Garment.id == payload.garment_id).first()

    if not model_photo or not garment_photo:
        raise HTTPException(status_code=404, detail="Model or Garment photo not found.")

    # 3. Resolve local file paths (download from Cloudinary if needed)
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

        # 4. Run AI generation via Replicate
        print(f"[TryOn] Starting Replicate generation for user {current_user.id}")
        result_url = _try_generate_replicate(model_local, garment_local)
        print(f"[TryOn] Replicate returned result URL: {result_url}")

        # 5. Save record + deduct credits (only on success)
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
        print(f"[TryOn] Job {new_result.id} saved successfully.")
        return new_result

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print(f"[TryOn] Generation error: {e}")
        error_msg = str(e)

        if "REPLICATE_API_TOKEN" in error_msg:
            user_msg = "The AI service is not configured. Please contact support."
        elif "401" in error_msg or "403" in error_msg or "Unauthorized" in error_msg:
            user_msg = "Invalid API token for the AI service. Please contact support."
        elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
            user_msg = "The AI generation timed out. Please try again."
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

    # Remove local file only (skip for remote URLs)
    if job.result_url and not job.result_url.startswith("http"):
        file_path = job.result_url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(job)
    db.commit()
