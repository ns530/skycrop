import os
import sys
import json
import time

import numpy as np
import pytest

# Ensure ml-training is importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from dataset import build_sequences_from_tiles  # noqa: E402
from tests.fixtures.synthetic import (  # noqa: E402
    make_synthetic_raw_dataset,
    make_tiled_dataset,
)


def test_tiling_and_loader_shapes(tmp_dirs):
    data_dir = tmp_dirs["DATA_DIR"]

    # Generate tiny synthetic dataset
    make_synthetic_raw_dataset(data_dir, n_images=2, size=192)

    # Tile to small size for speed
    stats = make_tiled_dataset(
        data_dir=data_dir,
        tile_size=128,
        overlap=16,
        min_mask_coverage=0.005,
        val_ratio=0.5,
    )
    # Should have created at least some tiles
    assert (stats["train_tiles"] + stats["val_tiles"]) > 0

    # Build sequences
    tiles_dir = os.path.join(data_dir, "tiles")
    train_seq, val_seq = build_sequences_from_tiles(
        tiles_dir=tiles_dir,
        batch_size=2,
        val_split_dirnames=("train", "val"),
        augment_cfg={"hflip": 0.5, "vflip": 0.5, "rotate90": 0.5, "brightness_contrast": 0.2, "shift_scale_rotate": 0.2},
        seed=1337,
    )

    # Check a train batch
    x, y = train_seq[0]
    assert x.ndim == 4 and y.ndim == 4, "Expected NHWC for both images and masks"
    # Either full batch or smaller if limited by dataset size
    assert x.shape[-1] == 3, "RGB images"
    assert y.shape[-1] == 1, "Single-channel masks"
    assert x.shape[1] == x.shape[2] == 128, "Tile size"
    assert y.shape[1] == y.shape[2] == 128, "Mask tile size"
    # Normalization and mask binary range
    assert np.all(x >= 0.0) and np.all(x <= 1.0)
    assert np.all((y == 0.0) | (y == 1.0)), "Masks should be binary {0,1}"

    # Val batch checks
    xv, yv = val_seq[0]
    assert xv.shape[-1] == 3 and yv.shape[-1] == 1
    assert xv.shape[1] == xv.shape[2] == 128
    assert yv.shape[1] == yv.shape[2] == 128