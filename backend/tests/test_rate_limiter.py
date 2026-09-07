"""
The rate limiter's two failure modes from the audit, pinned down:

1. It keyed on the *first* X-Forwarded-For entry — which the client writes —
   so a fresh spoofed header per request bypassed the login limiter entirely.
2. Buckets were never removed, so the store grew with every distinct client
   (or spoofed header) it ever saw.
"""

import app.rate_limit as rate_limit
from app.config import settings
from app.rate_limit import SlidingWindowLimiter, MAX_KEYS


LOGIN = {"username": "nobody", "password": "wrong"}


# ---- Header trust ----

def test_spoofed_forwarded_for_cannot_bypass_login_limiter(client, monkeypatch):
    # One trusted proxy in front (the production shape). The attacker puts a
    # different fake address first on every request; the proxy would append
    # the real peer last. We simulate exactly that header shape.
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    statuses = []
    for i in range(6):
        res = client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": f"10.0.0.{i}, 203.0.113.9"})
        statuses.append(res.status_code)
    assert statuses[:5] == [401] * 5
    assert statuses[5] == 429


def test_with_no_proxy_forwarded_for_is_ignored_entirely(client, monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 0)
    for i in range(5):
        client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": f"10.0.0.{i}"})
    res = client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": "10.0.0.99"})
    assert res.status_code == 429


def test_distinct_real_clients_behind_proxy_get_separate_buckets(client, monkeypatch):
    # The fix must not collapse everyone behind the proxy into one bucket.
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    for _ in range(5):
        client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": "198.51.100.1"})
    blocked = client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": "198.51.100.1"})
    other = client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": "198.51.100.2"})
    assert blocked.status_code == 429
    assert other.status_code == 401


def test_malformed_forwarded_for_falls_back_to_peer(client, monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    junk = ["not-an-ip", "", "  ,  ,", "'; DROP TABLE x;--", "300.1.1.1"]
    for h in junk:
        client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": h})
    # All five resolved to the same (peer) bucket → the sixth is throttled,
    # and no junk keys were created.
    res = client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": "garbage"})
    assert res.status_code == 429
    assert all(k not in rate_limit._attempts for k in junk)


def test_fewer_entries_than_trusted_hops_is_not_trusted(client, monkeypatch):
    # Two trusted proxies configured but only one entry present: the header
    # didn't come through our chain, so it must be ignored — an attacker
    # can't pick their bucket by sending a short header.
    monkeypatch.setattr(settings, "trusted_proxy_hops", 2)
    for i in range(5):
        client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": f"10.0.0.{i}"})
    res = client.post("/admin/login", json=LOGIN, headers={"X-Forwarded-For": "10.0.0.99"})
    assert res.status_code == 429


# ---- Memory bounds (unit-level, no HTTP) ----

def test_stale_buckets_are_pruned():
    lim = SlidingWindowLimiter()
    t = 1_000_000.0
    for i in range(50):
        lim.hit(f"k{i}", window=60, limit=5, now=t)
    assert len(lim) == 50
    lim.prune(window=60, now=t + 61)
    assert len(lim) == 0


def test_prune_runs_automatically_during_traffic():
    lim = SlidingWindowLimiter()
    t = 1_000_000.0
    for i in range(100):
        lim.hit(f"old{i}", window=60, limit=5, now=t)
    # Well past the window; enough hits to cross PRUNE_EVERY.
    for i in range(rate_limit.PRUNE_EVERY + 5):
        lim.hit(f"new{i % 10}", window=60, limit=1000, now=t + 120)
    assert not any(k.startswith("old") for k in lim._buckets)
    assert len(lim) == 10


def test_store_is_bounded_under_key_rotation_attack():
    lim = SlidingWindowLimiter()
    t = 1_000_000.0
    # Attacker rotates through far more distinct keys than MAX_KEYS inside
    # one window — the store must still cap out.
    for i in range(MAX_KEYS + 5_000):
        lim.hit(f"attacker{i}", window=900, limit=5, now=t + i * 0.001)
    assert len(lim) <= MAX_KEYS


def test_legitimate_client_under_limit_is_never_blocked():
    lim = SlidingWindowLimiter()
    t = 1_000_000.0
    # 4 requests per 15-minute window, over ten windows: always allowed.
    for w in range(10):
        for _ in range(4):
            assert lim.hit("honest", window=900, limit=5, now=t + w * 900) is None


def test_lookup_does_not_create_keys():
    lim = SlidingWindowLimiter()
    assert len(lim) == 0
    lim.prune(window=60)
    assert "phantom" not in lim._buckets
