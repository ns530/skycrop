import os
import sys
import glob
import shutil
import csv

import numpy as np
import cv2
import pytest

# Ensure ml-training is importable when running from repo root
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from preprocess_sentinel2 import preprocess_sentinel2_dataset  # noqa: E402


S2_SAMPLES_DIR = os.path.abspath(os.path.join(ML_TRAINING_ROOT, "..", "sentinel2_datasets", "test", "test_images"))


@pytest.mark.skipif(not os.path.isdir(S2_SAMPLES_DIR), reason="Sentinel-2 test dataset is missing")
def test_preprocessing_default_creates_pngs(tmp_path):
    """
    Verify default preprocessing runs without cloud mask and emits PNG images.
    """
    out_dir = tmp_path / "s2_out_default"
    stats = preprocess_sentinel2_dataset(
        input_dir=S2_SAMPLES_DIR,
        output_dir=str(out_dir),
        bands=("B04", "B03", "B02"),
        include_nir=False,
        normalize_cfg={"method": "percentile", "percentiles": (2.0, 98.0)},
        cloud_mask_cfg={"enabled": False, "source": "scl", "threshold": 0.4},
        output_format="png",
        structure="folders",
        seed=1337,
    )

    assert stats["processed"] >= 1
    img_dir = out_dir / "images"
    assert img_dir.is_dir()
    pngs = sorted(glob.glob(str(img_dir / "*.png")))
    assert len(pngs) == stats["images"] and len(pngs) >= 1

    # Validate a couple of outputs
    check = pngs[: min(3, len(pngs))]
    for p in check:
        arr = cv2.imread(p, cv2.IMREAD_UNCHANGED)
        assert arr is not None, f"Failed to read {p}"
        # cv2 returns BGR(A); standardize to shape assertions only
        assert arr.dtype == np.uint8
        assert arr.ndim == 3 and arr.shape[-1] in (3, 4)
        # If 3-channel expected for default include_nir=False
        assert arr.shape[-1] == 3, "Default run should produce 3-channel PNGs"
        # Pixel range
        assert np.min(arr) >= 0 and np.max(arr) <= 255


@pytest.mark.skipif(not os.path.isdir(S2_SAMPLES_DIR), reason="Sentinel-2 test dataset is missing")
def test_preprocessing_include_nir_outputs_four_channels(tmp_path):
    """
    Verify include_nir=True yields 4-channel PNGs (RGB + NIR as alpha slot).
    """
    out_dir = tmp_path / "s2_out_nir"
    stats = preprocess_sentinel2_dataset(
        input_dir=S2_SAMPLES_DIR,
        output_dir=str(out_dir),
        bands=("B04", "B03", "B02"),
        include_nir=True,
        normalize_cfg={"method": "percentile", "percentiles": (2.0, 98.0)},
        cloud_mask_cfg={"enabled": False, "source": "scl", "threshold": 0.4},
        output_format="png",
        structure="folders",
        seed=1337,
    )

    assert stats["processed"] >= 1
    img_dir = out_dir / "images"
    pngs = sorted(glob.glob(str(img_dir / "*.png")))
    assert len(pngs) >= 1

    # Validate a couple of outputs
    for p in pngs[: min(3, len(pngs))]:
        arr = cv2.imread(p, cv2.IMREAD_UNCHANGED)
        assert arr is not None
        assert arr.dtype == np.uint8
        assert arr.ndim == 3 and arr.shape[-1] in (3, 4)
        assert arr.shape[-1] == 4, "NIR run should produce 4-channel PNGs"
        assert np.min(arr) >= 0 and np.max(arr) <= 255


@pytest.mark.skipif(not os.path.isdir(S2_SAMPLES_DIR), reason="Sentinel-2 test dataset is missing")
def test_pipeline_warns_and_proceeds_when_mask_source_missing(tmp_path, capsys):
    """
    Enable cloud mask from SCL; if SCL is absent in sample .nc, pipeline should warn and proceed.
    """
    out_dir = tmp_path / "s2_out_mask_warn"
    stats = preprocess_sentinel2_dataset(
        input_dir=S2_SAMPLES_DIR,
        output_dir=str(out_dir),
        bands=("B04", "B03", "B02"),
        include_nir=False,
        normalize_cfg={"method": "percentile", "percentiles": (2.0, 98.0)},
        cloud_mask_cfg={"enabled": True, "source": "scl", "threshold": 0.4},
        output_format="png",
        structure="folders",
        seed=1337,
    )

    # Capture stdout prints for warnings
    captured = capsys.readouterr()
    # Should not fail; images produced
    assert stats["images"] >= 1
    # Either masks produced or warnings printed if missing SCL
    if stats["masks"] == 0:
        assert "Warning:" in captured.out or stats.get("warnings", 0) >= 1


@pytest.mark.skipif(not os.path.isdir(S2_SAMPLES_DIR), reason="Sentinel-2 test dataset is missing")
def test_deterministic_manifest_split_with_seed(tmp_path):
    """
    With structure=manifest and fixed seed, manifests should be identical across runs.
    """
    out1 = tmp_path / "s2_out_mani_1"
    out2 = tmp_path / "s2_out_mani_2"

    cfg = {
        "input_dir": S2_SAMPLES_DIR,
        "bands": ("B04", "B03", "B02"),
        "include_nir": False,
        "normalize_cfg": {"method": "percentile", "percentiles": (2.0, 98.0)},
        "cloud_mask_cfg": {"enabled": False, "source": "scl", "threshold": 0.4},
        "output_format": "png",
        "structure": "manifest",
        "seed": 2024,
    }

    stats1 = preprocess_sentinel2_dataset(output_dir=str(out1), **cfg)
    stats2 = preprocess_sentinel2_dataset(output_dir=str(out2), **cfg)

    mani1 = os.path.join(out1, "manifests")
    mani2 = os.path.join(out2, "manifests")
    files = ["train.csv", "val.csv", "test.csv"]
    for f in files:
        p1 = os.path.join(mani1, f)
        p2 = os.path.join(mani2, f)
        assert os.path.exists(p1) and os.path.exists(p2)
        with open(p1, "r", encoding="utf-8") as a, open(p2, "r", encoding="utf-8") as b:
            sa = a.read().strip().splitlines()
            sb = b.read().strip().splitlines()
            assert sa == sb, f"Manifest {f} differs between seeded runs"
    # Ensure there is at least 1 training record when possible
    with open(os.path.join(mani1, "train.csv"), "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    assert len(rows) >= 2  # header + at least one row
from dataset import read_image_any  # noqa: E402


@pytest.mark.skipif(not os.path.isdir(S2_SAMPLES_DIR), reason="Sentinel-2 test dataset is missing")
def test_dataset_loader_reads_generated_png_channels(tmp_path):
    """
    Ensure dataset.read_image_any can read 3-channel PNGs produced by preprocessing.
    Use a small subset of .nc files for speed.
    """
    # Limit inputs to a small subset for faster CI
    subset_dir = tmp_path / "subset_default"
    subset_dir.mkdir(parents=True, exist_ok=True)
    all_nc = sorted(glob.glob(os.path.join(S2_SAMPLES_DIR, "*.nc")))
    for p in all_nc[:3]:
        # copy to subset
        dst = os.path.join(subset_dir, os.path.basename(p))
        with open(p, "rb") as s, open(dst, "wb") as d:
            d.write(s.read())

    out_dir = tmp_path / "s2_out_loader_default"
    stats = preprocess_sentinel2_dataset(
        input_dir=str(subset_dir),
        output_dir=str(out_dir),
        bands=("B04", "B03", "B02"),
        include_nir=False,
        normalize_cfg={"method": "percentile", "percentiles": (2.0, 98.0)},
        cloud_mask_cfg={"enabled": False, "source": "scl", "threshold": 0.4},
        output_format="png",
        structure="folders",
        seed=1337,
    )
    assert stats["images"] >= 1
    img_dir = out_dir / "images"
    pngs = sorted(glob.glob(str(img_dir / "*.png")))
    assert len(pngs) >= 1
    for p in pngs:
        arr = read_image_any(p)
        assert arr.dtype == np.uint8
        assert arr.ndim == 3
        assert arr.shape[-1] == 3, "Expected 3 channels for default preprocessing"


@pytest.mark.skipif(not os.path.isdir(S2_SAMPLES_DIR), reason="Sentinel-2 test dataset is missing")
def test_dataset_loader_reads_generated_png_channels_nir(tmp_path):
    """
    Ensure dataset.read_image_any can read 4-channel PNGs (RGB+NIR) produced by preprocessing.
    Use a small subset of .nc files for speed.
    """
    subset_dir = tmp_path / "subset_nir"
    subset_dir.mkdir(parents=True, exist_ok=True)
    all_nc = sorted(glob.glob(os.path.join(S2_SAMPLES_DIR, "*.nc")))
    for p in all_nc[:3]:
        dst = os.path.join(subset_dir, os.path.basename(p))
        with open(p, "rb") as s, open(dst, "wb") as d:
            d.write(s.read())

    out_dir = tmp_path / "s2_out_loader_nir"
    stats = preprocess_sentinel2_dataset(
        input_dir=str(subset_dir),
        output_dir=str(out_dir),
        bands=("B04", "B03", "B02"),
        include_nir=True,
        normalize_cfg={"method": "percentile", "percentiles": (2.0, 98.0)},
        cloud_mask_cfg={"enabled": False, "source": "scl", "threshold": 0.4},
        output_format="png",
        structure="folders",
        seed=1337,
    )
    assert stats["images"] >= 1
    img_dir = out_dir / "images"
    pngs = sorted(glob.glob(str(img_dir / "*.png")))
    assert len(pngs) >= 1
    for p in pngs:
        arr = read_image_any(p)
        assert arr.dtype == np.uint8
        assert arr.ndim == 3
        assert arr.shape[-1] == 4, "Expected 4 channels when include_nir=True"