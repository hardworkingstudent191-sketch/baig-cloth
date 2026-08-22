import io

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.auth import authenticate_admin, create_access_token, get_current_admin
from app.cloudinary_utils import upload_image
from app.database import get_db
from app.rate_limit import enforce_login_rate_limit
from app.schemas import AdminLogin, Token, ImageUploadOut

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


@router.post("/login", response_model=Token)
def login(payload: AdminLogin, request: Request, db: Session = Depends(get_db)):
    enforce_login_rate_limit(request)
    admin = authenticate_admin(db, payload.username, payload.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token(subject=admin.username)
    return Token(access_token=token)


@router.post("/upload-image", response_model=ImageUploadOut, dependencies=[Depends(get_current_admin)])
async def upload_product_image(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large — please keep uploads under 8MB")

    # The old check only trusted the browser-supplied Content-Type header,
    # which a client can set to anything regardless of what the file
    # actually is. Opening it with Pillow and checking the real, decoded
    # format closes that gap — a renamed/relabeled non-image file gets
    # rejected here instead of being forwarded to Cloudinary under this
    # app's account.
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
        image_format = image.format
    except UnidentifiedImageError:
        image_format = None

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images are allowed")

    url = upload_image(contents)
    return ImageUploadOut(url=url)
