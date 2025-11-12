import os
import sys
import json
import csv
from datetime import date

import pytest

# Ensure ml-training directory importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from disaster import run_analysis as da_run  # noqa: E402
from disaster import export as da_export  # noqa: E402


def _write_indices_csv(path: str) -> str:
    """
    Write a small synthetic indices.csv with two fields around an event date 2024-06-15.
    Columns: field_id, date, ndvi, ndwi, tdvi
    """
    rows = []
    # Field F1: Flood-like signal (NDWI increases post)
    # pre window
    rows.append(["F1", "2024-06-10", 0.60, 0.05, 0.05])
    rows.append(["F1", "2024-06-14", 0.60, 0.06, 0.06])
    # event day (ignored by windowing)
    rows.append(["F1", "2024-06-15", 0.60, 0.07, 0.06])
    # post window
    rows.append(["F1", "2024-06-16", 0.50, 0.25, 0.20])
    rows.append(["F1", "2024-06-20", 0.50, 0.24, 0.21])

    # Field F2: Also flood-like, slightly lower magnitude
    rows.append(["F2", "2024-06-05", 0.55, 0.04, 0.05])
    rows.append(["F2", "2024-06-12", 0.55, 0.05, 0.05])
    rows.append(["F2", "2024-06-15", 0.55, 0.06, 0.05])
    rows.append(["F2", "2024-06-17", 0.48, 0.20, 0.18])
    rows.append(["F2", "2024-06-22", 0.48, 0.21, 0.19])

    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["field_id", "date", "ndvi", "ndwi", "tdvi"])
        w.writerows(rows)
    return path


@pytest.mark.timeout(90)
def test_disaster_cli_and_export_end_to_end(tmp_path):
    indices_csv = str(tmp_path / "indices.csv")
    _write_indices_csv(indices_csv)

    out_dir = str(tmp_path / "out")
    os.makedirs(out_dir, exist_ok=True)

    # Run CLI for flood with GeoJSON output
    rc = da_run.main(
        [
            "--indices",
            indices_csv,
            "--event-date",
            "2024-06-15",
            "--event",
            "flood",
            "--out-dir",
            out_dir,
            "--config",
            "ml-training/config.yaml",
            "--write-geojson",
        ]
    )
    assert rc == 0

    # Validate summaries
    summaries_path = os.path.join(out_dir, "summaries.json")
    assert os.path.isfile(summaries_path)
    with open(summaries_path, "r", encoding="utf-8") as f:
        summaries = json.load(f)
    assert isinstance(summaries, list)
    assert len(summaries) == 2

    # Each summary should have expected keys and detection True (flood-like)
    for rec in summaries:
        assert "field_id" in rec and "event" in rec and "severity" in rec and "metrics" in rec
        assert rec["event"] == "flood"
        # flood severity should not be 'none' given constructed deltas
        assert rec["detected"] is True
        assert rec["severity"] in ("low", "medium", "high")

    # GeoJSON outputs exist for both fields
    gdir = os.path.join(out_dir, "masks", "geojson")
    assert os.path.isdir(gdir)
    expected = {f"{r['field_id']}_flood_2024-06-15.geojson" for r in summaries}
    produced = set(os.listdir(gdir))
    assert expected.issubset(produced)

    # Export artifacts and registry update
    version = "1.0.0"
    rc2 = da_export.main(
        [
            "--out-dir",
            out_dir,
            "--config",
            "ml-training/config.yaml",
            "--version",
            version,
        ]
    )
    assert rc2 == 0

    model_root = os.path.join("ml-training", "models", "disaster_analysis", version)
    manifest_path = os.path.join(model_root, "manifest.json")
    summaries_copy = os.path.join(model_root, "summaries.json")

    # Check artifacts
    assert os.path.isdir(model_root)
    assert os.path.isfile(manifest_path)
    assert os.path.isfile(summaries_copy)

    # Manifest content checks
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert manifest.get("model_name") == "disaster_analysis"
    assert manifest.get("version") == version
    stats = manifest.get("stats", {})
    assert stats.get("fields_analyzed") == 2
    assert stats.get("event") == "flood"

    # Registry updated
    reg_path = os.path.join("ml-training", "model_registry.json")
    assert os.path.isfile(reg_path)
    with open(reg_path, "r", encoding="utf-8") as f:
        registry = json.load(f)
    assert isinstance(registry, list) and len(registry) >= 1
    recs = [r for r in registry if r.get("model_name") == "disaster_analysis" and r.get("version") == version]
    assert recs, "Registry must contain disaster_analysis record"
    rec = recs[-1]
    assert isinstance(rec.get("sha256", ""), str) and len(rec["sha256"]) >= 32
    assert rec.get("metrics", {}).get("fields_analyzed") == 2
    assert rec.get("metrics", {}).get("event") == "flood"