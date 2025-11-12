from .features import WindowConfig, load_indices_csv, slice_windows, compute_window_stats, summarize_field, per_day_series, group_fields
from .algorithms import (
    Thresholds,
    MorphologyConfig,
    classify_flood,
    classify_drought,
    classify_stress,
    decide_auto,
    build_change_mask,
    synthetic_mask_from_severity,
)
from .polygonize import MorphologyConfig as PolyMorphologyConfig, clean_mask, polygonize_mask, save_geojson

__all__ = [
    # features
    "WindowConfig",
    "load_indices_csv",
    "slice_windows",
    "compute_window_stats",
    "summarize_field",
    "per_day_series",
    "group_fields",
    # algorithms
    "Thresholds",
    "MorphologyConfig",
    "classify_flood",
    "classify_drought",
    "classify_stress",
    "decide_auto",
    "build_change_mask",
    "synthetic_mask_from_severity",
    # polygonize
    "PolyMorphologyConfig",
    "clean_mask",
    "polygonize_mask",
    "save_geojson",
]