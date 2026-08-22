from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.auth import authenticate_admin, create_access_token, get_current_admin
from app.cloudinary_utils import upload_image
from app.database import get_db
from app.schemas import AdminLogin, Token, ImageUploadOut

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB


@router.post("/login", response_model=Token)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, payload.username, payload.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token(subject=admin.username)
    return Token(access_token=token)


@router.post("/upload-image", response_model=ImageUploadOut, dependencies=[Depends(get_current_admin)])
async def upload_product_image(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images are allowed")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image is too large — please keep uploads under 8MB")

    url = upload_image(contents)
    return ImageUploadOut(url=url)
