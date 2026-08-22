import cloudinary
import cloudinary.uploader
from fastapi import HTTPException

from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload_image(file_bytes: bytes, folder: str = "baig-cloth/products") -> str:
    """Uploads image bytes to Cloudinary and returns the secure URL."""
    try:
        result = cloudinary.uploader.upload(file_bytes, folder=folder)
    except Exception as exc:  # cloudinary raises its own Error type, plus network errors
        raise HTTPException(
            status_code=502,
            detail="Image upload failed — check the Cloudinary credentials in .env, or try again.",
        ) from exc
    return result["secure_url"]
