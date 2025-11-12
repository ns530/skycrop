import os
import sys
import json
import types
import uuid
import tempfile
from pathlib import Path

import numpy as np
import joblib


def _post(client, url, body, headers):
    return client.post(url, json=body, headers=headers)


def test_yield_predict_features_ok_mock_onnx(client, auth_headers, app_instance, tmp_path, monkeypatch):
    """
    Mock onnxruntime.InferenceSession to avoid loading real artifacts.
    Create a dummy .onnx file (empty) so path exists; the mock session will be used.
    """
    # Prepare fake onnxruntime module
    class _DummyInput:
        def __init__(self, name):
            self.name = name

    class _DummySession:
        def __init__(self, path, providers=None):
            # assert that called with our path
            assert isinstance(path, str)
        def get_inputs(self):
            return [_DummyInput("input")]
        def run(self, outputs, feeds):
            X = None
            for k, v in feeds.items():
                X = v
            arr = np.asarray(X, dtype=np.float32)
            # simple sum across features
            y = arr.sum(axis=1)
            return [y]

    dummy_ort = types.SimpleNamespace(InferenceSession=_DummySession)
    monkeypatch.setitem(sys.modules, "onnxruntime", dummy_ort)

    # Create dummy .onnx file path
    model_path = tmp_path / "model.onnx"
    model_path.write_bytes(b"")  # existence only

    app_instance.config["ML_YIELD_MODEL_PATH"] = str(model_path)

    body = {
        "features": [
            {"field_id": "f1", "f1": 1.0, "f2": 2.0},
            {"field_id": "f2", "f1": 0.5, "f2": 0.5},
            {"field_id": "f3", "f1": 10.0, "f2": 3.0},
        ],
        "model_version": "1.0.0",
    }

    headers = dict(auth_headers)
    headers["X-Request-Id"] = str(uuid.uuid4())
    headers["X-Model-Version"] = "yield_rf-1.0.0"

    with app_instance.test_client() as c:
        resp = _post(c, "/v1/yield/predict", body, headers)
        assert resp.status_code == 200, resp.get_data(as_text=True)
        data = resp.get_json()
        assert data["model"]["name"] == "yield_rf"
        assert data["model"]["version"] == "1.0.0"
        preds = data["predictions"]
        assert len(preds) == 3
        # sums: [3.0, 1.0, 13.0]
        vals = [p["yield_kg_per_ha"] for p in preds]
        assert vals == [3.0, 1.0, 13.0]
        # field_id should be preserved
        assert preds[0]["field_id"] == "f1"
        assert preds[1]["field_id"] == "f2"
        assert preds[2]["field_id"] == "f3"


def test_yield_predict_rows_missing_feature_names_400(client, auth_headers):
    body = {
        "rows": [[1.0, 2.0], [3.0, 4.0]],
        # "feature_names" missing
        "model_version": "1.0.0",
    }
    resp = _post(client, "/v1/yield/predict", body, auth_headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"]["code"] == "INVALID_INPUT"


class _DummyRegressor:
    def predict(self, X):
        arr = np.asarray(X, dtype=float)
        return (arr.sum(axis=1) * 2.0)  # deterministic


def test_yield_predict_joblib_fallback_when_onnx_missing(client, auth_headers, app_instance, tmp_path):
    """
    Ensure that when .onnx path doesn't exist, service falls back to sibling .joblib.
    """
    # Save dummy regressor
    reg = _DummyRegressor()
    joblib_path = tmp_path / "model.joblib"
    joblib.dump(reg, joblib_path)

    # Configure ONNX path (non-existent) so loader falls back to .joblib
    onnx_path = tmp_path / "model.onnx"
    # Do not create .onnx -> triggers fallback
    app_instance.config["ML_YIELD_MODEL_PATH"] = str(onnx_path)

    body = {
        "rows": [[1.0, 2.0], [0.5, 0.5], [10.0, 3.0]],
        "feature_names": ["f1", "f2"],
        "model_version": "1.0.0",
    }
    headers = dict(auth_headers)
    headers["X-Model-Version"] = "yield_rf-1.0.0"

    with app_instance.test_client() as c:
        resp = _post(c, "/v1/yield/predict", body, headers)
        assert resp.status_code == 200, resp.get_data(as_text=True)
        data = resp.get_json()
        vals = [p["yield_kg_per_ha"] for p in data["predictions"]]
        # 2x sums: [6.0, 2.0, 26.0]
        assert vals == [6.0, 2.0, 26.0]


def test_yield_predict_model_path_missing_404(client, auth_headers, app_instance, tmp_path):
    # Point to a clearly missing onnx path and ensure 404 mapping
    missing = tmp_path / "nope" / "model.onnx"
    app_instance.config["ML_YIELD_MODEL_PATH"] = str(missing)

    body = {
        "rows": [[1.0, 2.0]],
        "feature_names": ["a", "b"],
        "model_version": "1.0.0",
    }
    resp = _post(client, "/v1/yield/predict", body, auth_headers)
    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"]["code"] == "MODEL_NOT_FOUND"