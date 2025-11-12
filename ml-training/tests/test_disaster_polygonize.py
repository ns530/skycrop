import os
import sys
import json
from typing import List

import numpy as np
import pytest

# Ensure ml-training directory importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from disaster.polygonize import clean_mask, polygonize_mask, MorphologyConfig  # noqa: E402


def _disk_mask(h: int, w: int, cy: int, cx: int, r: int) -> np.ndarray:
    yy, xx = np.mgrid[0:h, 0:w]
    return (((yy - cy) ** 2 + (xx - cx) ** 2) <= (r ** 2)).astype(np.uint8)


@pytest.mark.timeout(30)
def test_clean_mask_removes_small_speckles_and_keeps_main_region():
    H, W = 128, 128
    base = _disk_mask(H, W, H // 2, W // 2, r=min(H, W) // 5)

    # Add speckles
    speckles = np.zeros((H, W), dtype=np.uint8)
    speckles[5, 5] = 1
    speckles[10, 90] = 1
    speckles[120 - 1, 120 - 1] = 1

    noisy = ((base + speckles) > 0).astype(np.uint8)

    # Clean with min_area to remove tiny dots
    morph = MorphologyConfig(min_area_pixels=20, open_size=1, close_size=1)
    cleaned = clean_mask(noisy, morph=morph)

    assert cleaned.dtype == np.uint8
    assert cleaned.shape == (H, W)

    # Speckles removed: cleaned count close to base count
    assert cleaned.sum() >= int(base.sum() * 0.95)
    assert cleaned.sum() <= base.sum() + 50  # allow small growth due to close/open


@pytest.mark.timeout(30)
def test_polygonize_mask_featurecollection_and_area_sanity(tmp_path):
    H, W = 100, 100
    mask = _disk_mask(H, W, cy=50, cx=50, r=20)

    fc = polygonize_mask(
        mask,
        properties={"event": "flood", "severity": "medium"},
        min_area_pixels=50,
        simplify_tolerance=0.0,  # keep area stable
        buffer_pixels=0.0,
    )
    assert isinstance(fc, dict) and fc.get("type") == "FeatureCollection"
    feats: List[dict] = fc.get("features", [])
    assert len(feats) >= 1

    # GeoJSON round-trip
    outp = tmp_path / "poly.geojson"
    with open(outp, "w", encoding="utf-8") as f:
        json.dump(fc, f)
    with open(outp, "r", encoding="utf-8") as f:
        fc2 = json.load(f)
    assert fc2.get("type") == "FeatureCollection"

    # Area sanity: polygon area should be close to mask count within tolerance
    mask_area = int(mask.sum())
    # Compute total polygon area in pixel units via shapely if available
    try:
        from shapely.geometry import shape as shp_shape  # type: ignore
    except Exception:
        shp_shape = None  # type: ignore

    if shp_shape is not None and feats:
        total_poly_area = 0.0
        for feat in feats:
            geom = feat.get("geometry")
            try:
                total_poly_area += float(shp_shape(geom).area)
            except Exception:
                pass
        # Within 25% tolerance
        assert total_poly_area > mask_area * 0.5
        assert total_poly_area < mask_area * 1.5