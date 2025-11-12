import os
import sys
import json

import pytest

# Ensure ml-training is importable from repo root
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
import export as export_mod  # noqa: E402


@pytest.mark.timeout(180)
def test_export_and_registry_update(tmp_dirs, tmp_path):
    data_dir = tmp_dirs["DATA_DIR"]
    runs_dir = tmp_dirs["RUNS_DIR"]
    version = "1.0.0"

    # 1) Prepare tiny dataset and tiles
    make_synthetic_raw_dataset(data_dir, n_images=3, size=192)
    stats = make_tiled_dataset(
        data_dir=data_dir,
        tile_size=128,
        overlap=16,
        min_mask_coverage=0.005,
        val_ratio=0.33,
    )
    assert (stats["train_tiles"] + stats["val_tiles"]) > 0

    # 2) Minimal config for fast train+export
    cfg_path = str(tmp_path / "config.yaml")
    write_min_config(
        cfg_path=cfg_path,
        data_dir=data_dir,
        runs_dir=runs_dir,
        tile_size=128,
        overlap=16,
        epochs=1,
        batch_size=2,
        model_version=version,
    )

    # 3) Train one epoch to produce a checkpoint and summary
    rc = train_unet.main(["--config", cfg_path])
    assert rc == 0

    # 4) Export SavedModel and ONNX; update registry
    rc = export_mod.main(["--config", cfg_path, "--version", version])
    assert rc == 0

    # 5) Assert artifacts exist
    model_root = os.path.join("ml-training", "models", "unet", version)
    savedmodel_dir = os.path.join(model_root, "savedmodel")
    savedmodel_tar = os.path.join(model_root, "savedmodel.tar.gz")
    onnx_path = os.path.join(model_root, "model.onnx")
    metrics_path = os.path.join(model_root, "metrics.json")
    sha_path = os.path.join(model_root, "sha256.txt")
    registry_path = os.path.join("ml-training", "model_registry.json")

    assert os.path.isdir(savedmodel_dir), "SavedModel dir must exist"
    assert os.path.isfile(savedmodel_tar), "SavedModel tarball missing"
    assert os.path.isfile(onnx_path), "ONNX file missing"
    assert os.path.isfile(metrics_path), "metrics.json missing"
    assert os.path.isfile(sha_path), "sha256.txt missing"
    assert os.path.isfile(registry_path), "model_registry.json missing"

    # 6) Verify sha256 file contains both entries
    with open(sha_path, "r", encoding="utf-8") as f:
        sha_lines = [ln.strip() for ln in f.readlines() if ln.strip()]
    assert any(ln.startswith("model.onnx ") for ln in sha_lines)
    assert any(ln.startswith("savedmodel.tar.gz ") for ln in sha_lines)

    # 7) Verify registry entry appended/updated
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
    assert isinstance(registry, list) and len(registry) >= 1

    # Find our version record
    expected_uri = "ml-training/models/unet/{}".format(version)
    records = [r for r in registry if r.get("model_name") == "unet" and r.get("version") == version and r.get("uri") == expected_uri]
    assert len(records) >= 1, "Registry must contain an entry for unet {} at {}".format(version, expected_uri)

    rec = records[-1]
    assert "sha256" in rec and isinstance(rec["sha256"], str) and len(rec["sha256"]) >= 32
    assert "created_at" in rec and isinstance(rec["created_at"], str)

    # Metrics content should be present (keys may vary but must include core metrics or loss)
    with open(metrics_path, "r", encoding="utf-8") as f:
        m = json.load(f)
    assert isinstance(m, dict)
    # Allow any subset, but at least loss or one segmentation metric should be present
    assert any(k in m for k in ("loss", "iou", "dice", "val_loss", "val_iou", "val_dice"))