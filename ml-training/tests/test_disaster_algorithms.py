import os
import sys
from datetime import date, timedelta

import numpy as np
import pandas as pd
import pytest

# Ensure ml-training directory importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from disaster.features import WindowConfig, slice_windows, compute_window_stats  # noqa: E402
from disaster.algorithms import (  # noqa: E402
    Thresholds,
    classify_flood,
    classify_drought,
    classify_stress,
    decide_auto,
)


def _make_series(start: date, end: date, val: float) -> pd.DataFrame:
    days = (end - start).days + 1
    dates = [start + timedelta(days=i) for i in range(days)]
    return pd.DataFrame({"date": dates, "ndvi": val, "ndwi": val, "tdvi": val})


@pytest.mark.timeout(30)
def test_windowing_pre_post_exclude_event_day():
    # Event on mid
    event = date(2024, 6, 15)
    cfg = WindowConfig(pre_days=14, post_days=7)

    # Build full series from June 1 to June 22
    df = pd.DataFrame(
        {
            "field_id": ["F1"] * 22,
            "date": [date(2024, 6, 1) + timedelta(days=i) for i in range(22)],
            "ndvi": np.linspace(0.6, 0.5, 22),
            "ndwi": np.linspace(0.1, 0.3, 22),
            "tdvi": np.linspace(0.05, 0.2, 22),
        }
    )

    pre_df, post_df = slice_windows(df, event, cfg)
    # pre: 6/1..6/14 -> 14 days
    # post: 6/16..6/22 -> 7 days
    assert not pre_df.empty and not post_df.empty
    assert pre_df["date"].min() == date(2024, 6, 1)
    assert pre_df["date"].max() == date(2024, 6, 14)
    assert post_df["date"].min() == date(2024, 6, 16)
    assert post_df["date"].max() == date(2024, 6, 22)
    assert (pre_df["date"] < event).all()
    assert (post_df["date"] > event).all()


@pytest.mark.timeout(30)
def test_classify_flood_medium_and_high():
    th = Thresholds()
    # Medium: ndwi_delta in [0.15, 0.25)
    stats_med = {"ndwi_delta": 0.20, "ndwi_post_mean": 0.20, "ndvi_drop": 0.05}
    res_med = classify_flood(stats_med, th)
    assert res_med["detected"] is True
    assert res_med["severity"] == "medium"

    # High: ndwi_delta > 0.25
    stats_high = {"ndwi_delta": 0.30, "ndwi_post_mean": 0.30, "ndvi_drop": 0.0}
    res_high = classify_flood(stats_high, th)
    assert res_high["detected"] is True
    assert res_high["severity"] == "high"

    # Low: ndwi_delta in [0.10, 0.15) and ndwi_post_mean > 0.08 (below primary gate but allowed)
    stats_low = {"ndwi_delta": 0.12, "ndwi_post_mean": 0.10, "ndvi_drop": 0.0}
    res_low = classify_flood(stats_low, th)
    assert res_low["detected"] is True
    assert res_low["severity"] == "low"

    # None: ndwi_delta small and post too low
    stats_none = {"ndwi_delta": 0.05, "ndwi_post_mean": 0.05, "ndvi_drop": 0.0}
    res_none = classify_flood(stats_none, th)
    assert res_none["detected"] is False
    assert res_none["severity"] == "none"


@pytest.mark.timeout(30)
def test_classify_drought_scaling():
    th = Thresholds()
    # Signal true: both drops above mins
    stats = {"ndwi_drop": 0.18, "ndvi_drop": 0.12}
    res = classify_drought(stats, th)
    assert res["detected"] is True
    assert res["severity"] in ("medium", "high", "low")

    # High: ndwi_drop > 0.20 or ndvi_drop > 0.15
    res_high = classify_drought({"ndwi_drop": 0.21, "ndvi_drop": 0.05}, th)
    assert res_high["severity"] == "high"

    # Medium by ndvi_drop band
    res_med = classify_drought({"ndwi_drop": 0.13, "ndvi_drop": 0.12}, th)
    # Signal gate requires ndwi_drop > 0.12 AND ndvi_drop > 0.08 -> True
    assert res_med["detected"] is True
    assert res_med["severity"] == "medium"

    # Below signal: not detected
    res_none = classify_drought({"ndwi_drop": 0.05, "ndvi_drop": 0.2}, th)
    assert res_none["detected"] is False
    assert res_none["severity"] == "none"


@pytest.mark.timeout(30)
def test_classify_stress_levels():
    th = Thresholds()
    # Medium: tdvi_delta in [0.10,0.15) and ndvi_drop >= 0.05
    res_med = classify_stress({"tdvi_delta": 0.12, "ndvi_drop": 0.10}, th)
    assert res_med["detected"] is True
    assert res_med["severity"] == "medium"

    # High: ndvi_drop > 0.15
    res_high = classify_stress({"tdvi_delta": 0.05, "ndvi_drop": 0.16}, th)
    # Signal requires tdvi_delta > 0.08 AND ndvi_drop > 0.05 -> False here, so expect none
    assert res_high["detected"] is False
    assert res_high["severity"] == "none"

    # High via tdvi_delta
    res_high2 = classify_stress({"tdvi_delta": 0.16, "ndvi_drop": 0.10}, th)
    assert res_high2["detected"] is True
    assert res_high2["severity"] == "high"


@pytest.mark.timeout(30)
def test_decide_auto_picks_best_score():
    th = Thresholds()
    # Construct stats that produce some score for flood and drought; flood higher
    flood_stats = {"ndwi_delta": 0.30, "ndwi_post_mean": 0.30, "ndvi_drop": 0.0, "tdvi_delta": 0.0}
    best = decide_auto(flood_stats, th)
    assert best["event"] == "flood"

    # Make drought stronger
    drought_stats = {"ndwi_drop": 0.30, "ndvi_drop": 0.20, "ndwi_delta": 0.0, "ndwi_post_mean": 0.0, "tdvi_delta": 0.0}
    best2 = decide_auto(drought_stats, th)
    assert best2["event"] == "drought"


@pytest.mark.timeout(30)
def test_compute_window_stats_numbers():
    # Construct pre and post with concrete values
    pre = pd.DataFrame({"date": [date(2024, 1, 1), date(2024, 1, 2)], "ndvi": [0.6, 0.6], "ndwi": [0.1, 0.1], "tdvi": [0.05, 0.05]})
    post = pd.DataFrame({"date": [date(2024, 1, 3), date(2024, 1, 4)], "ndvi": [0.5, 0.5], "ndwi": [0.3, 0.3], "tdvi": [0.20, 0.20]})
    stats = compute_window_stats(pre, post)
    assert pytest.approx(stats["ndvi_pre_mean"], 1e-6) == 0.6
    assert pytest.approx(stats["ndvi_post_mean"], 1e-6) == 0.5
    assert pytest.approx(stats["ndvi_drop"], 1e-6) == 0.1
    assert pytest.approx(stats["ndwi_delta"], 1e-6) == 0.2
    assert pytest.approx(stats["tdvi_delta"], 1e-6) == 0.15