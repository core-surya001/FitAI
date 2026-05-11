from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import aiofiles, uuid, os, shutil

from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/photos", tags=["User Photos"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def save_upload(file: UploadFile, subfolder: str) -> tuple[str, str]:
    """
    Saves an uploaded file to disk.
    Returns (filename, relative_path).
    """
    folder = os.path.join(UPLOAD_DIR, subfolder)
    # Ensure directory exists at save-time (not just at startup)
    os.makedirs(folder, exist_ok=True)

    ext      = os.path.splitext(file.filename or "upload")[1] or ".jpg"
    unique   = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(folder, unique)

    # Reset file pointer in case it was partially consumed
    file.file.seek(0)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return unique, filepath.replace("\\", "/")


@router.post("/upload", response_model=schemas.UserPhotoOut, status_code=status.HTTP_201_CREATED)
def upload_user_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Upload a full-body photo of the user (the 'model' for try-on).
    - Accepts JPEG, PNG, WebP files only.
    - Saves to the local uploads/user_photos/ directory.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    try:
        filename, filepath = save_upload(file, "user_photos")
    except Exception as e:
        print(f"Photo upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    photo = models.UserPhoto(
        user_id   = current_user.id,
        filename  = filename,
        file_path = filepath
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


@router.get("/", response_model=List[schemas.UserPhotoOut])
def get_user_photos(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Returns all uploaded user photos for the authenticated user."""
    return db.query(models.UserPhoto).filter(models.UserPhoto.user_id == current_user.id).all()


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a specific user photo. Only the owner can delete their photo."""
    photo = db.query(models.UserPhoto).filter(
        models.UserPhoto.id == photo_id,
        models.UserPhoto.user_id == current_user.id
    ).first()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found.")

    # Remove the file from disk
    if os.path.exists(photo.file_path):
        os.remove(photo.file_path)

    db.delete(photo)
    db.commit()
