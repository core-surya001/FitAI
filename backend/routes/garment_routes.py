from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import os, uuid, shutil

from database import get_db
import models, schemas, auth
from cloudinary_helper import is_cloudinary_configured, upload_to_cloudinary

router = APIRouter(prefix="/api/garments", tags=["Garments"])

UPLOAD_DIR   = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def save_upload_local(file: UploadFile, subfolder: str) -> tuple[str, str]:
    folder   = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    ext      = os.path.splitext(file.filename or "upload")[1] or ".jpg"
    unique   = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(folder, unique)
    file.file.seek(0)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return unique, filepath.replace("\\", "/")


def upload_file(file: UploadFile, subfolder: str) -> tuple[str, str]:
    """
    Upload to Cloudinary if configured, otherwise save locally.
    Returns (display_name, file_path_or_url).
    """
    if is_cloudinary_configured():
        file.file.seek(0)
        raw = file.file.read()
        cloud_folder = f"fitai/{subfolder}"
        url = upload_to_cloudinary(raw, cloud_folder)
        display_name = file.filename or "upload"
        return display_name, url
    else:
        return save_upload_local(file, subfolder)


@router.post("/upload", response_model=schemas.GarmentOut, status_code=status.HTTP_201_CREATED)
def upload_garment(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Upload a garment/clothing photo.
    - Saves to Cloudinary (if configured) or local disk.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    try:
        filename, filepath = upload_file(file, "garments")
    except Exception as e:
        print(f"Garment upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    garment = models.Garment(
        user_id   = current_user.id,
        name      = name or filename,
        category  = category,
        filename  = filename,
        file_path = filepath
    )
    db.add(garment)
    db.commit()
    db.refresh(garment)
    return garment


@router.get("/", response_model=List[schemas.GarmentOut])
def get_garments(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Returns all garments uploaded by the user. Optionally filter by category."""
    query = db.query(models.Garment).filter(models.Garment.user_id == current_user.id)
    if category:
        query = query.filter(models.Garment.category == category)
    return query.all()


@router.delete("/{garment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_garment(
    garment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a garment. Only the owner can delete it."""
    garment = db.query(models.Garment).filter(
        models.Garment.id == garment_id,
        models.Garment.user_id == current_user.id
    ).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found.")

    # Only delete local files, not Cloudinary URLs
    if garment.file_path and not garment.file_path.startswith("http"):
        if os.path.exists(garment.file_path):
            os.remove(garment.file_path)

    db.delete(garment)
    db.commit()
