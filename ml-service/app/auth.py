from functools import wraps
from typing import Callable, Tuple
from datetime import datetime, timezone

from flask import current_app, jsonify, request, g


def _error(code: str, message: str, details=None, status: int = 401):
    return (
        jsonify(
            {
                "error": {"code": code, "message": message, "details": details or {}},
                "meta": {
                    "correlation_id": getattr(g, "correlation_id", None),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            }
        ),
        status,
    )


def require_internal_auth(fn: Callable):
    """
    Decorator enforcing internal token auth via X-Internal-Token header.
    - 401 AUTH_REQUIRED if header missing
    - 403 UNAUTHORIZED_INTERNAL if token invalid
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("X-Internal-Token")
        if not header:
            return _error("AUTH_REQUIRED", "X-Internal-Token header required", status=401)
        expected = current_app.config.get("ML_INTERNAL_TOKEN")
        if not expected or header != expected:
            return _error("UNAUTHORIZED_INTERNAL", "Invalid internal token", status=403)
        return fn(*args, **kwargs)

    return wrapper