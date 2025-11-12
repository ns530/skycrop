import datetime as _dt
from dataclasses import dataclass
from typing import Dict, Tuple, Optional, List

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class WindowConfig:
    """Pre/Post event window configuration in days."""
    pre_days: int = 14
    post_days: int = 7


def _to_dt(x: str) -> _dt.date:
    """Parse YYYY-MM-DD to date."""
    return _dt.datetime.strptime(str(x), "%Y-%m-%d").date()


def load_indices_csv(path: str) -> pd.DataFrame:
    """
    Load indices CSV with required columns:
      field_id, date, ndvi, ndwi, tdvi

    Returns a DataFrame with:
      - 'date' coerced to datetime.date
      - numeric ndvi/ndwi/tdvi (non-numeric coerced to NaN)
    """
    df = pd.read_csv(path)
    required = ["field_id", "date", "ndvi", "ndwi", "tdvi"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"indices.csv missing columns: {missing}")

    # Normalize types
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date
    for c in ["ndvi", "ndwi", "tdvi"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def _window_bounds(event_date: _dt.date, cfg: WindowConfig) -> Tuple[_dt.date, _dt.date]:
    """Return (pre_start_inclusive, post_end_inclusive)."""
    pre_start = event_date - _dt.timedelta(days=int(cfg.pre_days))
    post_end = event_date + _dt.timedelta(days=int(cfg.post_days))
    return pre_start, post_end


def slice_windows(
    field_df: pd.DataFrame,
    event_date: _dt.date,
    cfg: WindowConfig,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Slice pre and post windows for a single field DataFrame.

    Pre window: [event_date - pre_days, event_date)  (strictly before event day)
    Post window: (event_date, event_date + post_days] (strictly after event day)
    """
    if "date" not in field_df.columns:
        raise ValueError("field_df must contain 'date' column")

    pre_start, post_end = _window_bounds(event_date, cfg)
    d = field_df["date"]
    pre_mask = (d >= pre_start) & (d < event_date)
    post_mask = (d > event_date) & (d <= post_end)

    pre_df = field_df.loc[pre_mask].sort_values("date")
    post_df = field_df.loc[post_mask].sort_values("date")
    return pre_df, post_df


def _safe_mean(series: pd.Series) -> float:
    s = pd.to_numeric(series, errors="coerce").dropna()
    if len(s) == 0:
        return float("nan")
    return float(np.asarray(s, dtype=np.float64).mean())


def compute_window_stats(
    pre_df: pd.DataFrame,
    post_df: pd.DataFrame,
) -> Dict[str, float]:
    """
    Compute mean per window and deltas for ndvi, ndwi, tdvi.

    Returns:
      {
        "ndvi_pre_mean", "ndvi_post_mean", "ndvi_drop",
        "ndwi_pre_mean", "ndwi_post_mean", "ndwi_delta", "ndwi_drop",
        "tdvi_pre_mean", "tdvi_post_mean", "tdvi_delta"
      }
    """
    ndvi_pre = _safe_mean(pre_df["ndvi"]) if not pre_df.empty else float("nan")
    ndvi_post = _safe_mean(post_df["ndvi"]) if not post_df.empty else float("nan")

    ndwi_pre = _safe_mean(pre_df["ndwi"]) if not pre_df.empty else float("nan")
    ndwi_post = _safe_mean(post_df["ndwi"]) if not post_df.empty else float("nan")

    tdvi_pre = _safe_mean(pre_df["tdvi"]) if not pre_df.empty else float("nan")
    tdvi_post = _safe_mean(post_df["tdvi"]) if not post_df.empty else float("nan")

    ndvi_drop = ndvi_pre - ndvi_post if np.isfinite(ndvi_pre) and np.isfinite(ndvi_post) else float("nan")
    ndwi_delta = ndwi_post - ndwi_pre if np.isfinite(ndwi_pre) and np.isfinite(ndwi_post) else float("nan")
    ndwi_drop = ndwi_pre - ndwi_post if np.isfinite(ndwi_pre) and np.isfinite(ndwi_post) else float("nan")
    tdvi_delta = tdvi_post - tdvi_pre if np.isfinite(tdvi_pre) and np.isfinite(tdvi_post) else float("nan")

    return {
        "ndvi_pre_mean": ndvi_pre,
        "ndvi_post_mean": ndvi_post,
        "ndvi_drop": ndvi_drop,
        "ndwi_pre_mean": ndwi_pre,
        "ndwi_post_mean": ndwi_post,
        "ndwi_delta": ndwi_delta,
        "ndwi_drop": ndwi_drop,
        "tdvi_pre_mean": tdvi_pre,
        "tdvi_post_mean": tdvi_post,
        "tdvi_delta": tdvi_delta,
    }


def summarize_field(
    field_df: pd.DataFrame,
    event_date: _dt.date,
    cfg: Optional[WindowConfig] = None,
) -> Dict[str, float]:
    """
    Convenience wrapper to slice windows and compute stats for a single field.
    """
    cfg = cfg or WindowConfig()
    pre_df, post_df = slice_windows(field_df, event_date, cfg)
    return compute_window_stats(pre_df, post_df)


def per_day_series(
    field_df: pd.DataFrame,
    event_date: _dt.date,
    cfg: Optional[WindowConfig] = None,
) -> Dict[str, List[Tuple[_dt.date, float, str]]]:
    """
    Return per-day sequences for indices within the pre/post windows.
    Useful for downstream pixelwise change mask synthesis in tests.

    Output dict with keys: 'ndvi', 'ndwi', 'tdvi'.
    Each value is a list of tuples (date, value, window_flag) where window_flag in {'pre', 'post'}.
    """
    cfg = cfg or WindowConfig()
    pre_df, post_df = slice_windows(field_df, event_date, cfg)
    out: Dict[str, List[Tuple[_dt.date, float, str]]] = {"ndvi": [], "ndwi": [], "tdvi": []}
    for name in ("ndvi", "ndwi", "tdvi"):
        if not pre_df.empty:
            out[name].extend([(d, float(v), "pre") for d, v in zip(pre_df["date"], pre_df[name]) if pd.notna(v)])
        if not post_df.empty:
            out[name].extend([(d, float(v), "post") for d, v in zip(post_df["date"], post_df[name]) if pd.notna(v)])
        # Keep chronological order
        out[name].sort(key=lambda t: t[0])
    return out


def group_fields(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """
    Group the full indices dataframe by field_id and sort by date.

    Returns dict: field_id -> DataFrame
    """
    groups: Dict[str, pd.DataFrame] = {}
    for fid, g in df.groupby("field_id"):
        gg = g.sort_values("date").reset_index(drop=True)
        groups[str(fid)] = gg
    return groups