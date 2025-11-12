import os
import sys
import json
import argparse
from typing import Any, Dict, List, Tuple, Optional

import numpy as np
import pandas as pd

# Ensure local imports when running as "python ml-training/yield/infer_rf.py"
CURRENT_DIR = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

# Optional deps (guarded)
try:
    import onnxruntime as ort
except Exception:  # pragma: no cover
    ort = None  # type: ignore

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None  # type: ignore


def parse_args(argv=None):
    p = argparse.ArgumentParser("Offline inference for Yield RF (ONNX or Joblib)")
    p.add_argument("--model", type=str, required=True, help="Path to model.onnx or model.joblib")
    p.add_argument("--input", type=str, required=True, help="Path to input CSV (columns=features) or JSON-lines file")
    p.add_argument("--out", type=str, required=True, help="Path to output JSON with predictions")
    p.add_argument("--format", type=str, choices=["csv", "jsonl"], default=None, help="Force input format override")
    p.add_argument("--features", type=str, default=None, help="Optional path to metrics.json with feature_names to order columns")
    return p.parse_args(argv)


def _load_features_matrix(input_path: str, forced_format: Optional[str], feature_names: Optional[List[str]]) -> Tuple[np.ndarray, List[Dict[str, Any]], List[str]]:
    """
    Returns:
      - X: np.ndarray [N, D]
      - rows_meta: list of dicts with optional identifiers (e.g., field_id if present) for echoing
      - used_feature_names: list of column names used for X order
    """
    fmt = forced_format
    if fmt is None:
        ext = os.path.splitext(input_path)[1].lower()
        if ext in [".csv"]:
            fmt = "csv"
        else:
            fmt = "jsonl"

    if fmt == "csv":
        df = pd.read_csv(input_path)
        # If no feature_names provided, use all numeric columns
        if feature_names is None or len(feature_names) == 0:
            feature_names = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        X = df[feature_names].astype(np.float32).values
        rows_meta = df.to_dict(orient="records")
        return X, rows_meta, feature_names
    else:
        # jsonl
        rows: List[Dict[str, Any]] = []
        with open(input_path, "r", encoding="utf-8") as f:
            for ln in f:
                ln = ln.strip()
                if not ln:
                    continue
                rows.append(json.loads(ln))
        if len(rows) == 0:
            return np.empty((0, 0), dtype=np.float32), [], feature_names or []
        # Determine feature_names
        if feature_names is None or len(feature_names) == 0:
            # use all numeric keys across first row
            cand = []
            for k, v in rows[0].items():
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    cand.append(k)
            feature_names = cand
        # Build matrix
        data = []
        for r in rows:
            data.append([float(r.get(c, 0.0)) for c in feature_names])
        X = np.asarray(data, dtype=np.float32)
        return X, rows, feature_names


def _maybe_load_feature_names(metrics_json_path: Optional[str]) -> List[str]:
    if not metrics_json_path:
        return []
    if os.path.isfile(metrics_json_path):
        try:
            with open(metrics_json_path, "r", encoding="utf-8") as f:
                m = json.load(f)
            fn = m.get("feature_names")
            if isinstance(fn, list):
                return [str(x) for x in fn]
        except Exception:
            return []
    return []


def _infer_metrics_path(model_path: str) -> Optional[str]:
    # Expect layout: ml-training/models/yield_rf/1.0.0/model.onnx and metrics.json next to it
    base_dir = os.path.dirname(model_path)
    cand = os.path.join(base_dir, "metrics.json")
    return cand if os.path.isfile(cand) else None


def _predict_onnx(model_path: str, X: np.ndarray) -> np.ndarray:
    assert ort is not None, "onnxruntime is required to load ONNX models"
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name
    outputs = sess.run(None, {input_name: X})
    y = outputs[0]
    # skl2onnx RF Regressor outputs shape [N, 1]
    if y.ndim == 2 and y.shape[1] == 1:
        y = y[:, 0]
    return y.astype(float)


def _predict_joblib(model_path: str, X: np.ndarray) -> np.ndarray:
    assert joblib is not None, "joblib is required to load joblib models"
    model = joblib.load(model_path)
    y = model.predict(X)
    return y.astype(float)


def main(argv=None) -> int:
    args = parse_args(argv)

    model_path = args.model
    if not os.path.isfile(model_path):
        print(json.dumps({"status": "error", "error": f"Model not found: {model_path}"}))
        return 2

    # Load feature ordering if available
    metrics_path = args.features or _infer_metrics_path(model_path)
    feature_names = _maybe_load_feature_names(metrics_path)

    X, rows_meta, used_feature_names = _load_features_matrix(args.input, args.format, feature_names)
    if X.size == 0:
        print(json.dumps({"status": "ok", "predictions": [], "n": 0, "feature_names": used_feature_names}))
        return 0

    ext = os.path.splitext(model_path)[1].lower()
    if ext == ".onnx":
        y = _predict_onnx(model_path, X)
    else:
        y = _predict_joblib(model_path, X)

    # Build output records
    out_rows: List[Dict[str, Any]] = []
    for i, pred in enumerate(y.tolist()):
        r = {"row_index": i, "prediction": float(pred)}
        # Echo common identifiers if present
        meta = rows_meta[i] if i < len(rows_meta) else {}
        for k in ("field_id", "season", "date"):
            if k in meta:
                r[k] = meta[k]
        out_rows.append(r)

    out = {
        "status": "ok",
        "n": int(len(out_rows)),
        "feature_names": used_feature_names,
        "predictions": out_rows,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print(json.dumps({"status": "ok", "written": args.out, "n": len(out_rows)}, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())