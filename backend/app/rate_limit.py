import time
from collections import defaultdict

from fastapi import HTTPException, Request

# In-memory sliding-window rate limiter. This app runs as a single process
# on a small deployment (no Redis/shared store), so an in-memory dict is a
# reasonable, honest fit for its actual scale — it resets on restart and
# wouldn't coordinate across multiple processes, which is fine here since
# there's only ever one. The goal isn't to be bulletproof against a
# distributed attacker; it's to close the current gap, where a script could
# try passwords against /admin/login as fast as the network allows with
# nothing to slow it down.
WINDOW_SECONDS = 15 * 60
MAX_ATTEMPTS = 5

# Public GET endpoints (product/category listing) had nothing slowing down a
# script hitting them as fast as the network allows — fine for a real
# visitor's browser, which fires only a handful of requests per page, but
# open to scraping the whole catalog or running up hosting costs. This is a
# much looser window than login: high enough that no real visitor should
# ever notice it, low enough to blunt sustained automated scraping.
GENERAL_WINDOW_SECONDS = 60
GENERAL_MAX_REQUESTS = 120

_attempts: dict[str, list[float]] = defaultdict(list)
_general_requests: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    # Prefer X-Forwarded-For when present (this app is expected to run
    # behind a platform's proxy, e.g. Koyeb), falling back to the direct
    # connection for local dev.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_login_rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    now = time.time()

    attempts = [t for t in _attempts[ip] if now - t < WINDOW_SECONDS]
    if len(attempts) >= MAX_ATTEMPTS:
        retry_after = int(WINDOW_SECONDS - (now - attempts[0]))
        raise HTTPException(
            status_code=429,
            detail=f"Too many login attempts. Try again in {max(retry_after // 60, 1)} minute(s).",
            headers={"Retry-After": str(max(retry_after, 1))},
        )

    attempts.append(now)
    _attempts[ip] = attempts


def enforce_general_rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    now = time.time()

    requests_ = [t for t in _general_requests[ip] if now - t < GENERAL_WINDOW_SECONDS]
    if len(requests_) >= GENERAL_MAX_REQUESTS:
        retry_after = int(GENERAL_WINDOW_SECONDS - (now - requests_[0]))
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down and try again shortly.",
            headers={"Retry-After": str(max(retry_after, 1))},
        )

    requests_.append(now)
    _general_requests[ip] = requests_
