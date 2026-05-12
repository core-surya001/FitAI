import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from gradio_client import Client, handle_file
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/tryon", tags=["Virtual Try-On"])

# ── Free Alternative: Hugging Face Space (Gradio) ────────────────────────────
HF_SPACE = "yisol/IDM-VTON"
_gradio_client = None

@router.post("/generate", response_model=schemas.TryOnJobOut)
def generate_tryon(
    payload: schemas.TryOnRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    FREE Virtual Try-On using Hugging Face Spaces (via Gradio).
    - Uses IDM-VTON for ultra-realistic results.
    """
    # 1. Credit Check (Keep it for balance simulation)
    if current_user.credits < 2:
        raise HTTPException(status_code=403, detail="Not enough credits. Please upgrade your plan.")

    # 2. Get Model and Garment Paths
    model_photo = db.query(models.UserPhoto).filter(models.UserPhoto.id == payload.user_photo_id).first()
    garment_photo = db.query(models.Garment).filter(models.Garment.id == payload.garment_id).first()

    if not model_photo or not garment_photo:
        raise HTTPException(status_code=404, detail="Model or Garment photo not found.")

    # 3. Call Gradio (Free AI Model - IDM-VTON)
    try:
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HF_token")
        global _gradio_client
        if _gradio_client is None:
            _gradio_client = Client(HF_SPACE, token=hf_token)
        client = _gradio_client
        # IDM-VTON requires an Imageeditor dict for the model image
        result = client.predict(
            dict={"background": handle_file(model_photo.file_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_photo.file_path),
            garment_des="A stylish garment",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=-1,
            api_name="/tryon"
        )

        # IDM-VTON returns a tuple: (final_image_path, masked_image_path)
        if not result or len(result) == 0:
            raise Exception("AI model returned no result.")
            
        temp_result_path = result[0]
        
        # 4. Save Result to our uploads folder
        result_filename = f"{uuid.uuid4().hex}.png"
        final_result_path = os.path.join("uploads", "results", result_filename)
        os.makedirs(os.path.dirname(final_result_path), exist_ok=True)
        
        # Move file from temp to permanent storage
        shutil.move(temp_result_path, final_result_path)
        
        # Construct URL
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        result_url = f"{base_url}/uploads/results/{result_filename}"

        # 5. Save Record to Database
        new_result = models.TryOnJob(
            user_id       = current_user.id,
            user_photo_id = model_photo.id,
            garment_id    = garment_photo.id,
            status        = "completed",
            result_url    = result_url
        )
        db.add(new_result)

        # 6. Deduct Credits
        current_user.credits -= 2
        
        # Log Transaction
        txn = models.CreditTransaction(
            user_id = current_user.id,
            amount  = -2,
            reason  = "virtual_tryon_generation_free"
        )
        db.add(txn)
        
        db.commit()
        db.refresh(new_result)
        
        return new_result

    except Exception as e:
        print(f"Gradio AI Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI Generation failed (Free Mode): {str(e)}")

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

    # Remove the file from disk if it's stored locally
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    if job.result_url.startswith(base_url):
        file_path = job.result_url.replace(f"{base_url}/", "")
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(job)
    db.commit()
