"""
Cloudinary helper — uploads images to Cloudinary for permanent cloud storage.
Falls back to local disk storage if CLOUDINARY_URL is not configured.
"""
import os
import cloudinary
import cloudinary.uploader

_configured = False


def _configure():
    global _configured
    if _configured:
        return
    cloud_url = os.getenv("CLOUDINARY_URL")
    if cloud_url:
        # CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
        cloudinary.config(cloudinary_url=cloud_url)
        _configured = True
    else:
        # Try individual vars
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key    = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
        if cloud_name and api_key and api_secret:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            _configured = True


def is_cloudinary_configured() -> bool:
    _configure()
    return _configured


def upload_to_cloudinary(file_bytes: bytes, folder: str, public_id: str | None = None) -> str:
    """
    Upload raw bytes to Cloudinary and return the secure HTTPS URL.
    folder: e.g. 'fitai/user_photos'
    """
    _configure()
    kwargs = {"folder": folder, "resource_type": "image"}
    if public_id:
        kwargs["public_id"] = public_id

    result = cloudinary.uploader.upload(file_bytes, **kwargs)
    return result["secure_url"]


def delete_from_cloudinary(public_id: str) -> None:
    """Delete an asset from Cloudinary by its public_id."""
    _configure()
    cloudinary.uploader.destroy(public_id)
