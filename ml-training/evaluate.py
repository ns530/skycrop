import os
import sys
import json
import yaml
import argparse
from typing import Dict, Any

# Ensure local imports work
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from dataset import build_sequences_from_sentinel2, load_yaml_config
from model_unet import build_and_compile_from_config, get_optimizer, get_loss_fn, dice_metric, iou_metric
from config_utils import load_and_resolve_config  # noqa: E402

try:
    import tensorflow as tf
except Exception as e:
    print(f"TensorFlow import failed: {e}")
    sys.exit(1)


def parse_args(argv=None):
    p = argparse.ArgumentParser("Evaluate trained U-Net model on test set")
    p.add_argument("--config", type=str, required=True, help="Path to YAML config")
    p.add_argument("--checkpoint", type=str, help="Path to model checkpoint (auto-detected if not provided)")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = load_and_resolve_config(args.config)

    # Paths
    data_dir = str(cfg.get("data", {}).get("data_dir", "./data"))
    sentinel2_cfg = cfg.get("data", {}).get("sentinel2", {})
    sentinel2_base_dir = os.path.join(data_dir, sentinel2_cfg.get("input_dir", "sentinel2_datasets"))

    # Model config
    train_cfg = cfg.get("train", {})
    batch_size = int(train_cfg.get("batch_size", 4))
    augment_cfg = train_cfg.get("augment", {})
    seed = int(cfg.get("experiment", {}).get("seed", 1337))

    # Load test dataset
    print("Loading test dataset...")
    try:
        _, _, test_seq = build_sequences_from_sentinel2(
            sentinel2_base_dir=sentinel2_base_dir,
            batch_size=batch_size,
            augment_cfg=augment_cfg,
            seed=seed,
        )
        print(f"Test dataset loaded: {len(test_seq)} batches ({len(test_seq) * batch_size} samples)")
    except Exception as e:
        print(f"Failed to load test dataset: {e}")
        return 1

    # Load model
    if args.checkpoint:
        model_path = args.checkpoint
    else:
        # Auto-detect latest checkpoint
        runs_dir = str(cfg.get("paths", {}).get("runs_dir", "./runs"))
        exp_name = str(cfg.get("experiment", {}).get("name", "unet_baseline"))
        run_root = os.path.join(runs_dir, exp_name)
        ckpt_dir = os.path.join(run_root, "checkpoints")

        if os.path.exists(ckpt_dir):
            # Find the best checkpoint (usually saved as best.keras)
            best_ckpt = os.path.join(ckpt_dir, "best.keras")
            if os.path.exists(best_ckpt):
                model_path = best_ckpt
            else:
                # Find any .keras file
                keras_files = [f for f in os.listdir(ckpt_dir) if f.endswith('.keras')]
                if keras_files:
                    model_path = os.path.join(ckpt_dir, sorted(keras_files)[-1])  # Latest
                else:
                    print(f"No checkpoint files found in {ckpt_dir}")
                    return 1
        else:
            print(f"Checkpoint directory not found: {ckpt_dir}")
            return 1

    print(f"Loading model from: {model_path}")
    try:
        model = tf.keras.models.load_model(model_path, compile=False)
        print("Model loaded successfully")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return 1

    # Compile model for evaluation
    try:
        optimizer = get_optimizer(train_cfg)
        loss_fn = get_loss_fn(train_cfg)
        model.compile(
            optimizer=optimizer,
            loss=loss_fn,
            metrics=[dice_metric, iou_metric]
        )
        print("Model compiled successfully")
    except Exception as e:
        print(f"Failed to compile model: {e}")
        return 1

    # Evaluate on test set
    print("Evaluating on test set...")
    try:
        test_metrics = model.evaluate(test_seq, return_dict=True, verbose=1)
        print("\nTest Results:")
        print(json.dumps(test_metrics, indent=2))

        # Summary
        result = {
            "status": "ok",
            "model_path": model_path,
            "test_samples": len(test_seq) * batch_size,
            "test_metrics": test_metrics
        }
        print("\n" + json.dumps(result, indent=2))

    except Exception as e:
        print(f"Evaluation failed: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())