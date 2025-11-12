import base64
import json
import os
from typing import Any, Dict


def _post(client, url: str, json_body: Dict[str, Any], headers: Dict[str, str]):
    return client.post(url, json=json_body, headers=headers)


def test_predict_bbox_mask_url_persists_and_serves(client, auth_headers):
    req_id = "11111111-1111-4111-8111-111111111111"
    headers = dict(auth_headers)
    headers["X-Request-Id"] = req_id
    headers["X-Model-Version"] = "unet-1.0.0"

    body = {
        "bbox": [80.10, 7.20, 80.12, 7.22],
        "date": "2025-10-15",
        "return": "mask_url",
        "tiling": {"size": 512, "overlap": 64},
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert "request_id" in data and data["request_id"] == req_id
    assert "model" in data and data["model"]["name"] == "unet"
    assert data["model"]["version"] == "1.0.0"
    assert "mask_url" in data and data["mask_url"].startswith("/static/masks/")
    assert data["mask_format"] == "geojson"
    assert "metrics" in data and isinstance(data["metrics"]["latency_ms"], int)

    # Check headers echo
    assert resp.headers.get("X-Request-Id") == req_id
    assert resp.headers.get("X-Model-Version") == "unet-1.0.0"

    # Fetch the static file to ensure it exists and is served
    static_resp = client.get(data["mask_url"])
    assert static_resp.status_code == 200
    geojson_obj = json.loads(static_resp.get_data(as_text=True))
    assert geojson_obj["type"] == "FeatureCollection"

def test_predict_bbox_inline_returns_base64_geojson(client, auth_headers):
    headers = dict(auth_headers)
    headers["X-Model-Version"] = "unet-1.0.0"

    body = {
        "bbox": [80.11, 7.21, 80.12, 7.22],
        "date": "2025-10-10",
        "return": "inline",
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert "mask_base64" in data
    b = base64.b64decode(data["mask_base64"].encode("utf-8"))
    geo = json.loads(b.decode("utf-8"))
    assert geo["type"] == "FeatureCollection"
    assert data["mask_format"] == "geojson"
    # header echo should exist
    assert "X-Model-Version" in resp.headers