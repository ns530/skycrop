import logging
import sys
import time
import uuid
from typing import Optional

from flask import request, g
from pythonjsonlogger import jsonlogger


def _build_json_formatter() -> logging.Formatter:
    fmt = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s",
        rename_fields={
            "asctime": "ts",
            "levelname": "level",
            "name": "logger",
            "message": "msg",
        },
    )
    return fmt


def init_app_logging(app) -> None:
    """
    Initialize structured JSON logging with correlation_id.
    Attaches before_request/after_request hooks to capture latency and status.
    """
    log_level = getattr(logging, str(app.config.get("LOG_LEVEL", "INFO")).upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_build_json_formatter())

    root = logging.getLogger()
    for h in list(root.handlers):
        root.removeHandler(h)
    root.addHandler(handler)
    root.setLevel(log_level)

    app.logger.handlers = []
    app.logger.propagate = True
    app.logger.setLevel(log_level)

    @app.before_request
    def _start_timer():
        g._start_time = time.time()
        # correlation id from header or new
        cid = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        g.correlation_id = cid

    @app.after_request
    def _log_after(resp):
        try:
            latency_ms = int((time.time() - getattr(g, "_start_time", time.time())) * 1000)
        except Exception:
            latency_ms = -1
        route = (request.url_rule.rule if request.url_rule else request.path) or "-"
        model_version = request.headers.get("X-Model-Version")
        record = {
            "route": route,
            "method": request.method,
            "status": resp.status_code,
            "latency_ms": latency_ms,
            "correlation_id": getattr(g, "correlation_id", None),
            "cache_hit": False,  # stub path always false in Sprint 2
            "model_version": model_version,
        }
        # Allow handlers to inject extra structured fields (e.g., record_count, event)
        try:
            extras = getattr(g, "log_extras", None)
            if isinstance(extras, dict):
                record.update(extras)
        except Exception:
            pass

        logging.getLogger("ml-service").info("request", extra=record)

        # echo correlation id
        if getattr(g, "correlation_id", None):
            resp.headers["X-Request-Id"] = g.correlation_id
        # If present, echo the effective model version
        if getattr(g, "effective_model_version", None):
            resp.headers["X-Model-Version"] = g.effective_model_version
        return resp


def get_correlation_id() -> Optional[str]:
    try:
        return getattr(g, "correlation_id", None)
    except Exception:
        return None