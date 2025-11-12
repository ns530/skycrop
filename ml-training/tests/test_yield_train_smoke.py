import os
import sys
import json
import yaml
import pytest

# Ensure ml-training is importable from repo root
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

YIELD_DIR = os.path.join(ML_TRAINING_ROOT, "yield")
if YIELD_DIR not in sys.path:
    sys.path.insert(0, YIELD_DIR)
import train_rf as train_rf  # noqa: E402


def _write_min_yield_cfg(path: str) -> str:
    cfg = {
        "experiment": {"seed": 1337},
        "yield_rf": {
            "version": "1.0.0",
            "windows": {"w7": 7, "w14": 14, "w30": 30},
            "rf": {"n_estimators": 50, "max_depth": 8, "min_samples_leaf": 2, "random_state": 1337},
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
                # use synthetic sources by leaving CSVs absent
            },
        },
        # paths: runs_dir is overridden by env RUNS_DIR in fixture
    }
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f)
    return path


@pytest.mark.timeout(120)
def test_yield_rf_smoke_train(tmp_dirs, tmp_path):
    runs_dir = tmp_dirs["RUNS_DIR"]
    cfg_path = str(tmp_path / "yield_cfg.yaml")
    _write_min_yield_cfg(cfg_path)

    rc = train_rf.main(["--config", cfg_path])
    assert rc == 0

    # Check outputs
    run_root = os.path.join(runs_dir, "yield_rf")
    summary_path = os.path.join(run_root, "train_summary.json")
    ckpt_path = os.path.join(run_root, "checkpoints", "best.joblib")

    assert os.path.isfile(summary_path), "train_summary.json must exist"
    assert os.path.isfile(ckpt_path), "best.joblib checkpoint must exist"

    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    # Metrics keys present
    assert "val_metrics" in summary
    for k in ("rmse", "mae", "r2"):
        assert k in summary["val_metrics"], f"Missing metric {k}"
    # Sanity on feature info
    assert summary.get("n_features", 0) > 0
    assert isinstance(summary.get("feature_names", []), list)