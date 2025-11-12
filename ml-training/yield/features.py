import os
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd


# Allow importing project modules when running as "python ml-training/yield/features.py"
CURRENT_DIR = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)


@dataclass
class YieldRFConfig:
    # Window sizes
    w7: int = 7
    w14: int = 14
    w30: int = 30

    # Feature toggles
    use_ndvi: bool = True
    use_ndwi: bool = True
    use_tdvi: bool = True
    use_rain_cum: bool = True
    use_degree_days: bool = True
    use_seasonality: bool = True
    use_area: bool = False
    base_temp_c: float = 10.0

    # Paths
    labels_csv: str = "./data/yield/raw/train.csv"
    indices_csv: str = "./data/yield/features/indices.csv"
    weather_csv: str = "./data/yield/features/weather.csv"
    fields_csv: Optional[str] = "./data/yield/features/fields.csv"  # optional


def _cfg_from_dict(cfg: Dict[str, Any]) -> YieldRFConfig:
    ycfg = cfg.get("yield_rf", {}) if cfg else {}
    windows = ycfg.get("windows", {}) or {}
    feats = ycfg.get("features", {}) or {}
    paths = ycfg.get("paths", {}) or {}
    rf_cfg = YieldRFConfig(
        w7=int(windows.get("w7", 7)),
        w14=int(windows.get("w14", 14)),
        w30=int(windows.get("w30", 30)),
        use_ndvi=bool(feats.get("ndvi", True)),
        use_ndwi=bool(feats.get("ndwi", True)),
        use_tdvi=bool(feats.get("tdvi", True)),
        use_rain_cum=bool(feats.get("rain_cum", True)),
        use_degree_days=bool(feats.get("degree_days", True)),
        use_seasonality=bool(feats.get("seasonality", True)),
        use_area=bool(feats.get("area", False)),
        base_temp_c=float(feats.get("base_temp_c", 10.0)),
        labels_csv=str(paths.get("labels_csv", "./data/yield/raw/train.csv")),
        indices_csv=str(paths.get("indices_csv", "./data/yield/features/indices.csv")),
        weather_csv=str(paths.get("weather_csv", "./data/yield/features/weather.csv")),
        fields_csv=str(paths.get("fields_csv", "./data/yield/features/fields.csv")) if paths.get("fields_csv") else None,
    )
    return rf_cfg


def _ensure_datetime(df: pd.DataFrame, col: str = "date") -> pd.DataFrame:
    if col in df.columns and not np.issubdtype(df[col].dtype, np.datetime64):
        df[col] = pd.to_datetime(df[col])
    return df


def _rolling_stats(g: pd.DataFrame, value_col: str, windows: List[int], prefix: str) -> pd.DataFrame:
    out = pd.DataFrame(index=g.index)
    for w in windows:
        roll = g[value_col].rolling(window=w, min_periods=1)
        out[f"{prefix}_mean_{w}d"] = roll.mean()
        out[f"{prefix}_std_{w}d"] = roll.std().fillna(0.0)
        out[f"{prefix}_min_{w}d"] = roll.min()
        out[f"{prefix}_max_{w}d"] = roll.max()
    return out


def _rolling_sum(g: pd.DataFrame, value_col: str, windows: List[int], prefix: str) -> pd.DataFrame:
    out = pd.DataFrame(index=g.index)
    for w in windows:
        out[f"{prefix}_sum_{w}d"] = g[value_col].rolling(window=w, min_periods=1).sum()
    return out


def _seasonality_features(dates: pd.Series) -> pd.DataFrame:
    # Month sin/cos
    month = dates.dt.month.astype(float)
    month_sin = np.sin(2 * np.pi * month / 12.0)
    month_cos = np.cos(2 * np.pi * month / 12.0)
    return pd.DataFrame({"month_sin": month_sin, "month_cos": month_cos}, index=dates.index)


def _degree_days_daily(tmin: pd.Series, tmax: pd.Series, base_temp_c: float) -> pd.Series:
    tmean = (tmin + tmax) / 2.0
    gdd = np.clip(tmean - base_temp_c, a_min=0.0, a_max=None)
    return gdd


def _make_synthetic_sources(seed: int = 1337) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Create minimal synthetic label, indices, and weather CSV-equivalent DataFrames
    for tests when files are missing. Two seasons and a few fields.
    """
    rng = np.random.RandomState(seed)
    # Fields and dates
    fields = [f"field_{i}" for i in range(3)]
    start = pd.Timestamp("2021-01-01")
    days = 60
    all_rows = []
    for fid in fields:
        for d in range(days):
            dt = start + pd.Timedelta(days=d)
            # Synthetic signals
            ndvi = 0.3 + 0.2 * np.sin(2 * np.pi * d / 30.0) + 0.05 * rng.randn()
            ndvi = float(np.clip(ndvi, 0, 1))
            ndwi = 0.2 + 0.1 * np.cos(2 * np.pi * d / 20.0) + 0.05 * rng.randn()
            ndwi = float(np.clip(ndwi, 0, 1))
            tdvi = 0.1 + 0.3 * np.sin(2 * np.pi * d / 15.0) + 0.05 * rng.randn()
            tdvi = float(np.clip(tdvi, 0, 1))
            rain = float(np.clip(rng.gamma(shape=1.5, scale=2.0) * (1 if d % 5 == 0 else 0.2), 0, 50))
            tmin = float(12 + 6 * np.sin(2 * np.pi * d / 30.0) + rng.randn())
            tmax = float(22 + 6 * np.sin(2 * np.pi * d / 30.0) + rng.randn())
            all_rows.append((fid, dt, ndvi, ndwi, tdvi, rain, tmin, tmax))
    idx_df = pd.DataFrame(all_rows, columns=["field_id", "date", "ndvi", "ndwi", "tdvi", "rain_mm", "tmin", "tmax"])
    idx_df["date"] = pd.to_datetime(idx_df["date"])
    # Weather DF is a subset of relevant columns
    weather_df = idx_df[["field_id", "date", "rain_mm", "tmin", "tmax"]].copy()

    # Labels at end of window (simulate harvest at last day)
    label_rows = []
    for fid in fields:
        last_date = start + pd.Timedelta(days=days - 1)
        # Simple yield generator: function of average NDVI and cumulative rain
        subset = idx_df[(idx_df["field_id"] == fid)]
        y = 3000 + 2000 * float(subset["ndvi"].mean()) + 0.2 * float(subset["rain_mm"].sum()) + rng.randn() * 50
        label_rows.append((fid, "2021", last_date, float(y)))
    labels_df = pd.DataFrame(label_rows, columns=["field_id", "season", "date", "yield_kg_per_ha"])
    labels_df["date"] = pd.to_datetime(labels_df["date"])

    return labels_df, idx_df[["field_id", "date", "ndvi", "ndwi", "tdvi"]].copy(), weather_df


def _load_sources(cfg: YieldRFConfig, allow_synthetic: bool = True) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Optional[pd.DataFrame]]:
    labels = None
    indices = None
    weather = None
    fields = None

    files_missing = []
    if os.path.isfile(cfg.labels_csv):
        labels = pd.read_csv(cfg.labels_csv)
    else:
        files_missing.append(cfg.labels_csv)

    if os.path.isfile(cfg.indices_csv):
        indices = pd.read_csv(cfg.indices_csv)
    else:
        files_missing.append(cfg.indices_csv)

    if os.path.isfile(cfg.weather_csv):
        weather = pd.read_csv(cfg.weather_csv)
    else:
        files_missing.append(cfg.weather_csv)

    if cfg.fields_csv and os.path.isfile(cfg.fields_csv):
        fields = pd.read_csv(cfg.fields_csv)

    if (labels is None or indices is None or weather is None) and allow_synthetic:
        labels, indices, weather = _make_synthetic_sources()
        fields = None  # synthetic does not include area

    if labels is None or indices is None or weather is None:
        raise FileNotFoundError(
            f"Missing required CSVs: {', '.join(files_missing)}. "
            "Provide files or allow_synthetic=True."
        )

    labels = _ensure_datetime(labels, "date")
    indices = _ensure_datetime(indices, "date")
    weather = _ensure_datetime(weather, "date")
    if fields is not None and "area_ha" in fields.columns:
        pass

    return labels, indices, weather, fields


def _compute_features_per_field_date(
    indices: pd.DataFrame,
    weather: pd.DataFrame,
    fields: Optional[pd.DataFrame],
    cfg: YieldRFConfig,
) -> pd.DataFrame:
    # Sort for rolling operations
    indices = indices.sort_values(["field_id", "date"]).reset_index(drop=True)
    weather = weather.sort_values(["field_id", "date"]).reset_index(drop=True)

    windows = [cfg.w7, cfg.w14, cfg.w30]
    feat_frames: List[pd.DataFrame] = []

    base = indices[["field_id", "date"]].copy().drop_duplicates().reset_index(drop=True)
    base_key = ["field_id", "date"]

    # Indices rolling stats
    if cfg.use_ndvi and "ndvi" in indices.columns:
        feats = (
            indices.groupby("field_id", group_keys=False)
            .apply(lambda g: _rolling_stats(g.set_index("date"), "ndvi", windows, "ndvi").reset_index())
        )
        feat_frames.append(feats)
    if cfg.use_ndwi and "ndwi" in indices.columns:
        feats = (
            indices.groupby("field_id", group_keys=False)
            .apply(lambda g: _rolling_stats(g.set_index("date"), "ndwi", windows, "ndwi").reset_index())
        )
        feat_frames.append(feats)
    if cfg.use_tdvi and "tdvi" in indices.columns:
        feats = (
            indices.groupby("field_id", group_keys=False)
            .apply(lambda g: _rolling_stats(g.set_index("date"), "tdvi", windows, "tdvi").reset_index())
        )
        feat_frames.append(feats)

    # Weather aggregations
    wrk = weather.copy()
    # Degree-days per day
    if cfg.use_degree_days and {"tmin", "tmax"}.issubset(set(wrk.columns)):
        wrk["gdd"] = _degree_days_daily(wrk["tmin"], wrk["tmax"], base_temp_c=cfg.base_temp_c)
    if cfg.use_rain_cum and "rain_mm" in wrk.columns:
        pass

    if cfg.use_rain_cum and "rain_mm" in wrk.columns:
        feats = (
            wrk.groupby("field_id", group_keys=False)
            .apply(lambda g: _rolling_sum(g.set_index("date"), "rain_mm", windows, "rain").reset_index())
        )
        feat_frames.append(feats)

    if cfg.use_degree_days and "gdd" in wrk.columns:
        feats = (
            wrk.groupby("field_id", group_keys=False)
            .apply(lambda g: _rolling_sum(g.set_index("date"), "gdd", windows, "gdd").reset_index())
        )
        feat_frames.append(feats)

    # Merge all feature frames onto base keys
    feat_df = base.copy()
    for f in feat_frames:
        feat_df = feat_df.merge(f, on=base_key, how="left")

    # Seasonality features from date
    if cfg.use_seasonality:
        season_df = _seasonality_features(feat_df["date"])
        season_df[["field_id", "date"]] = feat_df[["field_id", "date"]].to_numpy()
        feat_df = feat_df.merge(season_df, on=["field_id", "date"], how="left")

    # Optional static area
    if cfg.use_area and fields is not None and "area_ha" in fields.columns:
        area_df = fields[["field_id", "area_ha"]].drop_duplicates()
        feat_df = feat_df.merge(area_df, on="field_id", how="left")

    return feat_df


def build_features(
    cfg: Dict[str, Any],
    allow_synthetic: bool = True,
) -> Tuple[pd.DataFrame, pd.Series, List[str], pd.DataFrame]:
    """
    Build aligned features and labels for Random Forest yield prediction.

    Inputs (documented, enforced in code and README):
      - labels_csv: ${DATA_DIR}/yield/raw/train.csv with columns:
            field_id, season (YYYY or YYYY-YYYY), date (ISO), yield_kg_per_ha
      - indices_csv: ${DATA_DIR}/yield/features/indices.csv with columns:
            field_id, date, ndvi, ndwi, tdvi
      - weather_csv: ${DATA_DIR}/yield/features/weather.csv with columns:
            field_id, date, rain_mm, tmin, tmax
      - fields_csv (optional): field statics e.g., area_ha: columns:
            field_id, area_ha

    Aggregations (defaults from config):
      - For NDVI/NDWI/TDVI: rolling mean/std/min/max over 7/14/30 days
      - Weather: cumulative rain over 7/14/30 days; degree-days (GDD) rolling sums
      - Seasonality: month_sin, month_cos
      - Optional statics: area_ha

    Alignment:
      - Features are computed per (field_id, date). Labels are aligned by exact (field_id, date).
        If multiple labels per (field_id, season) are present, each row is matched by its date.

    Returns:
      - X: pandas DataFrame (numeric features)
      - y: pandas Series (yield_kg_per_ha)
      - feature_names: List[str], columns of X in order
      - df_merged: full DataFrame with id/date/season/label and features (for inspection)

    Notes:
      - If input CSVs are missing and allow_synthetic is True, generates a tiny synthetic dataset.
    """
    ycfg = _cfg_from_dict(cfg)

    labels_df, indices_df, weather_df, fields_df = _load_sources(ycfg, allow_synthetic=allow_synthetic)

    # Compute features per (field_id, date)
    feat_df = _compute_features_per_field_date(indices_df, weather_df, fields_df, ycfg)

    # Align labels by (field_id, date)
    # Ensure columns exist and types are correct
    for df in (labels_df, feat_df):
        if "field_id" not in df.columns or "date" not in df.columns:
            raise ValueError("Both labels and features must contain 'field_id' and 'date' columns.")
    labels_df = labels_df.sort_values(["field_id", "date"]).reset_index(drop=True)
    feat_df = feat_df.sort_values(["field_id", "date"]).reset_index(drop=True)

    merged = pd.merge(
        labels_df[["field_id", "season", "date", "yield_kg_per_ha"]],
        feat_df,
        on=["field_id", "date"],
        how="left",
        validate="many_to_one",
    )

    # Add basic season one-hots (optional): keep low-cardinality
    if ycfg.use_seasonality and "season" in merged.columns:
        # Only one-hot if small number of seasons to avoid explosion
        if merged["season"].nunique() <= 6:
            dummies = pd.get_dummies(merged["season"], prefix="season", dtype=float)
            merged = pd.concat([merged, dummies], axis=1)

    # Select feature columns (numeric, excluding identifiers and target)
    exclude_cols = {"field_id", "season", "date", "yield_kg_per_ha"}
    feature_cols = [c for c in merged.columns if c not in exclude_cols and pd.api.types.is_numeric_dtype(merged[c])]

    # Fill NaNs from rolling with conservative values
    X = merged[feature_cols].copy().fillna(method="ffill").fillna(method="bfill").fillna(0.0)
    y = merged["yield_kg_per_ha"].astype(float)

    return X, y, feature_cols, merged


__all__ = ["build_features", "YieldRFConfig"]