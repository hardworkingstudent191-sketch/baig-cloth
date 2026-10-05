"""Export the Baig Cloth catalog from the FastAPI/Postgres backend to JSON.

The JSON this writes (catalog-export.json) is the seed the WordPress plugin's
importer consumes (wp-admin -> Baig Cloth -> Import catalog). Field names and
serialization match the public FastAPI contract exactly: prices as strings,
datetimes as ISO-8601 with timezone, image_urls as a list of strings.

Run it with the backend's own virtualenv so the SQLAlchemy models and the
DATABASE_URL in backend/.env are reused rather than re-derived:

    cd backend
    .venv/Scripts/python.exe ../wordpress/migration/export_from_postgres.py
"""

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal  # noqa: E402
from app.models import Category, Product  # noqa: E402

OUT_PATH = Path(__file__).resolve().parent / "catalog-export.json"


def iso(dt):
    return dt.isoformat() if dt is not None else None


def main() -> None:
    db = SessionLocal()
    try:
        categories = [
            {
                "id": c.id,
                "name": c.name,
                "gender": c.gender.value,
                "sort_order": c.sort_order,
            }
            for c in db.query(Category).order_by(Category.id).all()
        ]
        products = [
            {
                "id": p.id,
                "name": p.name,
                "category_id": p.category_id,
                "description": p.description or "",
                "price": str(p.price),
                "sale_price": str(p.sale_price) if p.sale_price is not None else None,
                "on_sale": p.on_sale,
                "sale_ends_at": iso(p.sale_ends_at),
                "in_stock": p.in_stock,
                "image_urls": list(p.image_urls or []),
                "featured": p.featured,
                "created_at": iso(p.created_at),
            }
            for p in db.query(Product).order_by(Product.id).all()
        ]
    finally:
        db.close()

    OUT_PATH.write_text(
        json.dumps({"categories": categories, "products": products}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {len(categories)} categories and {len(products)} products to {OUT_PATH}")


if __name__ == "__main__":
    main()
