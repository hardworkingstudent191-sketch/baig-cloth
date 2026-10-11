"""Enrich catalog-export.json with the v2 product fields -> catalog-export.v2.json

The v1 export (from Postgres) has name/price/images only. The new storefront
needs fabric, piece counts, per-piece meters, a colour swatch, and a "design
group" that links colour variants of the same design. This derives all of it
from what already exists:

- fabric / pieces / piece details: from the category and the name/description
  conventions of the current catalog ("Wash & Wear — <Colour>" = 2-piece
  wash & wear; women's categories = 3-piece suits);
- colour swatch hex: the dominant colour measured from the product photo
  itself (centre crop, quantized), so swatches match the real fabric;
- colour name: the part after the em dash in "Wash & Wear — Ash Grey";
- design group: every wash & wear colour belongs to "wash-and-wear-2-piece",
  so the product page can show all 27 colours as swatches.

Everything here is a sensible default the owner can edit in wp-admin.

    tools-venv/Scripts/python.exe wordpress/migration/enrich_catalog.py
    (needs Pillow; the photos are read from frontend/public/products)
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent / "catalog-export.json"
OUT = Path(__file__).resolve().parent / "catalog-export.v2.json"
PHOTOS = ROOT / "frontend" / "public"

FABRIC_BY_CATEGORY = {
    ("Lawn", "women"): "Lawn",
    ("Cotton", "women"): "Cotton",
    ("Embroidered", "women"): "Embroidered",
    ("Cotton", "men"): "Cotton",
    ("Wash & Wear", "men"): "Wash & Wear",
    ("Karandi", "men"): "Karandi",
}

CARE = {
    "Wash & Wear": "Machine wash cold on a gentle cycle. Do not bleach. Tumble dry low or line dry in shade. Warm iron if needed — the finish resists creasing.",
    "Lawn": "Hand wash or gentle machine wash in cold water, inside out. Do not bleach. Dry in shade to keep the print vivid. Iron on medium while slightly damp.",
    "Cotton": "Machine wash cold with similar colours. Do not bleach. Line dry. Iron on medium-high while slightly damp.",
    "Embroidered": "Dry clean recommended. If washing by hand, use cold water and mild detergent, turn inside out, never wring. Dry flat in shade. Iron inside out on low, avoiding the embroidery.",
    "Karandi": "Dry clean recommended. Hand wash cold if needed; do not wring. Dry in shade. Iron on medium with a pressing cloth.",
}


def dominant_hex(path: Path) -> str | None:
    """Dominant colour of the centre of the photo, as #rrggbb."""
    try:
        im = Image.open(path).convert("RGB")
    except Exception:
        return None
    w, h = im.size
    crop = im.crop((int(w * 0.25), int(h * 0.25), int(w * 0.75), int(h * 0.75))).resize((160, 160))
    q = crop.quantize(colors=5, method=Image.Quantize.MEDIANCUT)
    palette = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)  # [(count, index), ...]
    idx = counts[0][1]
    r, g, b = palette[idx * 3 : idx * 3 + 3]
    return f"#{r:02x}{g:02x}{b:02x}"


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    cat_by_id = {c["id"]: c for c in data["categories"]}
    missing_photos = 0

    for p in data["products"]:
        cat = cat_by_id[p["category_id"]]
        fabric = FABRIC_BY_CATEGORY.get((cat["name"], cat["gender"]), cat["name"])
        p["fabric"] = fabric
        p["sku"] = f"BC-{p['id']:04d}"

        m = re.match(r"^(.*?)\s+[—–-]\s+(.+)$", p["name"])
        if cat["gender"] == "men" and m:
            # "Wash & Wear — Ash Grey": a colour variant of one 2-piece design.
            p["color"] = m.group(2).strip()
            p["design_group"] = re.sub(r"[^a-z0-9]+", "-", m.group(1).lower()).strip("-") + "-2-piece"
            p["pieces"] = 2
            p["piece_details"] = [{"name": "Shirt", "meters": "2.5"}, {"name": "Shalwar", "meters": "2.5"}]
            if "4.25" in (p.get("description") or ""):
                p["piece_details"] = [{"name": "Full suit length", "meters": "4.25"}]
        elif cat["gender"] == "men":
            p["color"] = ""
            p["design_group"] = ""
            p["pieces"] = 2
            p["piece_details"] = [{"name": "Shirt", "meters": "2.5"}, {"name": "Shalwar", "meters": "2.5"}]
        else:
            p["color"] = ""
            p["design_group"] = ""
            p["pieces"] = 3
            p["piece_details"] = [
                {"name": "Shirt", "meters": "3"},
                {"name": "Trouser", "meters": "2.5"},
                {"name": "Dupatta", "meters": "2.5"},
            ]

        p["color_hex"] = ""
        if p["image_urls"]:
            photo = PHOTOS / p["image_urls"][0].lstrip("/")
            if photo.exists():
                p["color_hex"] = dominant_hex(photo) or ""
            else:
                missing_photos += 1

        p["care"] = CARE.get(fabric, "")
        p["details"] = [{"label": "Fabric", "value": fabric}, {"label": "Pieces", "value": f"{p['pieces']}-piece unstitched"}]
        if cat["gender"] == "women" and "Embroidered" in fabric:
            p["details"].append({"label": "Work", "value": "Embroidered"})
        p["collections"] = []

    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    ww = [p for p in data["products"] if p["design_group"]]
    print(f"Wrote {OUT.name}: {len(data['products'])} products, {len(ww)} in design group(s) {sorted({p['design_group'] for p in ww})}, "
          f"{sum(1 for p in data['products'] if p['color_hex'])} with measured swatch colour, {missing_photos} photos missing")
    for p in ww[:6]:
        print(f"  {p['name']:<32} {p['color']:<18} {p['color_hex']}")


if __name__ == "__main__":
    sys.exit(main())
