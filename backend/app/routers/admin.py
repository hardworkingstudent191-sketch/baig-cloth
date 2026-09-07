import io

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.auth import authenticate_admin, create_access_token, get_current_admin, hash_password, verify_password
from app.cloudinary_utils import upload_image
from app.database import get_db
from app.models import AdminUser
from app.rate_limit import enforce_login_rate_limit
from app.schemas import AdminLogin, AdminPasswordChange, Token, ImageUploadOut

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8MB
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


@router.post("/login", response_model=Token)
def login(payload: AdminLogin, request: Request, db: Session = Depends(get_db)):
    enforce_login_rate_limit(request)
    admin = authenticate_admin(db, payload.username, payload.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    return Token(access_token=create_access_token(admin))


@router.put("/password", response_model=Token)
def change_password(
    payload: AdminPasswordChange,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Same limiter as login: this endpoint accepts a password guess (the
    # current one) from anyone holding a valid — possibly stolen — JWT, so it
    # needs the same brute-force throttling, not just the auth-required gate.
    enforce_login_rate_limit(request)

    if not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    admin.password_hash = hash_password(payload.new_password)
    # Revoke every token issued before this moment — including the one that
    # authorised this very request. If the password is being changed because
    # a token may have leaked, the leaked token must die with the old
    # password rather than living out its remaining lifetime. A fresh token
    # for the new version is returned so the admin panel stays signed in.
    admin.token_version += 1
    db.commit()
    db.refresh(admin)
    return Token(access_token=create_access_token(admin))


@router.post("/upload-image", response_model=ImageUploadOut, dependencies=[Depends(get_current_admin)])
async def upload_product_image(request: Request, file: UploadFile = File(...)):
    # Reject obviously oversized uploads before touching the body. This is
    # a courtesy fast-path, not the real limit — Content-Length is client-
    # supplied and may be absent for chunked bodies.
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_UPLOAD_BYTES + 4096:
        raise HTTPException(status_code=413, detail="Image is too large — please keep uploads under 8MB")

    # Read in chunks and stop the moment the cap is crossed. The previous
    # `await file.read()` pulled the entire body first and only then checked
    # its length, so a 2GB upload from a holder of a (possibly stolen) admin
    # token would be fully consumed before being rejected.
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(256 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Image is too large — please keep uploads under 8MB")
        chunks.append(chunk)
    contents = b"".join(chunks)
    if not contents:
        raise HTTPException(status_code=400, detail="No image data received")

    # Only the decoded bytes decide what this file is. The client-supplied
    # filename, extension and Content-Type are never consulted: a renamed or
    # relabeled non-image gets rejected here instead of being forwarded to
    # Cloudinary under this app's account. Nothing is ever written to the
    # local filesystem and the original filename is not used anywhere, so
    # there is no path to traverse.
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
        image_format = image.format
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError):
        image_format = None

    if image_format not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WEBP images are allowed")

    url = upload_image(contents)
    return ImageUploadOut(url=url)
