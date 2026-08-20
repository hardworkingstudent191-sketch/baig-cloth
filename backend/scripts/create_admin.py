"""
Run once to create the first admin user, e.g.:
    python -m scripts.create_admin

Reads INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD from .env.
Safe to re-run: it will skip if that username already exists.
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.auth import hash_password
from app.config import settings
from app.database import SessionLocal, Base, engine
from app.models import AdminUser


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    username = os.getenv("INITIAL_ADMIN_USERNAME", "admin")
    password = os.getenv("INITIAL_ADMIN_PASSWORD")

    if not password:
        print("Set INITIAL_ADMIN_PASSWORD in your .env before running this.")
        return

    existing = db.query(AdminUser).filter(AdminUser.username == username).first()
    if existing:
        print(f"Admin '{username}' already exists. Skipping.")
        return

    admin = AdminUser(username=username, password_hash=hash_password(password))
    db.add(admin)
    db.commit()
    print(f"Created admin user '{username}'.")


if __name__ == "__main__":
    main()
