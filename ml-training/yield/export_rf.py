import os
import sys
import json
import argparse
from datetime import datetime
from typing import Any, Dict, Tuple, List

# Ensure local imports when running as "python ml-training/yield/export_rf.py"
CURRENT_DIR = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from model_rf import (  # noqa: E402
    load_joblib,
    save_joblib,
    model_to_onnx,
    sha256_of_file,
)


def _expand_env_style_vars(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    out = os.path.expandvars(value)

    def _replace_default(match):
        inner = match.group(1)
        if ":-" in inner:
            var, default = inner.split(":-", 1)
            return os.getenv(var, default)
        return os.getenv(inner, "")

    import re

    out = re.sub(r"\$\{([^}]+)\}", _replace_default, out)
    return out


def _expand_in_obj(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _expand_in_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_expand_in_obj(v) for v in obj]
    return _expand_env_style_vars(obj)


def _load_yaml_config(path: str) -> Dict[str, Any]:
    import yaml

    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    return _expand_in_obj(cfg)


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def parse_args(argv=None):
    p = argparse.ArgumentParser("Export RandomForest yield model to Joblib and ONNX; update registry")
    p.add_argument("--config", type=str, required=True, help="Path to YAML config")
    p.add_argument("--version", type=str, default=os.getenv("MODEL_VERSION", "1.0.0"), help="Model version, e.g., 1.0.0")
    return p.parse_args(argv)


def _load_train_summary(runs_dir: str) -> Tuple[str, Dict[str, Any]]:
    run_root = os.path.join(runs_dir, "yield_rf")
    summary_path = os.path.join(run_root, "train_summary.json")
    if not os.path.isfile(summary_path):
        raise FileNotFoundError("train_summary.json not found; run training first.")
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    best_path = summary.get("best_checkpoint")
    if not best_path or not os.path.isfile(best_path):
        raise FileNotFoundError("Best checkpoint not found; run training first.")
    return best_path, summary


def _update_model_registry(registry_path: str, record: Dict[str, Any], replace_same_version: bool = True) -> None:
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                arr = json.load(f)
                if not isinstance(arr, list):
                    arr = []
        except Exception:
            arr = []
    else:
        arr = []

    if replace_same_version:
        arr = [r for r in arr if not (r.get("model_name") == record.get("model_name") and r.get("version") == record.get("version"))]
    arr.append(record)

    with open(registry_path, "w", encoding="utf-8") as f:
        json.dump(arr, f, indent=2)


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = _load_yaml_config(args.config)

    # Resolve paths from config + environment overrides
    runs_dir_env = os.getenv("RUNS_DIR")
    if runs_dir_env:
        cfg.setdefault("paths", {})
        cfg["paths"]["runs_dir"] = runs_dir_env

    runs_dir = str(cfg.get("paths", {}).get("runs_dir", "./runs"))
    models_root = os.path.join("ml-training", "models", "yield_rf", args.version)
    joblib_path = os.path.join(models_root, "model.joblib")
    onnx_path = os.path.join(models_root, "model.onnx")
    metrics_path = os.path.join(models_root, "metrics.json")
    sha_path = os.path.join(models_root, "sha256.txt")
    registry_path = os.path.join("ml-training", "model_registry.json")
    _ensure_dir(models_root)

    # Load checkpoint and summary
    ckpt_path, train_summary = _load_train_summary(runs_dir)

    # Load RF model from checkpoint
    model = load_joblib(ckpt_path)

    # Persist Joblib artifact to versioned models directory
    save_joblib(model, joblib_path)

    # Export to ONNX
    n_features = int(train_summary.get("n_features", 0))
    feature_names: List[str] = list(train_summary.get("feature_names", []))
    if n_features == 0:
        # fallback to feature_names length if available
        n_features = len(feature_names) if feature_names else None  # type: ignore
    if not n_features:
        raise ValueError("n_features missing in train_summary.json; cannot export ONNX safely.")
    model_to_onnx(model, n_features=n_features, out_path=onnx_path)

    # Compute sha256 for both artifacts
    sha_lines: List[str] = []
    sha_joblib = sha256_of_file(joblib_path)
    sha_lines.append(f"model.joblib {sha_joblib}")
    sha_onnx = sha256_of_file(onnx_path)
    sha_lines.append(f"model.onnx {sha_onnx}")
    with open(sha_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sha_lines) + "\n")

    # Metrics.json: include validation metrics and feature info
    val_metrics = train_summary.get("val_metrics", {})
    out_metrics = {
        "rmse": val_metrics.get("rmse"),
        "mae": val_metrics.get("mae"),
        "r2": val_metrics.get("r2"),
        "n_features": n_features,
        "feature_names": feature_names,
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(out_metrics, f, indent=2)

    # Registry entry (keep schema compatible with U-Net entries)
    record = {
        "model_name": "yield_rf",
        "version": args.version,
        "sha256": sha_onnx,  # reference the ONNX sha for quick integrity check
        "uri": f"ml-training/models/yield_rf/{args.version}",
        "created_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "metrics": out_metrics,
    }
    _update_model_registry(registry_path, record, replace_same_version=True)

    print(
        json.dumps(
            {
                "status": "ok",
                "joblib": joblib_path,
                "onnx": onnx_path,
                "metrics": metrics_path,
                "sha256": sha_path,
                "registry": registry_path,
                "record": record,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())