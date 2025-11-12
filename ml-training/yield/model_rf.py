import os
import sys
import json
import math
import hashlib
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

# Third-party (CPU-friendly)
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Optional export deps (guarded usage in export script)
try:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType
except Exception:  # pragma: no cover
    convert_sklearn = None  # type: ignore
    FloatTensorType = None  # type: ignore

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None  # type: ignore


# Ensure local imports work when running as "python ml-training/yield/model_rf.py"
CURRENT_DIR = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)


def set_global_seeds(seed: int = 1337) -> None:
    import random as _random

    _random.seed(seed)
    np.random.seed(seed)


def build_random_forest(params: Dict[str, Any]) -> RandomForestRegressor:
    n_estimators = int(params.get("n_estimators", 200))
    max_depth = int(params["max_depth"]) if params.get("max_depth") is not None else None
    min_samples_leaf = int(params.get("min_samples_leaf", 1))
    random_state = int(params.get("random_state", 1337))
    n_jobs = int(params.get("n_jobs", -1))
    rf = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_leaf=min_samples_leaf,
        random_state=random_state,
        n_jobs=n_jobs,
    )
    return rf


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    rmse = math.sqrt(mean_squared_error(y_true, y_pred))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {"rmse": float(rmse), "mae": mae, "r2": r2}


def get_feature_importances(model: RandomForestRegressor, feature_names: List[str]) -> Dict[str, float]:
    fi = getattr(model, "feature_importances_", None)
    if fi is None:
        return {}
    out = {}
    for name, val in zip(feature_names, fi):
        out[name] = float(val)
    return out


def save_joblib(model: Any, path: str) -> None:
    assert joblib is not None, "joblib is required to save models"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)


def load_joblib(path: str) -> Any:
    assert joblib is not None, "joblib is required to load models"
    return joblib.load(path)


def model_to_onnx(model: RandomForestRegressor, n_features: int, out_path: str) -> str:
    """
    Export a scikit-learn RandomForestRegressor to ONNX.
    """
    assert convert_sklearn is not None and FloatTensorType is not None, "skl2onnx is required for ONNX export"
    initial_type = [("input", FloatTensorType([None, int(n_features)]))]
    onnx_model = convert_sklearn(model, initial_types=initial_type, target_opset=13)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(onnx_model.SerializeToString())
    return out_path


def sha256_of_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


__all__ = [
    "set_global_seeds",
    "build_random_forest",
    "regression_metrics",
    "get_feature_importances",
    "save_joblib",
    "load_joblib",
    "model_to_onnx",
    "sha256_of_file",
]