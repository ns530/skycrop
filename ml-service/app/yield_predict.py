import os
import threading
from typing import List, Optional, Tuple

import numpy as np


class ModelLoadError(Exception):
    pass


class _YieldPredictor:
    """
    Lazy-loading predictor supporting ONNX (preferred) with joblib fallback.
    - Chooses backend by file extension (.onnx vs .joblib)
    - If path ends with .onnx but onnxruntime import fails, tries sibling .joblib path
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._loaded = False
        self._backend: Optional[str] = None  # "onnx" | "joblib"
        self._session = None  # ONNX InferenceSession or sklearn-like estimator
        self._input_name: Optional[str] = None
        self._model_path: Optional[str] = None

    def _load_onnx(self, path: str) -> None:
        try:
            import onnxruntime as ort  # [import onnxruntime](ml-service/requirements.txt:1)
        except Exception as e:
            raise ModelLoadError(f"onnxruntime not available: {e}")

        if not os.path.isfile(path):
            raise ModelLoadError(f"ONNX model file not found: {path}")

        sess = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
        inputs = sess.get_inputs()
        if not inputs:
            raise ModelLoadError("ONNX model has no inputs")
        self._input_name = inputs[0].name
        self._session = sess
        self._backend = "onnx"
        self._model_path = path
        self._loaded = True

    def _load_joblib(self, path: str) -> None:
        try:
            import joblib  # [import joblib](ml-service/requirements.txt:1)
        except Exception as e:
            raise ModelLoadError(f"joblib not available: {e}")

        if not os.path.isfile(path):
            raise ModelLoadError(f"Joblib model file not found: {path}")

        model = joblib.load(path)
        # Best-effort check for predict()
        if not hasattr(model, "predict"):
            raise ModelLoadError("Loaded joblib object has no predict()")
        self._session = model
        self._backend = "joblib"
        self._model_path = path
        self._loaded = True

    def ensure_loaded(self, model_path: str) -> None:
        """
        Load model if not loaded; thread-safe. Reuses already-loaded model if same path.
        """
        if self._loaded and self._model_path == model_path:
            return
        with self._lock:
            # re-check once inside lock
            if self._loaded and self._model_path == model_path:
                return

            # Choose backend based on extension, with graceful fallback
            ext = os.path.splitext(model_path)[1].lower()
            if ext == ".onnx":
                try:
                    self._load_onnx(model_path)
                except ModelLoadError:
                    # Try sibling .joblib as fallback
                    candidate = model_path[:-5] + ".joblib"
                    self._load_joblib(candidate)
            elif ext in (".joblib", ".pkl"):
                self._load_joblib(model_path)
            else:
                # Unknown extension; try ONNX then joblib
                try:
                    self._load_onnx(model_path)
                except ModelLoadError:
                    self._load_joblib(model_path)

    def predict(self, rows: List[List[float]]) -> List[float]:
        if not self._loaded or self._session is None or self._backend is None:
            raise ModelLoadError("Model not loaded")
        X = np.asarray(rows, dtype=np.float32)
        if X.ndim != 2:
            raise ValueError("rows must be a 2D array-like of shape (N, F)")

        if self._backend == "onnx":
            assert self._input_name is not None
            outputs = self._session.run(None, {self._input_name: X})
            # Heuristic: pick the first output and flatten
            y = outputs[0]
            y = np.asarray(y).reshape(-1)
            return [float(v) for v in y.tolist()]
        elif self._backend == "joblib":
            model = self._session
            y = model.predict(X)  # type: ignore[attr-defined]
            y = np.asarray(y).reshape(-1)
            return [float(v) for v in y.tolist()]
        else:
            raise ModelLoadError(f"Unknown backend: {self._backend}")


# Singleton instance for process
_predictor = _YieldPredictor()


def _resolve_model_path(app_config, override_path: Optional[str] = None) -> str:
    """
    Resolve model path using override or app config env.
    """
    if override_path:
        return str(override_path)
    p = app_config.get("ML_YIELD_MODEL_PATH")
    if not p:
        # default per spec
        p = "ml-training/models/yield_rf/1.0.0/model.onnx"
    return str(p)


def predict_numeric(rows: List[List[float]], app_config, model_path_override: Optional[str] = None) -> List[float]:
    """
    Core prediction for numeric rows.
    - rows: 2D list (N, F)
    - app_config: Flask app.config (mapping-like)
    - model_path_override: optional path injected by tests
    """
    path = _resolve_model_path(app_config, model_path_override)
    try:
        _predictor.ensure_loaded(path)
    except ModelLoadError as e:
        # propagate for API layer to map to 404
        raise

    return _predictor.predict(rows)


def build_matrix_from_features(
    features: List[dict],
    explicit_feature_names: Optional[List[str]] = None,
) -> Tuple[List[List[float]], List[Optional[str]], List[str]]:
    """
    Build (rows, field_ids, feature_names) from list of dicts, preserving provided feature order when given.
    - If explicit_feature_names is provided, use that order.
    - Otherwise, infer by taking sorted numeric keys excluding 'field_id' (deterministic for tests).
    """
    field_ids: List[Optional[str]] = []
    rows: List[List[float]] = []

    # Determine feature names
    if explicit_feature_names and len(explicit_feature_names) > 0:
        feat_names = list(explicit_feature_names)
    else:
        # infer union of keys
        keys = set()
        for rec in features:
            for k, v in rec.items():
                if k == "field_id":
                    continue
                # numeric features only
                try:
                    float(v)
                    keys.add(k)
                except Exception:
                    pass
        feat_names = sorted(list(keys))

    for rec in features:
        fid = rec.get("field_id")
        field_ids.append(str(fid) if fid is not None else None)
        row: List[float] = []
        for k in feat_names:
            v = rec.get(k, 0.0)
            try:
                row.append(float(v))
            except Exception:
                row.append(0.0)
        rows.append(row)

    return rows, field_ids, feat_names