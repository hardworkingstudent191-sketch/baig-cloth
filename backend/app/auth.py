from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AdminUser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")

# A valid-looking bcrypt hash with no matching password, used purely so
# verify_password always has real work to do — see authenticate_admin below.
_DUMMY_HASH = pwd_context.hash("not-a-real-password-just-a-timing-decoy")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
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
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    admin = db.query(AdminUser).filter(AdminUser.username == username).first()
    if admin is None:
        raise credentials_exception
    return admin
