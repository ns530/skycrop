import os
import sys
import json
import time

import numpy as np
import pytest

# Ensure ml-training modules importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from tests.fixtures.synthetic import (  # noqa: E402
    make_synthetic_raw_dataset,
    make_tiled_dataset,
    write_min_config,
)
import train_unet  # noqa: E402


@pytest.mark.timeout(120)
def test_smoke_train_one_epoch(tmp_dirs, tmp_path):
    data_dir = tmp_dirs["DATA_DIR"]
    runs_dir = tmp_dirs["RUNS_DIR"]

    # Create tiny synthetic raw set and tiles
    make_synthetic_raw_dataset(data_dir, n_images=3, size=192)
    stats = make_tiled_dataset(
        data_dir=data_dir,
        tile_size=128,
        overlap=16,
        min_mask_coverage=0.005,
        val_ratio=0.33,
    )
    assert (stats["train_tiles"] + stats["val_tiles"]) > 0

    # Write minimal config (fast CPU)
    cfg_path = str(tmp_path / "config.yaml")
    write_min_config(
        cfg_path=cfg_path,
        data_dir=data_dir,
        runs_dir=runs_dir,
        tile_size=128,
        overlap=16,
        epochs=1,
        batch_size=2,
    )

    # Train
    rc = train_unet.main(["--config", cfg_path])
    assert rc == 0

    # Validate outputs
    run_root = os.path.join(runs_dir, "unet_baseline")
    summary_path = os.path.join(run_root, "train_summary.json")
    ckpt_path = os.path.join(run_root, "checkpoints", "best.keras")

    assert os.path.exists(summary_path), "train_summary.json must be written"
    assert os.path.exists(ckpt_path), "best checkpoint should exist"

    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    # Ensure metrics present and loss progression recorded
    assert "val_metrics" in summary
    # Loss should ideally not increase in a single epoch; allow equal for stability
    tl_first = summary.get("train_loss_first")
    tl_last = summary.get("train_loss_last")
    if tl_first is not None and tl_last is not None:
        assert tl_last <= tl_first + 1e-6