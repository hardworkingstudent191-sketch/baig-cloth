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

_attempts: dict[str, list[float]] = defaultdict(list)


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
