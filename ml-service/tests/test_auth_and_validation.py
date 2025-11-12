import json
from typing import Any, Dict


def _post(client, url: str, json_body: Dict[str, Any], headers: Dict[str, str] | None = None):
    return client.post(url, json=json_body, headers=headers or {})


def test_auth_missing_token_401(client):
    body = {"bbox": [80.1, 7.2, 80.12, 7.22], "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body)
    assert resp.status_code == 401
    data = resp.get_json()
    assert data["error"]["code"] == "AUTH_REQUIRED"


def test_auth_invalid_token_403(client):
    headers = {"X-Internal-Token": "wrong"}
    body = {"bbox": [80.1, 7.2, 80.12, 7.22], "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 403
    data = resp.get_json()
    assert data["error"]["code"] == "UNAUTHORIZED_INTERNAL"


def test_validation_bad_bbox_ranges_400(client, auth_headers):
    # lat out of range
    body = {"bbox": [80.1, -200.0, 80.2, 7.2], "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"


def test_validation_both_bbox_and_field_id_400(client, auth_headers):
    body = {"bbox": [80.1, 7.2, 80.2, 7.3], "field_id": "abc", "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"


def test_validation_neither_bbox_nor_field_id_400(client, auth_headers):
    body = {"date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"


def test_field_id_without_resolver_501(client, auth_headers):
    body = {"field_id": "00000000-0000-4000-8000-000000000000", "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, auth_headers)
    assert resp.status_code == 501
    data = resp.get_json()
    assert data["error"]["code"] in ("NOT_IMPLEMENTED",)


def test_model_not_found_404_header_override(client, auth_headers):
    headers = dict(auth_headers)
    headers["X-Model-Version"] = "unet-9.9.9"
    body = {"bbox": [80.1, 7.2, 80.2, 7.3], "date": "2025-10-10"}
    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"]["code"] == "MODEL_NOT_FOUND"


def test_timeout_simulated_504(client, auth_headers):
    # REQUEST_TIMEOUT_S set to 1s via conftest overrides; sleep_ms=2000 should trigger
    body = {
        "bbox": [80.1, 7.2, 80.2, 7.3],
        "date": "2025-10-10",
        "debug": {"sleep_ms": 2000},
    }
    resp = _post(client, "/v1/segmentation/predict", body, auth_headers)
    assert resp.status_code in (504, 408)
    data = resp.get_json()
    assert data["error"]["code"] == "TIMEOUT"