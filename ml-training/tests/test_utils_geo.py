import os
import sys
import json
import numpy as np

# Ensure ml-training is importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from utils_geo import mask_to_geojson  # noqa: E402


def test_mask_to_geojson_basic_polygonization():
    # Create a simple binary mask with a filled rectangle
    h, w = 64, 64
    mask = np.zeros((h, w), dtype=np.uint8)
    mask[16:48, 20:44] = 1  # rectangle

    fc = mask_to_geojson(mask01=mask, transform=None, crs=None, min_area_pixels=10, buffer_pixels=0)
    assert isinstance(fc, dict) and fc.get("type") == "FeatureCollection"
    feats = fc.get("features", [])
    assert isinstance(feats, list)
    # Should have at least one polygon feature
    assert len(feats) >= 1
    # Validate feature structure
    f0 = feats[0]
    assert f0.get("type") == "Feature"
    assert "geometry" in f0 and "properties" in f0