"""
Regression coverage for the security-critical paths: every write endpoint
must stay behind auth, a forged token must be rejected, the login rate
limiter must actually engage, and the response headers set in main.py must
actually be present. These are exactly the properties that are easy to
silently break in a future refactor (e.g. someone moves a route to a new
router and forgets `dependencies=[Depends(get_current_admin)]`) and hard to
notice by hand — nothing here changes behavior, it just pins it down.
"""

from datetime import datetime, timedelta, timezone


def _product_payload(category_id: int, **overrides):
    payload = {
        "name": "Test Fabric",
        "category_id": category_id,
        "description": "A test product.",
        "price": "1000.00",
        "in_stock": True,
        "image_urls": [],
        "featured": False,
    }
    payload.update(overrides)
    return payload


# ---- Public access ----

def test_public_products_list_requires_no_auth(client):
    res = client.get("/products")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_public_categories_list_requires_no_auth(client):
    res = client.get("/categories")
    assert res.status_code == 200


def test_get_missing_product_is_404_not_500(client):
    res = client.get("/products/999999")
    assert res.status_code == 404


# ---- Write endpoints reject unauthenticated requests ----

def test_create_product_without_token_is_401(client, category):
    res = client.post("/products", json=_product_payload(category.id))
    assert res.status_code == 401


def test_update_product_without_token_is_401(client):
    res = client.put("/products/1", json={"name": "New Name"})
    assert res.status_code == 401


def test_delete_product_without_token_is_401(client):
    res = client.delete("/products/1")
    assert res.status_code == 401


def test_create_category_without_token_is_401(client):
    res = client.post("/categories", json={"name": "X", "gender": "men", "sort_order": 0})
    assert res.status_code == 401


def test_upload_image_without_token_is_401(client):
    res = client.post("/admin/upload-image", files={"file": ("x.jpg", b"not-a-real-image", "image/jpeg")})
    assert res.status_code == 401


def test_forged_token_is_rejected(client):
    res = client.get(
        "/products",  # any endpoint works; use a protected one for a real check
    )
    assert res.status_code == 200  # sanity: public route still fine

    res = client.post(
        "/products",
        json=_product_payload(1),
        headers={"Authorization": "Bearer this-is-not-a-real-jwt"},
    )
    assert res.status_code == 401


# ---- Authenticated writes succeed and are validated ----

def test_create_product_with_valid_token_succeeds(client, auth_headers, category):
    res = client.post("/products", json=_product_payload(category.id), headers=auth_headers)
    assert res.status_code == 200, res.text
    assert res.json()["name"] == "Test Fabric"


def test_create_product_rejects_unknown_category(client, auth_headers):
    res = client.post("/products", json=_product_payload(999999), headers=auth_headers)
    assert res.status_code == 400


def test_sale_price_must_be_less_than_price(client, auth_headers, category):
    payload = _product_payload(category.id, on_sale=True, sale_price="1000.00", price="1000.00")
    res = client.post("/products", json=payload, headers=auth_headers)
    assert res.status_code == 422


def test_on_sale_requires_sale_price(client, auth_headers, category):
    payload = _product_payload(category.id, on_sale=True, sale_price=None)
    res = client.post("/products", json=payload, headers=auth_headers)
    assert res.status_code == 422


def test_negative_price_rejected(client, auth_headers, category):
    payload = _product_payload(category.id, price="-5.00")
    res = client.post("/products", json=payload, headers=auth_headers)
    assert res.status_code == 422


def test_upload_image_rejects_non_image_content(client, auth_headers):
    res = client.post(
        "/admin/upload-image",
        files={"file": ("fake.jpg", b"this is just text, not an image", "image/jpeg")},
        headers=auth_headers,
    )
    assert res.status_code == 400


# ---- Login rate limiting ----

def test_login_is_rate_limited_after_five_attempts(client, admin_user):
    for _ in range(5):
        res = client.post("/admin/login", json={"username": admin_user.username, "password": "wrong"})
        assert res.status_code == 401

    res = client.post("/admin/login", json={"username": admin_user.username, "password": "wrong"})
    assert res.status_code == 429
    assert "Retry-After" in res.headers


def test_login_rate_limit_also_blocks_correct_password(client, admin_user):
    # The limiter has to apply before credentials are checked — otherwise it
    # only ever throttles guessers who happen to be wrong, which is not the
    # attack it exists to slow down.
    for _ in range(5):
        client.post("/admin/login", json={"username": admin_user.username, "password": "wrong"})

    res = client.post(
        "/admin/login",
        json={"username": admin_user.username, "password": "correct-horse-battery-staple"},
    )
    assert res.status_code == 429


# ---- Response headers ----

def test_security_headers_present_on_every_response(client):
    res = client.get("/")
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in res.headers.get("permissions-policy", "")


# ---- Sale expiry (correctness, not auth — but easy to silently break) ----

def test_expired_sale_is_excluded_from_on_sale_filter(client, auth_headers, category):
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    payload = _product_payload(
        category.id,
        name="Expired Sale Item",
        on_sale=True,
        sale_price="500.00",
        price="1000.00",
        sale_ends_at=past,
    )
    created = client.post("/products", json=payload, headers=auth_headers)
    assert created.status_code == 200
    product_id = created.json()["id"]

    # The single-row read should report the sale as over...
    single = client.get(f"/products/{product_id}")
    assert single.json()["on_sale"] is False

    # ...and the list filter should agree, not just the single-row path.
    listing = client.get("/products", params={"on_sale": True})
    assert product_id not in [p["id"] for p in listing.json()]
