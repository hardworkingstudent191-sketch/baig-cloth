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


def _optimize_delivery_url(secure_url: str) -> str:
    """Inserts Cloudinary's automatic-format/automatic-quality transformation
    (f_auto,q_auto) into a delivery URL.

    The raw `secure_url` Cloudinary returns is the uploaded file as-is — same
    bytes to every visitor regardless of device or browser. f_auto,q_auto
    makes every future fetch of that URL serve WebP/AVIF to a browser that
    supports it, at a real content-aware compressed quality, for free —
    generated on first fetch and cached at Cloudinary's edge after that, no
    separate transformation request or stored duplicate needed. A plain
    string replace rather than the Cloudinary SDK's URL builder: the shape of
    `secure_url` (.../upload/v<version>/<public_id>.<ext>) is stable, and
    this avoids re-deriving cloud name/public_id just to rebuild what's
    already sitting right there in the response.
    """
    return secure_url.replace("/upload/", "/upload/f_auto,q_auto/", 1)


def upload_image(file_bytes: bytes, folder: str = "baig-cloth/products") -> str:
    """Uploads image bytes to Cloudinary and returns an optimized delivery URL."""
    try:
        result = cloudinary.uploader.upload(file_bytes, folder=folder)
    except Exception as exc:  # cloudinary raises its own Error type, plus network errors
        raise HTTPException(
            status_code=502,
            detail="Image upload failed — check the Cloudinary credentials in .env, or try again.",
        ) from exc
    return _optimize_delivery_url(result["secure_url"])
