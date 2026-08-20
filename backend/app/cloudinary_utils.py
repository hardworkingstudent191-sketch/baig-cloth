import cloudinary
import cloudinary.uploader

from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload_image(file_bytes: bytes, folder: str = "baig-cloth/products") -> str:
    """Uploads image bytes to Cloudinary and returns the secure URL."""
    result = cloudinary.uploader.upload(file_bytes, folder=folder)
    return result["secure_url"]
