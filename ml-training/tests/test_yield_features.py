import os
import sys
import json
import math
from typing import Dict, Any

import numpy as np
import pandas as pd
import pytest

# Ensure ml-training root and yield module are importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)
YIELD_DIR = os.path.join(ML_TRAINING_ROOT, "yield")
if YIELD_DIR not in sys.path:
    sys.path.insert(0, YIELD_DIR)

import features as yfeat  # noqa: E402


def _base_cfg() -> Dict[str, Any]:
    return {
        "yield_rf": {
            "version": "1.0.0",
            "windows": {"w7": 7, "w14": 14, "w30": 30},
            "rf": {"n_estimators": 10, "max_depth": 5, "min_samples_leaf": 1, "random_state": 1337},
            "features": {
                "ndvi": True,
                "ndwi": True,
                "tdvi": True,
                "rain_cum": True,
                "degree_days": True,
                "seasonality": True,
                "area": False,
                "base_temp_c": 10.0,
            },
            "paths": {
                # Leave empty; build_features will synthesize if files missing
            },
        }
    }


def test_build_features_shape_and_columns():
    cfg = _base_cfg()
    X, y, cols, merged = yfeat.build_features(cfg, allow_synthetic=True)

    # Shapes
    assert isinstance(X, pd.DataFrame) and isinstance(y, pd.Series)
    assert X.shape[0] == y.shape[0] and X.shape[0] > 0
    assert len(cols) == X.shape[1] and len(cols) > 0

    # Expected core columns present (7/14/30 day windows and seasonality)
    expected_cols = [
        "ndvi_mean_7d",
        "ndvi_std_14d",
        "ndvi_max_30d",
        "ndwi_mean_7d",
        "tdvi_min_14d",
        "rain_sum_7d",
        "rain_sum_30d",
        "gdd_sum_14d",
        "month_sin",
        "month_cos",
    ]
    for c in expected_cols:
        assert c in X.columns, f"Missing expected feature column: {c}"


def test_rolling_window_monotonicity():
    """
    For cumulative sums, longer windows should be >= shorter windows on same date.
    We check rain_sum_30d >= rain_sum_14d >= rain_sum_7d for most rows.
    """
    cfg = _base_cfg()
    X, y, cols, merged = yfeat.build_features(cfg, allow_synthetic=True)

    for c in ["rain_sum_7d", "rain_sum_14d", "rain_sum_30d"]:
        assert c in X.columns, f"{c} must exist"

    r7 = X["rain_sum_7d"].values
    r14 = X["rain_sum_14d"].values
    r30 = X["rain_sum_30d"].values

    # Allow a small number of violations due to early min_periods=1 behavior
    v_14_ge_7 = np.sum(r14 + 1e-9 >= r7)
    v_30_ge_14 = np.sum(r30 + 1e-9 >= r14)
    n = len(r7)

    assert v_14_ge_7 >= int(0.95 * n), "14d rain sums should be >= 7d for most rows"
    assert v_30_ge_14 >= int(0.95 * n), "30d rain sums should be >= 14d for most rows"


def test_degree_days_non_negative_and_increasing_window():
    cfg = _base_cfg()
    X, y, cols, merged = yfeat.build_features(cfg, allow_synthetic=True)

    for c in ["gdd_sum_7d", "gdd_sum_14d", "gdd_sum_30d"]:
        assert c in X.columns, f"{c} must exist"
        assert np.all(X[c].values >= -1e-6), "Degree-days should be non-negative (within numerical tolerance)"

    g7 = X["gdd_sum_7d"].values
    g14 = X["gdd_sum_14d"].values
    g30 = X["gdd_sum_30d"].values

    v_14_ge_7 = np.sum(g14 + 1e-9 >= g7)
    v_30_ge_14 = np.sum(g30 + 1e-9 >= g14)
    n = len(g7)

    assert v_14_ge_7 >= int(0.95 * n)
    assert v_30_ge_14 >= int(0.95 * n)