from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AdminUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")

# bcrypt only looks at the first 72 bytes of a password. passlib (the
# previous hashing layer) silently truncated to 72 bytes before hashing, so
# doing the same here keeps every existing hash verifying exactly as it did.
# The schema layer additionally rejects new passwords longer than that, so
# nobody sets a password whose tail is silently ignored (see schemas.py).
_BCRYPT_MAX_BYTES = 72
_BCRYPT_ROUNDS = 12  # passlib's default; same work factor as the existing hashes


def _prep(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prep(password), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode("ascii")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_prep(plain_password), password_hash.encode("ascii"))
    except (ValueError, TypeError):
        # Not a bcrypt hash (corrupt row, wrong encoding). Treat as a
        # mismatch rather than a 500 — never let a bad hash log someone in.
        return False


# A valid-looking bcrypt hash with no matching password, used purely so
# verify_password always has real work to do — see authenticate_admin below.
_DUMMY_HASH = hash_password("not-a-real-password-just-a-timing-decoy")


def create_access_token(admin: AdminUser) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": admin.username,
        # Token version: bumped on every password change (see routers/admin.py)
        # and compared in get_current_admin, so a token issued before the
        # change stops working immediately instead of living out its 24h.
        "ver": admin.token_version,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def authenticate_admin(db: Session, username: str, password: str) -> AdminUser | None:
    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    # Bcrypt verification is deliberately slow, and Python's `or` short-
    # circuits — so "not admin or not verify_password(...)" used to skip
    # verify_password entirely when the username didn't exist. That made a
    # login attempt for a real username measurably slower than one for a
    # made-up username, even though both return the same error message:
    # enough to let an attacker enumerate valid admin usernames purely by
    # timing responses. Always doing a verify (against a decoy hash when
    # there's no real one) keeps the timing the same either way.
    password_hash = admin.password_hash if admin else _DUMMY_HASH
    password_ok = verify_password(password, password_hash)
    if not admin or not password_ok:
        return None
    return admin


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # `algorithms` is an explicit allow-list: a token whose header names
        # any other algorithm (including "none") is rejected before the
        # signature is even looked at. `require` makes a token that omits
        # exp/sub/ver invalid rather than merely un-checked.
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub", "ver"]},
        )
    except jwt.PyJWTError:
        raise credentials_exception

    username = payload.get("sub")
    version = payload.get("ver")
    if not isinstance(username, str) or not isinstance(version, int):
        raise credentials_exception

    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if admin is None or admin.token_version != version:
        raise credentials_exception
    return admin
