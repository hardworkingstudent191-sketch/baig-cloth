import ipaddress
import time
from collections import deque

from fastapi import HTTPException, Request

from app.config import settings

# In-memory sliding-window rate limiter. This app runs as a single process
# on a small deployment (no Redis/shared store), so an in-memory store is a
# reasonable, honest fit for its actual scale — it resets on restart and
# wouldn't coordinate across multiple processes, which is fine here since
# there's only ever one. The goal isn't to be bulletproof against a
# distributed attacker; it's to make sure a script can't try passwords
# against /admin/login as fast as the network allows.
WINDOW_SECONDS = 15 * 60
MAX_ATTEMPTS = 5

# Public GET endpoints (product/category listing) get a much looser window:
# high enough that no real visitor should ever notice it, low enough to
# blunt sustained automated scraping or running up hosting costs.
GENERAL_WINDOW_SECONDS = 60
GENERAL_MAX_REQUESTS = 120

# Memory bounds. Buckets are swept for staleness every PRUNE_EVERY hits, and
# if an attacker rotates through more distinct client keys than MAX_KEYS
# inside a single window the oldest buckets are evicted regardless. Either
# way the store can never grow without limit — previously keys were created
# on every lookup (defaultdict) and never removed, so ordinary traffic alone
# would grow it forever, and a spoofed-header attack could grow it fast.
PRUNE_EVERY = 256
MAX_KEYS = 10_000


class SlidingWindowLimiter:
    """One limiter = one dict of per-client timestamp deques.

    `window` and `limit` are read on every call rather than stored so the
    module-level constants above stay the single source of truth (tests
    monkeypatch them).
    """

    def __init__(self) -> None:
        # A plain dict, deliberately not a defaultdict: looking up a key
        # must never create it.
        self._buckets: dict[str, deque[float]] = {}
        self._ops = 0

    def hit(self, key: str, *, window: float, limit: int, now: float | None = None) -> float | None:
        """Record one hit. Returns None if allowed, or the number of seconds
        until the oldest in-window hit expires if the client is over the limit."""
        now = time.time() if now is None else now
        self._ops += 1
        if self._ops >= PRUNE_EVERY or len(self._buckets) > MAX_KEYS:
            self.prune(window=window, now=now)

        bucket = self._buckets.get(key)
        if bucket is None:
            bucket = deque()
            self._buckets[key] = bucket
            if len(self._buckets) > MAX_KEYS:
                # A brand-new key pushed us over the cap (an attacker rotating
                # through addresses). Evict the least-recently-seen bucket now
                # rather than waiting for the next scheduled sweep.
                self.prune(window=window, now=now)

        cutoff = now - window
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= limit:
            return window - (now - bucket[0])

        bucket.append(now)
        return None

    def prune(self, *, window: float, now: float | None = None) -> None:
        """Drop every bucket whose newest hit is outside the window, then, if
        the store is still over MAX_KEYS, evict the least-recently-seen
        buckets until it isn't."""
        now = time.time() if now is None else now
        self._ops = 0
        cutoff = now - window
        stale = [k for k, b in self._buckets.items() if not b or b[-1] <= cutoff]
        for k in stale:
            del self._buckets[k]

        overflow = len(self._buckets) - MAX_KEYS
        if overflow > 0:
            by_last_seen = sorted(self._buckets.items(), key=lambda kv: kv[1][-1])
            for k, _ in by_last_seen[:overflow]:
                del self._buckets[k]

    def __len__(self) -> int:
        return len(self._buckets)


login_limiter = SlidingWindowLimiter()
general_limiter = SlidingWindowLimiter()

# Backwards-compatible handles: the test suite clears these between tests.
_attempts = login_limiter._buckets
_general_requests = general_limiter._buckets


def _client_ip(request: Request) -> str:
    """Resolve the real client address behind a known number of trusted
    reverse proxies.

    X-Forwarded-For is a comma-separated list that every proxy on the path
    *appends* to; whatever the client itself sends arrives first. Reading
    the first entry therefore trusts attacker-controlled input — a fresh
    random value per request gave a brand-new rate-limit bucket every time
    and the login limiter never engaged. The only entries that can be
    trusted are the ones written by proxies we control, which are the last
    TRUSTED_PROXY_HOPS entries. With one trusted proxy (Koyeb's edge in
    front of this app) the real client is the last entry; with two chained
    proxies it is the second-to-last, and so on.

    TRUSTED_PROXY_HOPS=0 means "no proxy, ignore the header entirely" — the
    right setting when the app is reachable directly, because then even the
    last entry is client-supplied.

    Anything that fails to parse as an IP address is ignored in favour of
    the socket peer, so a malformed header can neither bypass the limiter
    nor create junk keys.
    """
    peer = request.client.host if request.client else "unknown"
    hops = settings.trusted_proxy_hops
    if hops <= 0:
        return peer

    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return peer

    parts = [p.strip() for p in forwarded.split(",") if p.strip()]
    if len(parts) < hops:
        # Fewer entries than trusted proxies means the header didn't come
        # through our proxy chain intact — don't trust any of it.
        return peer

    candidate = parts[-hops]
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return peer


def _raise_429(detail: str, retry_after: float) -> None:
    seconds = max(int(retry_after), 1)
    raise HTTPException(
        status_code=429,
        detail=detail,
        headers={"Retry-After": str(seconds)},
    )


def enforce_login_rate_limit(request: Request) -> None:
    retry_after = login_limiter.hit(_client_ip(request), window=WINDOW_SECONDS, limit=MAX_ATTEMPTS)
    if retry_after is not None:
        _raise_429(
            f"Too many login attempts. Try again in {max(int(retry_after) // 60, 1)} minute(s).",
            retry_after,
        )


def enforce_general_rate_limit(request: Request) -> None:
    retry_after = general_limiter.hit(
        _client_ip(request), window=GENERAL_WINDOW_SECONDS, limit=GENERAL_MAX_REQUESTS
    )
    if retry_after is not None:
        _raise_429("Too many requests. Please slow down and try again shortly.", retry_after)
