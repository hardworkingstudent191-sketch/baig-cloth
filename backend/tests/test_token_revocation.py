"""
JWT handling after the python-jose → PyJWT migration and the token_version
revocation mechanism. A password change must kill every previously issued
token immediately; everything else about tokens must stay strict.
"""

from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings

CURRENT = "correct-horse-battery-staple"
NEW = "brand-new-password-1"


def _mint(**claims) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": "test-admin", "ver": 0, "iat": now, "exp": now + timedelta(hours=1)}
    payload.update(claims)
    key = claims.pop("_key", settings.jwt_secret_key) if "_key" in claims else settings.jwt_secret_key
    alg = claims.pop("_alg", settings.jwt_algorithm) if "_alg" in claims else settings.jwt_algorithm
    payload.pop("_key", None)
    payload.pop("_alg", None)
    return jwt.encode(payload, key, algorithm=alg)


def test_old_token_is_rejected_after_password_change(client, admin_user, auth_headers, category):
    # Old token works before the change...
    assert client.get("/categories").status_code == 200
    probe = client.put(f"/categories/{category.id}", json={"name": "Renamed"}, headers=auth_headers)
    assert probe.status_code == 200

    res = client.put(
        "/admin/password",
        json={"current_password": CURRENT, "new_password": NEW},
        headers=auth_headers,
    )
    assert res.status_code == 200
    fresh = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # ...and is dead immediately afterwards, even though it hasn't expired.
    stale = client.put(f"/categories/{category.id}", json={"name": "Again"}, headers=auth_headers)
    assert stale.status_code == 401

    # The token returned by the change works, as does a brand-new login.
    assert client.put(f"/categories/{category.id}", json={"name": "Again"}, headers=fresh).status_code == 200
    login = client.post("/admin/login", json={"username": admin_user.username, "password": NEW})
    assert login.status_code == 200
    relogin = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert client.put(f"/categories/{category.id}", json={"name": "Third"}, headers=relogin).status_code == 200


def test_token_with_stale_version_claim_is_rejected(client, admin_user, category):
    admin_user.token_version = 3
    token = _mint(ver=2)
    res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_token_missing_version_claim_is_rejected(client, admin_user, category):
    now = datetime.now(timezone.utc)
    token = jwt.encode({"sub": "test-admin", "exp": now + timedelta(hours=1)}, settings.jwt_secret_key, algorithm="HS256")
    res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_expired_token_is_rejected(client, admin_user, category):
    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    token = _mint(exp=past)
    res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_wrong_key_is_rejected(client, admin_user, category):
    token = jwt.encode(
        {"sub": "test-admin", "ver": 0, "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "a-completely-different-secret-key-of-sufficient-length-0000",
        algorithm="HS256",
    )
    res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_alg_none_is_rejected(client, admin_user, category):
    # Hand-built unsigned token with alg "none". PyJWT's explicit algorithms
    # allow-list must refuse it regardless of the payload.
    import base64, json
    def b64(d): return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()
    exp = int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
    token = f"{b64({'alg': 'none', 'typ': 'JWT'})}.{b64({'sub': 'test-admin', 'ver': 0, 'exp': exp})}."
    res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_malformed_tokens_are_rejected(client, admin_user, category):
    for bad in ["", "abc", "a.b", "a.b.c", "Bearer", "eyJ.eyJ.sig", "e30.e30.", "%%%.%%%.%%%"]:
        res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {bad}"})
        assert res.status_code == 401, bad


def test_version_claim_must_be_an_integer(client, admin_user, category):
    token = _mint(ver="0")
    res = client.put(f"/categories/{category.id}", json={"name": "x"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_passlib_era_bcrypt_hash_still_verifies():
    # A hash produced by the previous passlib layer ($2b$12$…) must keep
    # working — no forced password reset for the existing admin.
    from app.auth import verify_password, hash_password
    import bcrypt
    legacy = bcrypt.hashpw(b"legacy-password", bcrypt.gensalt(rounds=12)).decode()
    assert legacy.startswith("$2b$12$")
    assert verify_password("legacy-password", legacy)
    assert not verify_password("wrong", legacy)
    assert verify_password("x" * 100, hash_password("x" * 100))  # 72-byte truncation preserved
    assert not verify_password("anything", "not-a-hash")


def test_new_password_over_72_bytes_is_rejected(client, auth_headers):
    res = client.put(
        "/admin/password",
        json={"current_password": CURRENT, "new_password": "p" * 73},
        headers=auth_headers,
    )
    assert res.status_code == 422
