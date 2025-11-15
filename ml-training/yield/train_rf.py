import os
import sys
import json
import math
import yaml
import argparse
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# Ensure local imports when running as "python ml-training/yield/train_rf.py"
CURRENT_DIR = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from features import build_features  # noqa: E402
from model_rf import (  # noqa: E402
    set_global_seeds,
    build_random_forest,
    regression_metrics,
    get_feature_importances,
    save_joblib,
)
from config_utils import load_and_resolve_config  # noqa: E402


def parse_args(argv=None):
    p = argparse.ArgumentParser("Train Random Forest model for yield prediction")
    p.add_argument("--config", type=str, required=True, help="Path to YAML config with yield_rf block")
    return p.parse_args(argv)


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def _season_to_rank(season_val: Any) -> int:
    """
    Convert season string like '2021' or '2021-2022' to a sortable integer rank (end year).
    Fallback to 0 if cannot parse.
    """
    if season_val is None:
        return 0
    s = str(season_val)
    try:
        if "-" in s:
            parts = s.split("-")
            return int(parts[-1])
        return int(s)
    except Exception:
        return 0


def time_aware_split(df_merged: pd.DataFrame, X: pd.DataFrame, y: pd.Series, seed: int) -> Tuple[np.ndarray, np.ndarray]:
    """
    Returns train_idx, val_idx arrays for splitting.
    - Prefer season-aware split: train on all seasons strictly less than the last season, validate on the last.
    - Fallback to random 80/20 split if seasons not available or only one season.
    """
    if "season" in df_merged.columns:
        seasons = df_merged["season"].unique().tolist()
        if len(seasons) >= 2:
            # Choose last season by numeric rank as validation
            season_ranks = {s: _season_to_rank(s) for s in seasons}
            last_season = sorted(seasons, key=lambda s: season_ranks[s])[-1]
            val_mask = df_merged["season"] == last_season
            val_idx = np.where(val_mask.values)[0]
            train_idx = np.where(~val_mask.values)[0]
            # Guard: if degenerate (e.g., last season has 0 rows), fallback to random
            if len(val_idx) > 0 and len(train_idx) > 0:
                return train_idx, val_idx

    # Fallback: random split with fixed seed
    idx = np.arange(len(X))
    train_idx, val_idx = train_test_split(idx, test_size=0.2, random_state=seed, shuffle=True)
    return np.array(train_idx), np.array(val_idx)


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = load_and_resolve_config(args.config)

    # Seeds and determinism
    seed = int(cfg.get("experiment", {}).get("seed", 1337))
    set_global_seeds(seed)

    # Build features (auto-synthesizes if CSVs missing)
    print("Building features (yield_rf)...")
    X, y, feature_names, df_merged = build_features(cfg, allow_synthetic=True)
    print(f"Feature matrix: {X.shape}, targets: {y.shape}, n_features={len(feature_names)}")

    # Time-aware split
    train_idx, val_idx = time_aware_split(df_merged, X, y, seed=seed)
    X_train, y_train = X.iloc[train_idx].values.astype(np.float32), y.iloc[train_idx].values.astype(np.float32)
    X_val, y_val = X.iloc[val_idx].values.astype(np.float32), y.iloc[val_idx].values.astype(np.float32)
    print(f"Split: train={len(train_idx)} rows, val={len(val_idx)} rows")

    # RF hyperparameters from config
    rf_cfg = cfg.get("yield_rf", {}).get("rf", {}) if cfg else {}
    params = {
        "n_estimators": int(rf_cfg.get("n_estimators", 200)),
        "max_depth": int(rf_cfg["max_depth"]) if rf_cfg.get("max_depth") is not None else None,
        "min_samples_leaf": int(rf_cfg.get("min_samples_leaf", 3)),
        "random_state": int(rf_cfg.get("random_state", seed)),
        "n_jobs": -1,
    }

    # Train model
    model = build_random_forest(params)
    model.fit(X_train, y_train)

    # Validate
    y_pred = model.predict(X_val)
    metrics = regression_metrics(y_val, y_pred)

    # Run paths
    runs_dir = str(cfg.get("paths", {}).get("runs_dir", "./runs"))
    run_root = os.path.join(runs_dir, "yield_rf")
    ckpt_dir = os.path.join(run_root, "checkpoints")
    _ensure_dir(ckpt_dir)

    # Save checkpoint (best)
    best_ckpt_path = os.path.join(ckpt_dir, "best.joblib")
    save_joblib(model, best_ckpt_path)

    # Feature importances
    importances = get_feature_importances(model, feature_names)

    # Train summary
    summary = {
        "status": "ok",
        "best_checkpoint": best_ckpt_path.replace("\\", "/"),
        "val_metrics": {
            "rmse": metrics["rmse"],
            "mae": metrics["mae"],
            "r2": metrics["r2"],
        },
        "params": params,
        "n_features": len(feature_names),
        "feature_names": feature_names,
        "train_rows": int(len(train_idx)),
        "val_rows": int(len(val_idx)),
        "feature_importances": importances,
    }
    with open(os.path.join(run_root, "train_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())