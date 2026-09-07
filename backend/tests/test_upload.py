"""
/admin/upload-image is the one endpoint that accepts a body of arbitrary
bytes. Filename, extension and Content-Type are never trusted; only the
decoded image format is. Nothing is written to disk, so there is no
traversal surface — these tests pin down the size cap, the format check,
and that hostile filenames change nothing.
"""

import io

import pytest
from PIL import Image

from app.routers import admin as admin_router


def _png_bytes(size=(8, 8)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", size, (200, 30, 30)).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture()
def fake_cloudinary(monkeypatch):
    calls = []
    def _fake(contents: bytes, folder: str = "x"):
        calls.append(len(contents))
        return "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/baig-cloth/products/ok.png"
    monkeypatch.setattr(admin_router, "upload_image", _fake)
    return calls


def test_valid_png_is_accepted_regardless_of_filename(client, auth_headers, fake_cloudinary):
    hostile = ["../../etc/passwd.png", "..\\..\\win.ini", "shell.php.png", "a" * 300 + ".png", "\x00.png"]
    for name in hostile:
        res = client.post("/admin/upload-image", files={"file": (name, _png_bytes(), "image/png")}, headers=auth_headers)
        assert res.status_code == 200, (name, res.text)
        assert res.json()["url"].startswith("https://res.cloudinary.com/")
    assert len(fake_cloudinary) == len(hostile)


def test_content_type_is_not_trusted(client, auth_headers, fake_cloudinary):
    # Real PNG labelled as PDF → accepted (bytes decide). Text labelled as
    # PNG → rejected (bytes decide).
    ok = client.post("/admin/upload-image", files={"file": ("x.pdf", _png_bytes(), "application/pdf")}, headers=auth_headers)
    assert ok.status_code == 200
    bad = client.post("/admin/upload-image", files={"file": ("x.png", b"<?php system($_GET['c']); ?>", "image/png")}, headers=auth_headers)
    assert bad.status_code == 400
    assert len(fake_cloudinary) == 1


def test_disallowed_image_formats_are_rejected(client, auth_headers, fake_cloudinary):
    buf = io.BytesIO(); Image.new("RGB", (4, 4)).save(buf, format="GIF")
    res = client.post("/admin/upload-image", files={"file": ("x.gif", buf.getvalue(), "image/gif")}, headers=auth_headers)
    assert res.status_code == 400
    buf = io.BytesIO(); Image.new("RGB", (4, 4)).save(buf, format="BMP")
    res = client.post("/admin/upload-image", files={"file": ("x.bmp", buf.getvalue(), "image/bmp")}, headers=auth_headers)
    assert res.status_code == 400
    assert fake_cloudinary == []


def test_oversized_upload_is_rejected_without_reaching_cloudinary(client, auth_headers, fake_cloudinary, monkeypatch):
    # Shrink the cap so the test doesn't have to build 8MB of bytes.
    monkeypatch.setattr(admin_router, "MAX_UPLOAD_BYTES", 2048)
    # Solid-colour PNGs compress to almost nothing; noise does not.
    import os
    noisy = Image.frombytes("RGB", (64, 64), os.urandom(64 * 64 * 3))
    buf = io.BytesIO(); noisy.save(buf, format="PNG"); big = buf.getvalue()
    assert len(big) > 2048
    res = client.post("/admin/upload-image", files={"file": ("big.png", big, "image/png")}, headers=auth_headers)
    assert res.status_code == 413
    assert fake_cloudinary == []


def test_empty_upload_is_rejected(client, auth_headers, fake_cloudinary):
    res = client.post("/admin/upload-image", files={"file": ("empty.png", b"", "image/png")}, headers=auth_headers)
    assert res.status_code == 400
    assert fake_cloudinary == []


def test_truncated_image_is_rejected(client, auth_headers, fake_cloudinary):
    res = client.post("/admin/upload-image", files={"file": ("cut.png", _png_bytes()[:40], "image/png")}, headers=auth_headers)
    assert res.status_code == 400
    assert fake_cloudinary == []


def test_upload_requires_auth_even_with_valid_image(client, fake_cloudinary):
    res = client.post("/admin/upload-image", files={"file": ("x.png", _png_bytes(), "image/png")})
    assert res.status_code == 401
    assert fake_cloudinary == []
