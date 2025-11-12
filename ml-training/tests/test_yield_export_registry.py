import os
import sys
import json
import yaml
import pytest

# Ensure ml-training root is importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

# Ensure yield module dir is importable
YIELD_DIR = os.path.join(ML_TRAINING_ROOT, "yield")
if YIELD_DIR not in sys.path:
    sys.path.insert(0, YIELD_DIR)

import train_rf as train_rf  # noqa: E402
import export_rf as export_rf  # noqa: E402


def _write_min_yield_cfg(path: str) -> str:
    cfg = {
        "experiment": {"seed": 1337},
        "paths": {
            # runs_dir provided by env RUNS_DIR via fixture
        },
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
                # leave empty: features.build_features() will synthesize sources if CSVs are missing
            },
        },
    }
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f)
    return path


@pytest.mark.timeout(180)
def test_yield_rf_export_and_registry_update(tmp_dirs, tmp_path):
    runs_dir = tmp_dirs["RUNS_DIR"]
    version = "1.0.0"

    # 1) Minimal config (synth features)
    cfg_path = str(tmp_path / "yield_cfg.yaml")
    _write_min_yield_cfg(cfg_path)

    # 2) Train RF (produces best.joblib and train_summary.json)
    rc = train_rf.main(["--config", cfg_path])
    assert rc == 0

    # 3) Export to versioned artifacts and update registry
    rc = export_rf.main(["--config", cfg_path, "--version", version])
    assert rc == 0

    # 4) Assert artifacts exist
    model_root = os.path.join("ml-training", "models", "yield_rf", version)
    joblib_path = os.path.join(model_root, "model.joblib")
    onnx_path = os.path.join(model_root, "model.onnx")
    metrics_path = os.path.join(model_root, "metrics.json")
    sha_path = os.path.join(model_root, "sha256.txt")
    registry_path = os.path.join("ml-training", "model_registry.json")

    for p in [joblib_path, onnx_path, metrics_path, sha_path, registry_path]:
        assert os.path.isfile(p), f"Missing expected artifact: {p}"

    # 5) Verify sha256 contains both entries
    with open(sha_path, "r", encoding="utf-8") as f:
        sha_lines = [ln.strip() for ln in f if ln.strip()]
    assert any(ln.startswith("model.joblib ") for ln in sha_lines)
    assert any(ln.startswith("model.onnx ") for ln in sha_lines)

    # 6) Verify registry entry appended/updated
    with open(registry_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
    assert isinstance(registry, list) and len(registry) >= 1

    expected_uri = f"ml-training/models/yield_rf/{version}"
    records = [r for r in registry if r.get("model_name") == "yield_rf" and r.get("version") == version and r.get("uri") == expected_uri]
    assert len(records) >= 1, f"Registry must contain yield_rf {version} at {expected_uri}"

    rec = records[-1]
    assert isinstance(rec.get("sha256", ""), str) and len(rec["sha256"]) >= 32
    assert isinstance(rec.get("created_at", ""), str)
    assert "metrics" in rec and isinstance(rec["metrics"], dict)

    # 7) Metrics content should be present (keys may vary but include our core metrics)
    with open(metrics_path, "r", encoding="utf-8") as f:
        m = json.load(f)
    assert isinstance(m, dict)
    for k in ("rmse", "mae", "r2", "n_features", "feature_names"):
        assert k in m, f"Missing metric key {k}"