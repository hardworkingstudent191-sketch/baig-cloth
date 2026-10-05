"""Contract-parity check: FastAPI backend vs WordPress plugin.

Fires the same request matrix at both backends, normalizes the differences
that are *expected* (different numeric ids, timezone representation of the
same instant), and reports every other difference field-by-field. Exit code
0 = full parity.

Usage:
    python parity_check.py --fastapi http://127.0.0.1:8000 --wp http://127.0.0.1:9400/wp-json/baig/v1
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

FAILURES = []


def fail(msg):
    FAILURES.append(msg)
    print(f"  FAIL  {msg}")


def ok(msg):
    print(f"  ok    {msg}")


def get(base, path, params=None):
    url = base.rstrip("/") + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = None
        return e.code, body


def norm_dt(value):
    """Same instant, any offset representation -> comparable value."""
    if value is None:
        return None
    try:
        return datetime.fromisoformat(value).timestamp()
    except ValueError:
        return f"UNPARSEABLE:{value}"


PRODUCT_FIELDS = [
    "name", "description", "price", "sale_price", "on_sale",
    "in_stock", "image_urls", "featured",
]


def norm_product(p, catmap):
    """catmap: this backend's category_id -> (name, gender) key."""
    out = {k: p.get(k) for k in PRODUCT_FIELDS}
    out["category"] = catmap.get(p.get("category_id"))
    out["sale_ends_at"] = norm_dt(p.get("sale_ends_at"))
    out["created_at"] = norm_dt(p.get("created_at"))
    return out


def diff_products(label, fa_list, wp_list, fa_catmap, wp_catmap, check_order=True):
    fa_names = [p["name"] for p in fa_list]
    wp_names = [p["name"] for p in wp_list]
    if sorted(fa_names) != sorted(wp_names):
        fail(f"{label}: result sets differ. only-fastapi={sorted(set(fa_names)-set(wp_names))} only-wp={sorted(set(wp_names)-set(fa_names))}")
        return
    if check_order and fa_names != wp_names:
        fail(f"{label}: same set, different ORDER.\n    fastapi: {fa_names[:8]}...\n    wp:      {wp_names[:8]}...")
        return
    wp_by_name = {p["name"]: p for p in wp_list}
    mismatched = 0
    for fp in fa_list:
        np_fa = norm_product(fp, fa_catmap)
        np_wp = norm_product(wp_by_name[fp["name"]], wp_catmap)
        for k in np_fa:
            if np_fa[k] != np_wp[k]:
                fail(f'{label}: "{fp["name"]}" field {k}: fastapi={np_fa[k]!r} wp={np_wp[k]!r}')
                mismatched += 1
    if not mismatched:
        ok(f"{label}: {len(fa_list)} products, every field matches")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fastapi", default="http://127.0.0.1:8000")
    ap.add_argument("--wp", default="http://127.0.0.1:9400/wp-json/baig/v1")
    args = ap.parse_args()

    print("== categories ==")
    s1, fa_cats = get(args.fastapi, "/categories")
    s2, wp_cats = get(args.wp, "/categories")
    if s1 != 200 or s2 != 200:
        fail(f"/categories status: fastapi={s1} wp={s2}")
        sys.exit(1)

    fa_catmap = {c["id"]: (c["name"], c["gender"]) for c in fa_cats}
    wp_catmap = {c["id"]: (c["name"], c["gender"]) for c in wp_cats}

    fa_seq = [(c["name"], c["gender"], c["sort_order"]) for c in fa_cats]
    wp_seq = [(c["name"], c["gender"], c["sort_order"]) for c in wp_cats]
    if sorted(fa_seq) != sorted(wp_seq):
        fail(f"category sets differ: fastapi={fa_seq} wp={wp_seq}")
    else:
        ok(f"category set matches ({len(fa_seq)} categories)")
    # FastAPI orders by sort_order only (ties by insertion); compare sort_order sequence.
    if [c["sort_order"] for c in fa_cats] != [c["sort_order"] for c in wp_cats]:
        fail("category sort_order ordering differs")
    else:
        ok("category ordering matches")

    for gender in ("men", "women"):
        _, fa_g = get(args.fastapi, "/categories", {"gender": gender})
        _, wp_g = get(args.wp, "/categories", {"gender": gender})
        fa_names = [(c["name"], c["sort_order"]) for c in fa_g]
        wp_names = [(c["name"], c["sort_order"]) for c in wp_g]
        if fa_names != wp_names:
            fail(f"/categories?gender={gender}: fastapi={fa_names} wp={wp_names}")
        else:
            ok(f"/categories?gender={gender} matches ({len(fa_names)})")

    print("== product listings ==")
    cases = [
        ("all", {}),
        ("gender=men", {"gender": "men"}),
        ("gender=women", {"gender": "women"}),
        ("on_sale=true", {"on_sale": "true"}),
        ("on_sale=false", {"on_sale": "false"}),
        ("featured=true", {"featured": "true"}),
        ("search=wash", {"search": "wash"}),
        ("search=ASH GREY (case-insensitive)", {"search": "ASH GREY"}),
        ("search=zzz-no-match", {"search": "zzz-no-match"}),
        ("page1 limit=60", {"limit": 60, "offset": 0}),
        ("page2 limit=60", {"limit": 60, "offset": 60}),
        ("limit=5 offset=3", {"limit": 5, "offset": 3}),
        ("combo women+on_sale", {"gender": "women", "on_sale": "true"}),
    ]
    for label, params in cases:
        s1, fa = get(args.fastapi, "/products", params)
        s2, wp = get(args.wp, "/products", params)
        if s1 != 200 or s2 != 200:
            fail(f"{label}: status fastapi={s1} wp={s2}")
            continue
        diff_products(label, fa, wp, fa_catmap, wp_catmap)

    # category_id filter: ids differ across backends, map via category key.
    wp_id_by_key = {v: k for k, v in wp_catmap.items()}
    for fa_id, key in fa_catmap.items():
        wp_id = wp_id_by_key.get(key)
        s1, fa = get(args.fastapi, "/products", {"category_id": fa_id})
        s2, wp = get(args.wp, "/products", {"category_id": wp_id})
        if s1 != 200 or s2 != 200:
            fail(f"category_id {key}: status fastapi={s1} wp={s2}")
            continue
        diff_products(f"category_id {key}", fa, wp, fa_catmap, wp_catmap)

    print("== single product ==")
    _, fa_all = get(args.fastapi, "/products", {"limit": 200})
    _, wp_all = get(args.wp, "/products", {"limit": 200})
    wp_id_by_name = {p["name"]: p["id"] for p in wp_all}
    for fp in fa_all[:5] + fa_all[-3:]:
        s2, wp_p = get(args.wp, f"/products/{wp_id_by_name[fp['name']]}")
        s1, fa_p = get(args.fastapi, f"/products/{fp['id']}")
        if s1 != 200 or s2 != 200:
            fail(f'single "{fp["name"]}": status fastapi={s1} wp={s2}')
            continue
        np_fa = norm_product(fa_p, fa_catmap)
        np_wp = norm_product(wp_p, wp_catmap)
        bad = [k for k in np_fa if np_fa[k] != np_wp[k]]
        if bad:
            for k in bad:
                fail(f'single "{fp["name"]}" field {k}: fastapi={np_fa[k]!r} wp={np_wp[k]!r}')
        else:
            ok(f'single "{fp["name"]}" matches')

    print("== error shapes ==")
    s1, b1 = get(args.fastapi, "/products/999999")
    s2, b2 = get(args.wp, "/products/999999")
    if s1 == s2 == 404 and isinstance(b1, dict) and isinstance(b2, dict) and b1.get("detail") == b2.get("detail") == "Product not found":
        ok("404 shape matches ({'detail': 'Product not found'})")
    else:
        fail(f"404 shape: fastapi={s1}:{b1} wp={s2}:{b2}")

    print()
    if FAILURES:
        print(f"PARITY FAILED: {len(FAILURES)} difference(s).")
        sys.exit(1)
    print("FULL PARITY: WordPress backend matches the FastAPI contract on every checked case.")


if __name__ == "__main__":
    main()
