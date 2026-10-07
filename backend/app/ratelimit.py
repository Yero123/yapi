import time
from collections import defaultdict, deque
from typing import Annotated

from fastapi import Depends, Request

from app.errors import RateLimited

# In-memory, so limits are per process: the backend must run as a single instance.
_hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def get_client_ip(request: Request) -> str:
    # uvicorn runs with --proxy-headers, so this is the forwarded visitor address in production.
    return request.client.host if request.client else "unknown"


ClientIp = Annotated[str, Depends(get_client_ip)]


def check_ip_limit(scope: str, ip: str, limit: int, window_seconds: int, message: str) -> None:
    now = time.monotonic()
    for key in [k for k, stamps in _hits.items() if not stamps or now - stamps[-1] > window_seconds]:
        del _hits[key]
    stamps = _hits[(scope, ip)]
    while stamps and now - stamps[0] > window_seconds:
        stamps.popleft()
    if len(stamps) >= limit:
        raise RateLimited(message)
    stamps.append(now)


def reset() -> None:
    _hits.clear()
