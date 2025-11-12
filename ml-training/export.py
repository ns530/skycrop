import os
import sys
import json
import yaml
import glob
import hashlib
import tarfile
import argparse
from datetime import datetime
from typing import Dict, Any, Tuple, List

# Ensure local imports work when running as "python ml-training/export.py"
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from model_unet import build_unet  # noqa: E402
from metrics import (  # noqa: E402
    iou_metric,
    dice_metric,
    bce_dice_loss,
)

# Optional heavy deps guarded
try:
    import tensorflow as tf
except Exception as e:  # pragma: no cover
    tf = None  # type: ignore

try:
    import tf2onnx
except Exception:  # pragma: no cover
    tf2onnx = None  # type: ignore


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


def load_yaml_config(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    return _expand_in_obj(cfg)


def sha256_of_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def tar_savedmodel(src_dir: str, out_tar_gz: str) -> None:
    # Create gzipped tar of a directory
    with tarfile.open(out_tar_gz, "w:gz") as tar:
        tar.add(src_dir, arcname=os.path.basename(src_dir))


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def _locate_best_checkpoint(runs_dir: str, exp_name: str) -> Tuple[str, Dict[str, Any]]:
    """
    Returns (checkpoint_path, train_summary_dict)
    """
    run_root = os.path.join(runs_dir, exp_name)
    summary_path = os.path.join(run_root, "train_summary.json")
    best_path = None
    summary: Dict[str, Any] = {}
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            summary = json.load(f)
        best_path = summary.get("best_checkpoint")

    if not best_path or not os.path.exists(best_path):
        # Fallback to first .keras in checkpoints
        ckpt_dir = os.path.join(run_root, "checkpoints")
        candidates = sorted(glob.glob(os.path.join(ckpt_dir, "*.keras")))
        if candidates:
            best_path = candidates[0]

    if not best_path or not os.path.exists(best_path):
        raise FileNotFoundError("Best checkpoint not found. Train the model first.")

    return best_path, summary


def build_model_from_config(cfg: Dict[str, Any]) -> "tf.keras.Model":
    assert tf is not None, "TensorFlow is required for export"
    tile = int(cfg.get("data", {}).get("tile", {}).get("size", 512))
    in_ch = int(cfg.get("model", {}).get("input_channels", 3))
    out_ch = int(cfg.get("model", {}).get("output_channels", 1))
    base_filters = int(cfg.get("model", {}).get("base_filters", 32))
    depth = int(cfg.get("model", {}).get("depth", 4))
    dropout = float(cfg.get("model", {}).get("dropout", 0.0))
    model = build_unet(
        input_shape=(tile, tile, in_ch),
        base_filters=base_filters,
        depth=depth,
        dropout=dropout,
        output_channels=out_ch,
    )
    return model


def export_savedmodel(model: "tf.keras.Model", out_dir: str) -> None:
    # Save TF SavedModel
    model.save(out_dir, include_optimizer=False)


def export_onnx_from_keras(model: "tf.keras.Model", out_path: str, opset: int = 13) -> None:
    assert tf2onnx is not None, "tf2onnx is required for ONNX export"
    spec = (tf.TensorSpec(model.inputs[0].shape, tf.float32, name=model.inputs[0].name.split(":")[0]),)
    model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=opset, output_path=out_path)
    if out_path and not os.path.exists(out_path):  # pragma: no cover
        # Some versions write via the API but not to file; ensure we persist
        with open(out_path, "wb") as f:
            f.write(model_proto.SerializeToString())


def update_model_registry(
    registry_path: str,
    record: Dict[str, Any],
    replace_same_version: bool = True,
) -> None:
    # Read or init registry
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


def parse_args(argv=None):
    p = argparse.ArgumentParser("Export U-Net model to SavedModel and ONNX, update registry")
    p.add_argument("--config", type=str, required=True, help="Path to YAML config")
    p.add_argument("--version", type=str, default=os.getenv("MODEL_VERSION", "1.0.0"), help="Model version, e.g., 1.0.0")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = load_yaml_config(args.config)

    # Resolve key paths/env overrides
    data_dir_env = os.getenv("DATA_DIR")
    runs_dir_env = os.getenv("RUNS_DIR")
    if data_dir_env:
        cfg.setdefault("data", {})
        cfg["data"]["data_dir"] = data_dir_env
        cfg["data"]["raw_dir"] = os.path.join(data_dir_env, "raw")
        cfg["data"]["tiles_dir"] = os.path.join(data_dir_env, "tiles")
    if runs_dir_env:
        cfg.setdefault("paths", {})
        cfg["paths"]["runs_dir"] = runs_dir_env

    runs_dir = str(cfg.get("paths", {}).get("runs_dir", "./runs"))
    exp_name = str(cfg.get("experiment", {}).get("name", "unet_baseline"))
    model_dir_root = os.path.join("ml-training", "models", "unet", args.version)
    savedmodel_dir = os.path.join(model_dir_root, "savedmodel")
    onnx_path = os.path.join(model_dir_root, "model.onnx")
    metrics_path = os.path.join(model_dir_root, "metrics.json")
    sha_path = os.path.join(model_dir_root, "sha256.txt")
    registry_path = os.path.join("ml-training", "model_registry.json")

    os.makedirs(model_dir_root, exist_ok=True)

    # Locate checkpoint and metrics
    ckpt_path, train_summary = _locate_best_checkpoint(runs_dir, exp_name)

    # Load Keras model
    assert tf is not None, "TensorFlow is required for export"
    # Load full model or build arch and load weights. Since checkpoint is a full model (.keras), prefer loading.
    custom_objects = {
        "bce_dice_loss": bce_dice_loss(),
        "iou": iou_metric(),  # name matches compile_unet
        "dice": dice_metric(),
    }
    try:
        model = tf.keras.models.load_model(ckpt_path, custom_objects=custom_objects, compile=False)
    except Exception:
        # Fallback: build architecture and try loading weights (if checkpoint was weights-only in some config)
        model = build_model_from_config(cfg)
        try:
            model.load_weights(ckpt_path)
        except Exception as e:
            print("Failed to load weights from checkpoint:", e)
            return 2

    # Export SavedModel
    export_savedmodel(model, savedmodel_dir)

    # Tar SavedModel for checksum portability
    savedmodel_tar = os.path.join(model_dir_root, "savedmodel.tar.gz")
    tar_savedmodel(savedmodel_dir, savedmodel_tar)

    # Export ONNX
    export_onnx_from_keras(model, onnx_path, opset=13)

    # Compute hashes
    sha_lines: List[str] = []
    onnx_sha = sha256_of_file(onnx_path)
    sha_lines.append(f"model.onnx {onnx_sha}")
    savedmodel_sha = sha256_of_file(savedmodel_tar)
    sha_lines.append(f"savedmodel.tar.gz {savedmodel_sha}")
    with open(sha_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sha_lines) + "\n")

    # Metrics
    metrics = train_summary.get("val_metrics", {})
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Registry entry
    record = {
        "model_name": "unet",
        "version": args.version,
        "sha256": onnx_sha,  # primary hash for quick reference (onnx)
        "uri": model_dir_root.replace("\\", "/"),
        "created_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "metrics": {
            "val_iou": metrics.get("iou"),
            "val_dice": metrics.get("dice"),
            "val_loss": metrics.get("loss"),
        },
    }
    update_model_registry(registry_path, record, replace_same_version=True)

    print(
        json.dumps(
            {
                "status": "ok",
                "savedmodel": savedmodel_dir,
                "savedmodel_tar": savedmodel_tar,
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