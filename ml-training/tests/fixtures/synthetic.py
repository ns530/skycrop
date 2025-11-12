import os
import sys
from typing import Tuple, Dict, Any

import numpy as np
import cv2

# Allow importing project modules when tests run from repo root
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from dataset import perform_tiling  # noqa: E402


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def make_synthetic_raw_dataset(base_dir: str, n_images: int = 3, size: int = 256) -> str:
    """
    Create a small synthetic raw dataset under:
      base_dir/raw/{images,masks}
    Images: RGB gradients with simple shapes
    Masks: binary with circles/rectangles
    """
    images_dir = os.path.join(base_dir, "raw", "images")
    masks_dir = os.path.join(base_dir, "raw", "masks")
    _ensure_dir(images_dir)
    _ensure_dir(masks_dir)

    rng = np.random.RandomState(1337)
    for i in range(n_images):
        img = np.zeros((size, size, 3), dtype=np.uint8)
        # Gradient background
        for c in range(3):
            img[..., c] = np.clip(
                (np.linspace(0, 255, size, dtype=np.float32)[None, :] + rng.randint(0, 30)), 0, 255
            ).astype(np.uint8)

        mask = np.zeros((size, size), dtype=np.uint8)

        # Add a filled circle
        rr, cc = size // 2, size // 2
        rad = rng.randint(size // 6, size // 4)
        cv2.circle(mask, (cc, rr), int(rad), color=1, thickness=-1)

        # Add a rectangle
        x1, y1 = rng.randint(10, size // 3), rng.randint(10, size // 3)
        x2, y2 = x1 + rng.randint(size // 6, size // 3), y1 + rng.randint(size // 6, size // 3)
        cv2.rectangle(mask, (x1, y1), (min(x2, size - 1), min(y2, size - 1)), color=1, thickness=-1)

        # Anti-alias edges slightly via blur then threshold
        mask = (cv2.GaussianBlur(mask.astype(np.float32), (5, 5), 0) > 0.2).astype(np.uint8)

        # Blend shapes into image channels for simple signal
        img = cv2.add(img, (mask * 40)[..., None])

        base = f"syn_{i:03d}"
        cv2.imwrite(os.path.join(images_dir, base + ".png"), cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(masks_dir, base + ".png"), (mask * 255).astype(np.uint8))

    return base_dir


def make_tiled_dataset(
    data_dir: str,
    tile_size: int = 128,
    overlap: int = 16,
    min_mask_coverage: float = 0.005,
    val_ratio: float = 0.33,
) -> Dict[str, int]:
    """
    Run the project tiler to generate tiles under data_dir/tiles/{train,val}/{images,masks}.
    """
    stats = perform_tiling(
        data_dir=data_dir,
        tile_size=tile_size,
        overlap=overlap,
        min_mask_coverage=min_mask_coverage,
        val_ratio=val_ratio,
        seed=1337,
    )
    return stats


def write_min_config(
    cfg_path: str,
    data_dir: str,
    runs_dir: str,
    model_version: str = "1.0.0",
    tile_size: int = 128,
    overlap: int = 16,
    epochs: int = 1,
    batch_size: int = 2,
) -> str:
    """
    Write a minimal YAML config file tuned for fast CPU smoke runs.
    """
    import yaml

    cfg = {
        "experiment": {"name": "unet_baseline", "seed": 1337},
        "data": {
            "data_dir": data_dir,
            "raw_dir": os.path.join(data_dir, "raw"),
            "tiles_dir": os.path.join(data_dir, "tiles"),
            "tile": {"size": int(tile_size), "overlap": int(overlap), "min_mask_coverage": 0.005},
        },
        "split": {"val_ratio": 0.33, "shuffle": True},
        "train": {
            "epochs": int(epochs),
            "batch_size": int(batch_size),
            "learning_rate": 1e-3,
            "optimizer": "adam",
            "weight_decay": 0.0,
            "bce_weight": 0.5,
            "dice_weight": 0.5,
            "loss_smooth": 1.0,
            "augment": {
                "hflip": 0.5,
                "vflip": 0.5,
                "rotate90": 0.5,
                "brightness_contrast": 0.2,
                "shift_scale_rotate": 0.2,
            },
        },
        "model": {"name": "unet", "input_channels": 3, "output_channels": 1, "base_filters": 16, "depth": 3, "dropout": 0.0},
        "metrics": {"threshold": 0.5},
        "inference": {"threshold": 0.5, "tile": {"size": int(tile_size), "overlap": int(overlap)}},
        "paths": {"runs_dir": runs_dir, "models_dir": "./ml-training/models"},
        "checkpoint": {"monitor": "val_iou", "mode": "max", "save_best_only": True, "early_stopping_patience": 2},
        "registry": {"model_version": model_version},
    }
    with open(cfg_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f)
    return cfg_path