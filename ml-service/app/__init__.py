import os
import time
import traceback
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from flask import Flask, jsonify

from .config import load_config
from .logging import init_app_logging
from .version import NAME as MODEL_NAME, VERSION as MODEL_VERSION


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _error_body(code: str, message: str, details: Optional[Dict[str, Any]] = None, correlation_id: Optional[str] = None) -> Dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
        "meta": {
            "correlation_id": correlation_id,
            "timestamp": _now_iso(),
        },
    }


def create_app(config_overrides: Optional[dict] = None) -> Flask:
    """
    Flask application factory.
    - Loads config from env (with optional overrides)
    - Initializes structured logging with correlation_id support
    - Registers API blueprint
    - Sets MAX_CONTENT_LENGTH enforcement
    """
    cfg = load_config(config_overrides)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root at ml-service/
    static_folder = os.path.join(base_dir, cfg.STATIC_FOLDER)

    app = Flask(
        __name__,
        static_folder=static_folder,
        static_url_path="/static",
    )

    # Apply config
    app.config["ML_PORT"] = cfg.ML_PORT
    app.config["ML_INTERNAL_TOKEN"] = cfg.ML_INTERNAL_TOKEN
    app.config["MODEL_NAME"] = cfg.MODEL_NAME or MODEL_NAME
    app.config["UNET_DEFAULT_VERSION"] = cfg.UNET_DEFAULT_VERSION or MODEL_VERSION
    app.config["REQUEST_TIMEOUT_S"] = cfg.REQUEST_TIMEOUT_S
    app.config["MAX_CONTENT_LENGTH"] = cfg.MAX_CONTENT_LENGTH
    app.config["STATIC_FOLDER"] = static_folder
    app.config["MASKS_SUBDIR"] = cfg.MASKS_SUBDIR
    app.config["FIELD_RESOLVER_URL"] = cfg.FIELD_RESOLVER_URL
    app.config["LOG_LEVEL"] = cfg.LOG_LEVEL
    app.config["LOG_JSON"] = cfg.LOG_JSON
    app.config["ENABLE_TEST_HOOKS"] = cfg.ENABLE_TEST_HOOKS
    app.config["SERVICE_START_TIME"] = cfg.START_TIME

    # Sprint 3 additions (Yield RF + Disaster Analysis)
    app.config["ML_YIELD_MODEL_PATH"] = getattr(cfg, "ML_YIELD_MODEL_PATH", "ml-training/models/yield_rf/1.0.0/model.onnx")
    app.config["DISASTER_PRE_DAYS"] = getattr(cfg, "DISASTER_PRE_DAYS", 14)
    app.config["DISASTER_POST_DAYS"] = getattr(cfg, "DISASTER_POST_DAYS", 7)
    # Parsed dict of thresholds
    app.config["DISASTER_THRESHOLDS"] = getattr(cfg, "DISASTER_THRESHOLDS", {})

    # Ensure static/masks directory exists
    masks_dir = os.path.join(static_folder, cfg.MASKS_SUBDIR)
    os.makedirs(masks_dir, exist_ok=True)

    # Init logging
    init_app_logging(app)

    # Register API blueprint
    from .api import api_bp  # local import to avoid circulars

    app.register_blueprint(api_bp)

    # Error handlers mapping to canonical schema
    @app.errorhandler(413)
    def _handle_too_large(e):
        from flask import g

        return (
            jsonify(
                _error_body(
                    "INVALID_INPUT",
                    "Payload too large",
                    {"max_mb": cfg.MAX_PAYLOAD_MB},
                    getattr(g, "correlation_id", None),
                )
            ),
            413,
        )

    @app.errorhandler(404)
    def _handle_404(e):
        from flask import g

        return jsonify(_error_body("NOT_FOUND", "Resource not found", {}, getattr(g, "correlation_id", None))), 404

    @app.errorhandler(Exception)
    def _handle_exception(e):
        from flask import g, current_app

        current_app.logger.exception("Unhandled exception")
        details = {"trace": traceback.format_exc(limit=1)}
        return jsonify(_error_body("UPSTREAM_ERROR", "Internal server error", details, getattr(g, "correlation_id", None))), 500

    return app


# WSGI compatibility export (optional convenience)
app = create_app()