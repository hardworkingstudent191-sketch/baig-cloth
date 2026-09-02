from app.cloudinary_utils import _optimize_delivery_url


def test_optimize_delivery_url_inserts_f_auto_q_auto():
    raw = "https://res.cloudinary.com/demo/image/upload/v1234567890/baig-cloth/products/abc123.jpg"
    optimized = _optimize_delivery_url(raw)
    assert optimized == "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1234567890/baig-cloth/products/abc123.jpg"


def test_optimize_delivery_url_only_replaces_first_occurrence():
    # A public_id could theoretically contain the literal string "/upload/"
    # (folder names are only lightly restricted) — only the real delivery
    # path segment should ever get the transformation inserted.
    raw = "https://res.cloudinary.com/demo/image/upload/v1/folder/upload/thing.jpg"
    optimized = _optimize_delivery_url(raw)
    assert optimized == "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/folder/upload/thing.jpg"
