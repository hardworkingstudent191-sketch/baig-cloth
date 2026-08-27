"""
One-time script: adds the 19 real women's suits (from actual shop photos)
as products, at Rs 4500, no discount.

Run from the backend directory with the venv active and the API running:
    python -m scripts.add_womens_suits
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models import Category, Product, Gender

PRICE = 4500

# (slug, display name, category name)
ITEMS = [
    ("steel-blue-eyelet", "Steel Blue Eyelet Embroidered", "Embroidered"),
    ("mint-net-floral-pearl", "Mint Net Floral Pearl", "Embroidered"),
    ("forest-gold-motif-print", "Forest Gold Motif Print", "Embroidered"),
    ("champagne-sequin-net", "Champagne Sequin Net", "Embroidered"),
    ("indigo-block-print", "Indigo Block Print", "Lawn"),
    ("black-sequin-lace", "Black Sequin Lace", "Embroidered"),
    ("citrine-floral-print-lawn", "Citrine Floral Print", "Lawn"),
    ("ivory-beaded-net", "Ivory Beaded Net", "Embroidered"),
    ("mustard-sequin-fan", "Mustard Sequin Fan", "Embroidered"),
    ("midnight-sequin-floral", "Midnight Sequin Floral", "Embroidered"),
    ("sage-floral-print-lawn", "Sage Floral Print", "Lawn"),
    ("olive-eyelet-embroidered", "Olive Eyelet Embroidered", "Embroidered"),
    ("charcoal-silver-embroidered", "Charcoal Silver Embroidered", "Embroidered"),
    ("teal-lace-printed-lawn", "Teal Lace Printed", "Lawn"),
    ("silver-leaf-sequin", "Silver Leaf Sequin", "Embroidered"),
    ("maroon-sequin-stripe", "Maroon Sequin Stripe", "Embroidered"),
    ("blush-floral-embroidered", "Blush Floral Embroidered", "Embroidered"),
    ("lavender-black-floral-sequin", "Lavender Black Floral Sequin", "Embroidered"),
    ("black-olive-3d-floral", "Black Olive 3D Floral", "Embroidered"),
]


def main():
    db = SessionLocal()

    categories = {}
    for cat_name in {"Lawn", "Embroidered"}:
        cat = (
            db.query(Category)
            .filter(Category.name == cat_name, Category.gender == Gender.women)
            .first()
        )
        if not cat:
            print(f"Women > {cat_name} category not found — run scripts.seed_sample_products first.")
            return
        categories[cat_name] = cat

    created = 0
    skipped = 0
    for slug, name, cat_name in ITEMS:
        existing = db.query(Product).filter(Product.name == name).first()
        if existing:
            skipped += 1
            continue

        image_url = f"/products/womens-suits/{slug}.jpg"
        product = Product(
            name=name,
            category_id=categories[cat_name].id,
            description="Unstitched 3-piece suit — shirt, trouser, dupatta.",
            price=PRICE,
            sale_price=None,
            on_sale=False,
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
