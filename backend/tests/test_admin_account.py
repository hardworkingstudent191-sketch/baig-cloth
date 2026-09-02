"""Covers PUT /admin/password — the only self-service account-recovery path
this single-admin app has (scripts/create_admin.py deliberately skips an
already-existing username rather than resetting it, so this endpoint is it)."""


def test_change_password_requires_auth(client):
    res = client.put("/admin/password", json={"current_password": "x", "new_password": "newpassword123"})
    assert res.status_code == 401


def test_change_password_rejects_wrong_current_password(client, auth_headers):
    res = client.put(
        "/admin/password",
        json={"current_password": "not-the-real-one", "new_password": "newpassword123"},
        headers=auth_headers,
    )
    assert res.status_code == 401


def test_change_password_rejects_short_new_password(client, auth_headers):
    res = client.put(
        "/admin/password",
        json={"current_password": "correct-horse-battery-staple", "new_password": "short"},
        headers=auth_headers,
    )
    assert res.status_code == 422


def test_change_password_success_and_old_password_stops_working(client, admin_user, auth_headers):
    res = client.put(
        "/admin/password",
        json={"current_password": "correct-horse-battery-staple", "new_password": "brand-new-password-1"},
        headers=auth_headers,
    )
    assert res.status_code == 204

    old_login = client.post(
        "/admin/login",
        json={"username": admin_user.username, "password": "correct-horse-battery-staple"},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/admin/login",
        json={"username": admin_user.username, "password": "brand-new-password-1"},
    )
    assert new_login.status_code == 200
