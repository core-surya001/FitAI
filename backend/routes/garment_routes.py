from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import os, uuid, shutil

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/garments", tags=["Garments"])

UPLOAD_DIR   = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def save_upload(file: UploadFile, subfolder: str) -> tuple[str, str]:
    folder   = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    ext      = os.path.splitext(file.filename)[1] or ".jpg"
    unique   = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(folder, unique)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return unique, filepath.replace("\\", "/")


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
    - Optionally provide a name (e.g., 'Blue Floral Dress') and category ('tops'/'bottoms'/'dresses').
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    filename, filepath = save_upload(file, "garments")

    garment = models.Garment(
        user_id   = current_user.id,
        name      = name,
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
    """
    Returns all garments uploaded by the user.
    Optionally filter by category: ?category=tops
    """
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

    if os.path.exists(garment.file_path):
        os.remove(garment.file_path)

    db.delete(garment)
    db.commit()
