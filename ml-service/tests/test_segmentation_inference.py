import base64
import json
from typing import Any, Dict, List

import numpy as np


class _FakeOrtSession:
    def __init__(self):
        self.calls = 0

    class _IO:
        def __init__(self, name: str):
            self.name = name

    def get_inputs(self):
        return [self._IO("input")]

    def get_outputs(self):
        return [self._IO("output")]

    def run(self, outs, feeds):
        # feeds: dict {input_name: x}
        self.calls += 1
        x = list(feeds.values())[0]
        # Expect NHWC: (N, tile, tile, 3)
        N = int(x.shape[0])
        H = int(x.shape[1])
        W = int(x.shape[2])
        # Produce a deterministic probability map: center-high, edges-low
        yy, xx = np.meshgrid(np.linspace(-1, 1, H, dtype=np.float32), np.linspace(-1, 1, W, dtype=np.float32), indexing="ij")
        prob = np.clip(1.0 - (xx**2 + yy**2), 0.0, 1.0)
        out = np.repeat(prob[None, ...], N, axis=0)  # (N,H,W)
        return [out.astype(np.float32)]


def _patch_inference_and_monitor(monkeypatch):
    # Patch ORT loader to return our fake session and layout/providers
    import app.inference as inference

    fake = _FakeOrtSession()
    def _stub_loader():
        return fake, "input", "output", "NHWC", ["CPUExecutionProvider"]
    monkeypatch.setattr(inference, "_load_ort_session", _stub_loader)

    # Capture monitoring events
    import app.monitoring as monitoring
    events: List[Dict[str, Any]] = []
    def _log(payload: Dict[str, Any]) -> None:
        events.append(payload)
    monkeypatch.setattr(monitoring, "log_inference_event", _log)

    return fake, events


def _post(client, url: str, json_body: Dict[str, Any], headers: Dict[str, str]):
    return client.post(url, json=json_body, headers=headers)


def test_segmentation_mask_url_with_onnx_pipeline(client, auth_headers, monkeypatch):
    fake_sess, events = _patch_inference_and_monitor(monkeypatch)

    req_id = "22222222-2222-4222-8222-222222222222"
    headers = dict(auth_headers)
    headers["X-Request-Id"] = req_id
    headers["X-Model-Version"] = "unet-1.0.0"

    body = {
        "bbox": [80.10, 7.20, 80.12, 7.22],
        "date": "2025-10-15",
        "return": "mask_url",
        "tiling": {"size": 256, "overlap": 32},
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    # Contract fields
    assert data["request_id"] == req_id
    assert data["model"]["name"] == "unet"
    assert data["model"]["version"] == "1.0.0"
    assert "mask_url" in data and data["mask_url"].startswith("/static/masks/")
    assert data["mask_format"] == "geojson"
    assert "metrics" in data and isinstance(data["metrics"]["latency_ms"], int)
    # Header echoes
    assert resp.headers.get("X-Request-Id") == req_id
    assert resp.headers.get("X-Model-Version") == "unet-1.0.0"

    # Ensure persisted file is retrievable
    static_resp = client.get(data["mask_url"])
    assert static_resp.status_code == 200
    geojson_obj = json.loads(static_resp.get_data(as_text=True))
    assert geojson_obj["type"] == "FeatureCollection"

    # Assert ONNX path executed
    assert fake_sess.calls > 0, "ORT session was not invoked"

    # Monitoring event emitted
    assert len(events) >= 1
    evt = events[-1]
    assert evt.get("success") is True
    assert evt.get("route") == "/v1/segmentation/predict"
    assert "timings" in evt and isinstance(evt["timings"], dict)


def test_segmentation_inline_base64_with_onnx_pipeline(client, auth_headers, monkeypatch):
    fake_sess, events = _patch_inference_and_monitor(monkeypatch)

    headers = dict(auth_headers)
    headers["X-Model-Version"] = "unet-1.0.0"

    body = {
        "bbox": [80.11, 7.21, 80.12, 7.22],
        "date": "2025-10-10",
        "return": "inline",
        "tiling": {"size": 128, "overlap": 16},
    }

    resp = _post(client, "/v1/segmentation/predict", body, headers)
    assert resp.status_code == 200, resp.get_data(as_text=True)
    data = resp.get_json()
    assert "mask_base64" in data
    assert data["mask_format"] == "geojson"
    # Validate base64 decodes to GeoJSON
    decoded = base64.b64decode(data["mask_base64"].encode("utf-8"))
    geo = json.loads(decoded.decode("utf-8"))
    assert geo["type"] == "FeatureCollection"

    # Assert ONNX path executed
    assert fake_sess.calls > 0, "ORT session was not invoked"

    # Monitoring event emitted
    assert len(events) >= 1
    evt = events[-1]
    assert evt.get("success") is True
    assert "providers" in evt