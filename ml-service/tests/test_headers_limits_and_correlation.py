import json
import time
import uuid
from typing import Any, Dict

from app import create_app  # [create_app()](ml-service/app/__init__.py:32)


def _post(client, url: str, json_body: Dict[str, Any] | None = None, headers: Dict[str, str] | None = None, data: bytes | str | None = None, content_type: str | None = None):
    if data is not None:
        return client.post(url, data=data, headers=headers or {}, content_type=content_type)
    return client.post(url, json=json_body, headers=headers or {})


def test_model_version_header_precedence_over_body(client, auth_headers):
    # Header has full "unet-1.0.0", body provides "1.0.0". Header must win and be echoed back.
    headers = dict(auth_headers)
    headers["X-Model-Version"] = "unet-1.0.0"

    body = {
        "bbox": [80.11, 7.21, 80.12, 7.22],
        "date": "2025-10-10",
        "return": "inline",
        "model_version": "1.0.0",
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()

    # Header echo should equal the exact header value passed (no normalization of header)
    assert resp.headers.get("X-Model-Version") == "unet-1.0.0"
    # The payload's model.version reflects the resolved token portion only ("1.0.0")
    assert data["model"]["version"] == "1.0.0"
    assert data["model"]["name"] == "unet"


def test_model_version_from_body_when_no_header(client, auth_headers):
    # No header; body carries "1.0.0". Response header should be "unet-1.0.0" and payload.version "1.0.0"
    headers = dict(auth_headers)

    body = {
        "bbox": [80.10, 7.20, 80.12, 7.22],
        "date": "2025-10-10",
        "return": "inline",
        "model_version": "1.0.0",
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()

    assert resp.headers.get("X-Model-Version") == "unet-1.0.0"
    assert data["model"]["version"] == "1.0.0"
    assert data["model"]["name"] == "unet"


def test_error_correlation_id_propagation_on_invalid_json(client, auth_headers):
    # Send invalid JSON so [predict()](ml-service/app/api.py:92) returns INVALID_INPUT via _error
    cid = str(uuid.uuid4())
    headers = dict(auth_headers)
    headers["X-Request-Id"] = cid

    # invalid JSON body triggers get_json(force=True) exception path
    resp = _post(client, "/v1/segmentation/predict", None, headers, data="{", content_type="application/json")
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["error"]["code"] == "INVALID_INPUT"
    # Header echo and meta.correlation_id must match request id (see [init_app_logging()](ml-service/app/logging.py:24))
    assert resp.headers.get("X-Request-Id") == cid
    assert "meta" in body and body["meta"]["correlation_id"] == cid


def test_payload_too_large_413_maps_invalid_input(tmp_path, internal_token):
    # Build an app instance with tiny MAX_CONTENT_LENGTH so even small payloads trigger 413
    static_dir = tmp_path / "static"
    static_dir.mkdir(parents=True, exist_ok=True)

    overrides = {
        "ML_PORT": 8001,
        "ML_INTERNAL_TOKEN": internal_token,
        "STATIC_FOLDER": str(static_dir),
        "REQUEST_TIMEOUT_S": 1,
        "MASKS_SUBDIR": "masks",
        "UNET_DEFAULT_VERSION": "1.0.0",
        "MODEL_NAME": "unet",
        "ENABLE_TEST_HOOKS": True,
        "LOG_LEVEL": "ERROR",
        # Force 413 for small payloads
        "MAX_CONTENT_LENGTH": 512,  # bytes
    }
    app = create_app(overrides)

    large_json = {
        "bbox": [80.1, 7.2, 80.2, 7.3],
        "date": "2025-10-10",
        # Padding to exceed MAX_CONTENT_LENGTH when encoded
        "padding": "x" * 4096,
    }
    raw = json.dumps(large_json)

    cid = str(uuid.uuid4())
    headers = {"X-Internal-Token": internal_token, "X-Request-Id": cid, "Content-Type": "application/json"}

    with app.test_client() as c:
        resp = c.post("/v1/segmentation/predict", data=raw, headers=headers, content_type="application/json")
        # Note: RequestEntityTooLarge (413) may be raised inside [predict()](ml-service/app/api.py:92) during get_json(force=True),
        # but the route catches generic exceptions and returns a 400 INVALID_INPUT. Accept either 413 (errorhandler path)
        # or 400 (route-level catch) while asserting canonical error code and correlation propagation.
        assert resp.status_code in (413, 400), resp.get_data(as_text=True)
        data = resp.get_json()
        assert data["error"]["code"] == "INVALID_INPUT"
        # When 413 handler is used, details include max_mb; when 400 path, details may be empty.
        assert isinstance(data["error"].get("details"), dict)
        # Correlation id echoed in header and meta
        assert resp.headers.get("X-Request-Id") == cid
        assert data["meta"]["correlation_id"] == cid


def test_performance_smoke_predict_inline_under_300ms(client, auth_headers):
    # Non-flaky performance smoke: with stub inference and no downstream calls, should be <= 300ms locally
    headers = dict(auth_headers)
    body = {
        "bbox": [80.11, 7.21, 80.12, 7.22],
        "date": "2025-10-10",
        "return": "inline",
    }

    t0 = time.time()
    resp = _post(client, "/v1/segmentation/predict", body, headers)
    elapsed_ms = (time.time() - t0) * 1000.0

    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert "metrics" in data and isinstance(data["metrics"]["latency_ms"], int)
    # Check both reported metric and wall-clock for sanity
    assert data["metrics"]["latency_ms"] <= 300
    assert elapsed_ms <= 300 + 50  # small margin to accommodate CI jitter


def test_header_normalization_when_body_provides_prefixed_version(client, auth_headers):
    # If body provides "unet-1.0.0" (prefixed), it should be accepted and echoed as-is in header
    headers = dict(auth_headers)
    body = {
        "bbox": [80.10, 7.20, 80.12, 7.22],
        "date": "2025-10-10",
        "return": "inline",
        "model_version": "unet-1.0.0",
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()

    # [\_resolve_effective_model_version()](ml-service/app/api.py:50) sets header to the provided prefixed value
    assert resp.headers.get("X-Model-Version") == "unet-1.0.0"
    assert data["model"]["version"] == "1.0.0"
    assert data["model"]["name"] == "unet"