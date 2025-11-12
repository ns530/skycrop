import os
import sys
import json
import time
import math
import yaml
import argparse
from typing import Dict, Any

# Ensure local imports work when running as "python ml-training/train_unet.py"
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from dataset import (  # noqa: E402
    build_sequences_from_tiles,
    set_global_seeds,
    load_yaml_config,
)
from model_unet import build_and_compile_from_config  # noqa: E402


def _expand_env_style_vars(value: Any) -> Any:
    """
    Expand strings like ${VAR:-default} using environment variables.
    Non-strings are returned as-is.
    """
    if not isinstance(value, str):
        return value

    out = value

    # Simple ${VAR} expansion
    out = os.path.expandvars(out)

    # Handle ${VAR:-default}
    # We do a conservative parse for patterns of the exact form ${NAME:-default}
    # and replace with os.getenv("NAME", "default")
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


def load_and_resolve_config(config_path: str) -> Dict:
    cfg = load_yaml_config(config_path)
    # Merge environment overrides for key vars if provided
    # and expand any ${VAR:-default} placeholders
    cfg = _expand_in_obj(cfg)

    # Allow direct env overrides for convenience
    data_dir_env = os.getenv("DATA_DIR")
    runs_dir_env = os.getenv("RUNS_DIR")
    model_version_env = os.getenv("MODEL_VERSION")

    if data_dir_env:
        cfg.setdefault("data", {})
        cfg["data"]["data_dir"] = data_dir_env
        cfg["data"]["raw_dir"] = os.path.join(data_dir_env, "raw")
        cfg["data"]["tiles_dir"] = os.path.join(data_dir_env, "tiles")
    if runs_dir_env:
        cfg.setdefault("paths", {})
        cfg["paths"]["runs_dir"] = runs_dir_env
    if model_version_env:
        cfg.setdefault("registry", {})
        cfg["registry"]["model_version"] = model_version_env

    return cfg


def parse_args(argv=None):
    p = argparse.ArgumentParser("Train U-Net baseline for boundary detection")
    p.add_argument("--config", type=str, required=True, help="Path to YAML config")
    return p.parse_args(argv)


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = load_and_resolve_config(args.config)

    # Seeds and determinism
    seed = int(cfg.get("experiment", {}).get("seed", 1337))
    set_global_seeds(seed)

    # Optional: force CPU (no GPU)
    try:
        import tensorflow as tf

        try:
            tf.config.set_visible_devices([], "GPU")
        except Exception:
            pass
    except Exception as e:
        print("TensorFlow import failed; training cannot proceed.", e)
        return 2

    # Paths
    data_dir = str(cfg.get("data", {}).get("data_dir", "./data"))
    tiles_dir = str(cfg.get("data", {}).get("tiles_dir", os.path.join(data_dir, "tiles")))
    runs_dir = str(cfg.get("paths", {}).get("runs_dir", "./runs"))
    exp_name = str(cfg.get("experiment", {}).get("name", "unet_baseline"))

    _ensure_dir(runs_dir)
    run_root = os.path.join(runs_dir, exp_name)
    tb_dir = os.path.join(run_root, "tb")
    ckpt_dir = os.path.join(run_root, "checkpoints")
    _ensure_dir(tb_dir)
    _ensure_dir(ckpt_dir)

    # Training hyperparameters
    train_cfg = cfg.get("train", {})
    epochs = int(train_cfg.get("epochs", 20))
    batch_size = int(train_cfg.get("batch_size", 4))
    augment_cfg = train_cfg.get("augment", {})
    metric_threshold = float(cfg.get("metrics", {}).get("threshold", 0.5))

    # Datasets
    try:
        train_seq, val_seq = build_sequences_from_tiles(
            tiles_dir=tiles_dir,
            batch_size=batch_size,
            val_split_dirnames=("train", "val"),
            augment_cfg=augment_cfg,
            seed=seed,
        )
    except FileNotFoundError as e:
        print(f"Dataset preparation missing: {e}")
        print("Hint: run tiling first, e.g.:")
        print("  python ml-training/dataset.py tile --data-dir ./data --tile-size 512 --overlap 64 --val-ratio 0.2 --seed 1337")
        return 2

    # Model
    model = build_and_compile_from_config(cfg)
    model.summary(print_fn=lambda s: print(s))

    # Callbacks
    monitor = str(cfg.get("checkpoint", {}).get("monitor", "val_iou"))
    mode = str(cfg.get("checkpoint", {}).get("mode", "max"))
    save_best_only = bool(cfg.get("checkpoint", {}).get("save_best_only", True))
    patience = int(cfg.get("checkpoint", {}).get("early_stopping_patience", 5))

    ckpt_path = os.path.join(ckpt_dir, "best.keras")
    callbacks = [
        tf.keras.callbacks.TensorBoard(log_dir=tb_dir, histogram_freq=0, write_graph=False, write_images=False),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=ckpt_path, monitor=monitor, mode=mode, save_best_only=save_best_only, save_weights_only=False
        ),
        tf.keras.callbacks.EarlyStopping(monitor=monitor, mode=mode, patience=patience, restore_best_weights=True),
    ]

    # Fit
    start = time.time()
    history = model.fit(
        train_seq,
        validation_data=val_seq,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1,
    )
    elapsed = time.time() - start

    # Evaluate final/best
    metrics = model.evaluate(val_seq, return_dict=True, verbose=0)

    # Extract simple loss progression info to support smoke tests
    train_losses = history.history.get("loss", []) or []
    val_losses = history.history.get("val_loss", []) or []
    train_loss_first = float(train_losses[0]) if len(train_losses) > 0 else None
    train_loss_last = float(train_losses[-1]) if len(train_losses) > 0 else None
    val_loss_first = float(val_losses[0]) if len(val_losses) > 0 else None
    val_loss_last = float(val_losses[-1]) if len(val_losses) > 0 else None

    result = {
        "status": "ok",
        "elapsed_sec": round(elapsed, 2),
        "epochs": len(train_losses),
        "best_checkpoint": ckpt_path if os.path.exists(ckpt_path) else None,
        "val_metrics": metrics,
        "train_loss_first": train_loss_first,
        "train_loss_last": train_loss_last,
        "val_loss_first": val_loss_first,
        "val_loss_last": val_loss_last,
    }

    # Persist training summary
    with open(os.path.join(run_root, "train_summary.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())