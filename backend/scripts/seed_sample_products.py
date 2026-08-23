"""
Run once to populate categories + sample products, using this repo's own
generated placeholder swatches (frontend/public/placeholders/), e.g.:
    python -m scripts.seed_sample_products

Safe to re-run: it will skip entirely if any product already exists,
so it won't duplicate data or overwrite real products you've since added.

This is TEST DATA ONLY. The images are deliberately abstract on-brand
swatches, not photos — using AI-generated "product photos" here would risk
a customer ordering based on an image that doesn't match what they'd
actually receive. Replace both the entries and the images with real
photography before launch (see Phase 4 in docs/todo.md).
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal, Base, engine
from app.models import Category, Product, Gender

# Root-relative paths into frontend/public/placeholders/ — served from the
# same origin as the rest of the site, so these work in dev and prod alike
# without depending on any external image host being reachable.
PLACEHOLDER_BY_CATEGORY = {
    ("Lawn", Gender.women): "/placeholders/women-lawn.png",
    ("Cotton", Gender.women): "/placeholders/women-cotton.png",
    ("Embroidered", Gender.women): "/placeholders/women-embroidered.png",
    ("Cotton", Gender.men): "/placeholders/men-cotton.png",
    ("Wash & Wear", Gender.men): "/placeholders/men-wash-and-wear.png",
    ("Karandi", Gender.men): "/placeholders/men-karandi.png",
}


def placeholder_for(category_name: str, gender: Gender) -> str:
    return PLACEHOLDER_BY_CATEGORY[(category_name, gender)]


CATEGORIES = [
    ("Lawn", Gender.women, 0),
    ("Cotton", Gender.women, 1),
    ("Embroidered", Gender.women, 2),
    ("Cotton", Gender.men, 0),
    ("Wash & Wear", Gender.men, 1),
    ("Karandi", Gender.men, 2),
]

# (name, gender, category_name, price, sale_price, on_sale, featured, in_stock, description)
PRODUCTS = [
    ("Rose Vale Lawn – 3pc", Gender.women, "Lawn", 2450, 1950, True, True, True,
     "Unstitched 3-piece lawn suit — 3.5m shirt, 2.5m trouser, 2m dupatta."),
    ("Marigold Cotton Suit", Gender.women, "Cotton", 1850, None, False, False, True,
     "Unstitched 2-piece cotton suit — 3m shirt, 2.5m trouser."),
    ("Noor Embroidered Lawn", Gender.women, "Embroidered", 3600, 2999, True, False, True,
     "Unstitched 3-piece embroidered lawn — 3.5m shirt, 2.5m trouser, 2.5m net dupatta."),
    ("Zaviyar Printed Lawn", Gender.women, "Lawn", 2100, None, False, True, True,
     "Unstitched 3-piece printed lawn — 3.5m shirt, 2.5m trouser, 2m dupatta."),
    ("Anaya Cotton Karandi", Gender.women, "Cotton", 2250, None, False, False, True,
     "Unstitched 2-piece cotton karandi — 3m shirt, 2.5m trouser."),
    ("Aabroo Embroidered 3pc", Gender.women, "Embroidered", 4200, 3550, True, True, True,
     "Unstitched 3-piece heavy embroidered suit — 3.5m shirt, 2.5m trouser, 2.5m dupatta."),
    ("Simsim Lawn Suit", Gender.women, "Lawn", 1975, None, False, False, True,
     "Unstitched 3-piece lawn suit — 3.25m shirt, 2.5m trouser, 2m dupatta."),
    ("Farasha Cotton Print", Gender.women, "Cotton", 1650, 1350, True, False, True,
     "Unstitched 2-piece printed cotton — 3m shirt, 2.5m trouser."),
    ("Meraaj Chikankari Lawn", Gender.women, "Embroidered", 3850, None, False, False, True,
     "Unstitched 3-piece chikankari lawn — 3.5m shirt, 2.5m trouser, 2.5m dupatta."),
    ("Sable Cotton Solid", Gender.women, "Cotton", 1400, None, False, False, False,
     "Unstitched 2-piece solid cotton — 3m shirt, 2.5m trouser."),
    ("Charcoal Wash & Wear 2pc", Gender.men, "Wash & Wear", 2800, None, False, True, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric."),
    ("Slate Karandi Suit", Gender.men, "Karandi", 3200, 2650, True, False, True,
     "Unstitched 2-piece karandi — 4.25m fabric."),
    ("Ivory Cotton Unstitched", Gender.men, "Cotton", 1950, None, False, False, True,
     "Unstitched 2-piece cotton — 4.25m fabric."),
    ("Graphite Wash & Wear", Gender.men, "Wash & Wear", 2650, None, False, False, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric."),
    ("Steel Blue Karandi", Gender.men, "Karandi", 3400, 2900, True, True, True,
     "Unstitched 2-piece karandi — 4.25m fabric."),
    ("Sandstone Cotton 2pc", Gender.men, "Cotton", 1800, None, False, False, True,
     "Unstitched 2-piece cotton — 4.25m fabric."),
    ("Olive Wash & Wear Suit", Gender.men, "Wash & Wear", 2900, None, False, False, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric."),
    ("Midnight Karandi Classic", Gender.men, "Karandi", 3600, None, False, False, True,
     "Unstitched 2-piece karandi — 4.25m fabric."),
    ("Pearl Cotton Everyday", Gender.men, "Cotton", 1700, 1450, True, False, True,
     "Unstitched 2-piece cotton — 4.25m fabric."),
    ("Ash Grey Wash & Wear", Gender.men, "Wash & Wear", 2750, None, False, True, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric."),
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Product).first():
        print("Products already exist — skipping seed (safe re-run).")
        return

    cat_lookup = {}
    for name, gender, sort_order in CATEGORIES:
        existing = (
            db.query(Category)
            .filter(Category.name == name, Category.gender == gender)
            .first()
        )
        if existing:
            cat_lookup[(name, gender)] = existing
            continue
        cat = Category(name=name, gender=gender, sort_order=sort_order)
        db.add(cat)
        db.flush()
        cat_lookup[(name, gender)] = cat

    db.commit()
    print(f"Ensured {len(cat_lookup)} categories.")

    created = 0
    for (name, gender, cat_name, price, sale_price, on_sale, featured,
         in_stock, description) in PRODUCTS:
        category = cat_lookup[(cat_name, gender)]
        image_urls = [placeholder_for(cat_name, gender)]

        product = Product(
            name=name,
            category_id=category.id,
            description=description,
            price=price,
            sale_price=sale_price,
            on_sale=on_sale,
            in_stock=in_stock,
            image_urls=image_urls,
            featured=featured,
        )
        db.add(product)
        created += 1

    db.commit()
    print(f"Created {created} sample products across {len(CATEGORIES)} categories.")
    print("Reminder: these are placeholder swatches, not real photos — replace before launch.")


if __name__ == "__main__":
    main()
