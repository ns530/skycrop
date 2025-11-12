import os
import sys
import json
import csv
import tempfile
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
import infer_rf as infer_rf  # noqa: E402


def _write_min_yield_cfg(path: str) -> str:
    import yaml
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
                # leave empty to use synthetic sources
            },
        },
    }
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(cfg, f)
    return path


@pytest.mark.timeout(120)
def test_yield_infer_cli_with_onnx(tmp_dirs, tmp_path):
    runs_dir = tmp_dirs["RUNS_DIR"]
    version = "1.0.0"

    # Train + export to generate ONNX and metrics.json with feature_names
    cfg_path = str(tmp_path / "yield_cfg.yaml")
    _write_min_yield_cfg(cfg_path)
    rc = train_rf.main(["--config", cfg_path])
    assert rc == 0
    rc = export_rf.main(["--config", cfg_path, "--version", version])
    assert rc == 0

    model_root = os.path.join("ml-training", "models", "yield_rf", version)
    onnx_path = os.path.join(model_root, "model.onnx")
    metrics_path = os.path.join(model_root, "metrics.json")
    assert os.path.isfile(onnx_path)
    assert os.path.isfile(metrics_path)

    # Load feature_names and prepare a tiny CSV with two rows
    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)
    feature_names = metrics.get("feature_names", [])
    assert isinstance(feature_names, list) and len(feature_names) > 0

    csv_path = str(tmp_path / "input_features.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=feature_names)
        writer.writeheader()
        # two dummy rows (zeros and small constants)
        row0 = {c: 0.0 for c in feature_names}
        row1 = {c: (0.1 if i % 7 == 0 else 0.0) for i, c in enumerate(feature_names)}
        writer.writerow(row0)
        writer.writerow(row1)

    out_path = str(tmp_path / "preds.json")
    rc = infer_rf.main(["--model", onnx_path, "--input", csv_path, "--out", out_path])
    assert rc == 0
    assert os.path.isfile(out_path)

    with open(out_path, "r", encoding="utf-8") as f:
        out = json.load(f)
    assert out.get("status") == "ok"
    assert out.get("n") == 2
    assert isinstance(out.get("feature_names"), list)
    preds = out.get("predictions")
    assert isinstance(preds, list) and len(preds) == 2
    for i, p in enumerate(preds):
        assert "row_index" in p and p["row_index"] == i
        assert "prediction" in p