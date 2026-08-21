"""
Run once to populate categories + sample products, using the free
placeholder images documented in docs/placeholder-images.md, e.g.:
    python -m scripts.seed_sample_products

Safe to re-run: it will skip entirely if any product already exists,
so it won't duplicate data or overwrite real products you've since added.

This is TEST DATA ONLY (per docs/placeholder-images.md) — replace with
real photography and real catalog entries before launch (see Phase 4
in docs/todo.md).
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal, Base, engine
from app.models import Category, Product, Gender

UNSPLASH_TEXTURE = (
    "https://images.unsplash.com/photo-1534639077088-d702bcf685e7"
    "?fm=jpg&q=80&w=1000&h=1250&fit=crop"
)


def picsum(seed: str) -> str:
    return f"https://picsum.photos/seed/{seed}/1000/1250"


CATEGORIES = [
    ("Lawn", Gender.women, 0),
    ("Cotton", Gender.women, 1),
    ("Embroidered", Gender.women, 2),
    ("Cotton", Gender.men, 0),
    ("Wash & Wear", Gender.men, 1),
    ("Karandi", Gender.men, 2),
]

# (name, gender, category_name, price, sale_price, on_sale, featured, in_stock, description, image seed)
PRODUCTS = [
    ("Rose Vale Lawn – 3pc", Gender.women, "Lawn", 2450, 1950, True, True, True,
     "Unstitched 3-piece lawn suit — 3.5m shirt, 2.5m trouser, 2m dupatta.", "baig-women-01"),
    ("Marigold Cotton Suit", Gender.women, "Cotton", 1850, None, False, False, True,
     "Unstitched 2-piece cotton suit — 3m shirt, 2.5m trouser.", "baig-women-02"),
    ("Noor Embroidered Lawn", Gender.women, "Embroidered", 3600, 2999, True, False, True,
     "Unstitched 3-piece embroidered lawn — 3.5m shirt, 2.5m trouser, 2.5m net dupatta.", "baig-women-03"),
    ("Zaviyar Printed Lawn", Gender.women, "Lawn", 2100, None, False, True, True,
     "Unstitched 3-piece printed lawn — 3.5m shirt, 2.5m trouser, 2m dupatta.", "baig-women-04"),
    ("Anaya Cotton Karandi", Gender.women, "Cotton", 2250, None, False, False, True,
     "Unstitched 2-piece cotton karandi — 3m shirt, 2.5m trouser.", "baig-women-05"),
    ("Aabroo Embroidered 3pc", Gender.women, "Embroidered", 4200, 3550, True, True, True,
     "Unstitched 3-piece heavy embroidered suit — 3.5m shirt, 2.5m trouser, 2.5m dupatta.", "baig-women-06"),
    ("Simsim Lawn Suit", Gender.women, "Lawn", 1975, None, False, False, True,
     "Unstitched 3-piece lawn suit — 3.25m shirt, 2.5m trouser, 2m dupatta.", "baig-women-07"),
    ("Farasha Cotton Print", Gender.women, "Cotton", 1650, 1350, True, False, True,
     "Unstitched 2-piece printed cotton — 3m shirt, 2.5m trouser.", "baig-women-08"),
    ("Meraaj Chikankari Lawn", Gender.women, "Embroidered", 3850, None, False, False, True,
     "Unstitched 3-piece chikankari lawn — 3.5m shirt, 2.5m trouser, 2.5m dupatta.", "baig-women-09"),
    ("Sable Cotton Solid", Gender.women, "Cotton", 1400, None, False, False, False,
     "Unstitched 2-piece solid cotton — 3m shirt, 2.5m trouser.", "baig-women-10"),
    ("Charcoal Wash & Wear 2pc", Gender.men, "Wash & Wear", 2800, None, False, True, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric.", "baig-men-01"),
    ("Slate Karandi Suit", Gender.men, "Karandi", 3200, 2650, True, False, True,
     "Unstitched 2-piece karandi — 4.25m fabric.", "baig-men-02"),
    ("Ivory Cotton Unstitched", Gender.men, "Cotton", 1950, None, False, False, True,
     "Unstitched 2-piece cotton — 4.25m fabric.", "baig-men-03"),
    ("Graphite Wash & Wear", Gender.men, "Wash & Wear", 2650, None, False, False, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric.", "baig-men-04"),
    ("Steel Blue Karandi", Gender.men, "Karandi", 3400, 2900, True, True, True,
     "Unstitched 2-piece karandi — 4.25m fabric.", "baig-men-05"),
    ("Sandstone Cotton 2pc", Gender.men, "Cotton", 1800, None, False, False, True,
     "Unstitched 2-piece cotton — 4.25m fabric.", "baig-men-06"),
    ("Olive Wash & Wear Suit", Gender.men, "Wash & Wear", 2900, None, False, False, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric.", "baig-men-07"),
    ("Midnight Karandi Classic", Gender.men, "Karandi", 3600, None, False, False, True,
     "Unstitched 2-piece karandi — 4.25m fabric.", "baig-men-08"),
    ("Pearl Cotton Everyday", Gender.men, "Cotton", 1700, 1450, True, False, True,
     "Unstitched 2-piece cotton — 4.25m fabric.", "baig-men-09"),
    ("Ash Grey Wash & Wear", Gender.men, "Wash & Wear", 2750, None, False, True, True,
     "Unstitched 2-piece wash & wear — 4.25m fabric.", "baig-men-10"),
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
         in_stock, description, seed) in PRODUCTS:
        category = cat_lookup[(cat_name, gender)]
        image_urls = [picsum(seed)]
        if seed == "baig-women-01":
            # one product gets a second image, to test the gallery/zoom UI
            image_urls.append(UNSPLASH_TEXTURE)

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
    print("Reminder: these are placeholder images only — replace before launch.")


if __name__ == "__main__":
    main()
