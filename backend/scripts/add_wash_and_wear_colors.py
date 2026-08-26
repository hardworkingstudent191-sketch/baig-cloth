"""
One-time script: adds the 27 real wash-n-wear fabric colors (from actual
shop photos) as products under Men > Wash & Wear, at Rs 3000 with a sale
price of Rs 2200.

Run from the backend directory with the venv active and the API running:
    python -m scripts.add_wash_and_wear_colors
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models import Category, Product, Gender

COLORS = [
    "Ash Grey", "Aubergine", "Beige Taupe", "Camel", "Charcoal", "Denim Blue",
    "Dusty Mauve", "Forest Green", "Ivory", "Khaki", "Light Grey", "Mauve Rose",
    "Navy", "Olive Green", "Olive Khaki", "Periwinkle", "Petrol Teal",
    "Plum Grey", "Powder Blue", "Rust Brown", "Sage Green", "Sky Blue",
    "Slate Grey-Blue", "Slate Lavender", "Steel Blue", "Terracotta", "Wine Plum",
]

PRICE = 3000
SALE_PRICE = 2200


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def main():
    db = SessionLocal()

    category = (
        db.query(Category)
        .filter(Category.name == "Wash & Wear", Category.gender == Gender.men)
        .first()
    )
    if not category:
        print("Men > Wash & Wear category not found — run scripts.seed_sample_products first.")
        return

    created = 0
    skipped = 0
    for color in COLORS:
        name = f"Wash & Wear — {color}"
        existing = db.query(Product).filter(Product.name == name).first()
        if existing:
            skipped += 1
            continue

        image_url = f"/products/wash-n-wear/{slugify(color)}.jpg"
        product = Product(
            name=name,
            category_id=category.id,
            description="Unstitched 2-piece wash & wear — 4.25m fabric.",
            price=PRICE,
            sale_price=SALE_PRICE,
            on_sale=True,
            in_stock=True,
            image_urls=[image_url],
            featured=False,
        )
        db.add(product)
        created += 1

    db.commit()
    print(f"Created {created} products, skipped {skipped} already existing.")


if __name__ == "__main__":
    main()
