import json
from typing import Any, Dict


def _post(client, url: str, json_body: Dict[str, Any], headers: Dict[str, str] | None = None):
    return client.post(url, json=json_body, headers=headers or {})


def test_model_version_header_precedence_over_body(client, auth_headers):
    headers = dict(auth_headers)
    headers["X-Request-Id"] = "cid-precedence-1"
    headers["X-Model-Version"] = "unet-1.0.0"
    body = {
        "bbox": [80.10, 7.20, 80.12, 7.22],
        "date": "2025-10-10",
        "model_version": "9.9.9",
        "return": "mask_url",
    }
    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert data["model"]["version"] == "1.0.0"
    assert resp.headers.get("X-Model-Version") == "unet-1.0.0"


def test_model_version_header_short_form(client, auth_headers):
    headers = dict(auth_headers)
    headers["X-Request-Id"] = "cid-precedence-2"
    headers["X-Model-Version"] = "1.0.0"
    body = {
        "bbox": [80.11, 7.21, 80.12, 7.22],
        "date": "2025-10-11",
        "model_version": "9.9.9",
        "return": "mask_url",
    }
    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert data["model"]["version"] == "1.0.0"
    assert resp.headers.get("X-Model-Version") == "1.0.0"


def test_correlation_id_propagates_in_error_meta(client, auth_headers):
    headers = dict(auth_headers)
    headers["X-Request-Id"] = "cid-error-1"
    headers["X-Model-Version"] = "unet-9.9.9"
    body = {"bbox": [80.1, 7.2, 80.2, 7.3], "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 404
    payload = resp.get_json()
    assert payload["error"]["code"] == "MODEL_NOT_FOUND"
    assert payload["meta"]["correlation_id"] == "cid-error-1"
    # header echo
    assert resp.headers.get("X-Request-Id") == "cid-error-1"


def test_payload_too_large_413_maps_to_invalid_input(client, auth_headers):
    headers = dict(auth_headers)
    headers["X-Request-Id"] = "cid-413-1"
    # ~11MB payload to exceed MAX_CONTENT_LENGTH (default is 10MB per config).
    # Important: send as raw data (not client.post(..., json=...)) so Flask/Werkzeug
    # triggers RequestEntityTooLarge (413) before view parsing.
    huge = "x" * (11 * 1024 * 1024)
    payload = {
        "bbox": [80.1, 7.2, 80.12, 7.22],
        "date": "2025-10-10",
        "blob": huge,
    }
    raw = json.dumps(payload)
    resp = client.post(
        "/v1/segmentation/predict",
        data=raw,
        headers=headers,
        content_type="application/json",
    )
    # Some Flask/Werkzeug versions enforce MAX_CONTENT_LENGTH only for non-JSON parsers.
    # Accept either 413 (preferred) or 400 (payload rejected by validation after parse),
    # but always assert canonical INVALID_INPUT mapping.
    assert resp.status_code in (400, 413)
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"


def test_413_error_handler_mapping_explicit(client, auth_headers):
    # Dynamically register a test-only route to trigger the 413 error handler
    from flask import abort
    app = client.application
    endpoint = "_test_too_large"
    if endpoint not in app.view_functions:
        app.add_url_rule("/_test/too_large", endpoint, lambda: abort(413), methods=["POST"])
    resp = client.post("/_test/too_large", headers=auth_headers, data=b"x", content_type="application/octet-stream")
    assert resp.status_code == 413
    payload = resp.get_json()
    assert payload["error"]["code"] == "INVALID_INPUT"