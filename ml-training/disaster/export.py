from __future__ import annotations

import os
import sys
import json
import argparse
import hashlib
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import yaml

# Local imports with fallback if executed as a script
try:
    from .run_analysis import _expand_in_obj as _expand_in_obj  # reuse env-var expansion
    from .run_analysis import load_disaster_cfg as load_disaster_cfg
except Exception:
    CURRENT_DIR = os.path.dirname(__file__)
    ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
    if ML_TRAINING_ROOT not in sys.path:
        sys.path.insert(0, ML_TRAINING_ROOT)
    from disaster.run_analysis import _expand_in_obj as _expand_in_obj  # type: ignore
    from disaster.run_analysis import load_disaster_cfg as load_disaster_cfg  # type: ignore


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def _load_yaml_config(path: Optional[str]) -> Dict[str, Any]:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    return _expand_in_obj(cfg)


def _read_summaries(out_dir: str) -> List[Dict[str, Any]]:
    path = os.path.join(out_dir, "summaries.json")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"summaries.json not found in {out_dir}")
    with open(path, "r", encoding="utf-8") as f:
        arr = json.load(f)
    if not isinstance(arr, list):
        raise ValueError("summaries.json must be a list of per-field records")
    return arr


def _majority_event(summaries: List[Dict[str, Any]]) -> str:
    counts: Dict[str, int] = {}
    for rec in summaries:
        ev = str(rec.get("event", ""))
        if not ev:
            continue
        counts[ev] = counts.get(ev, 0) + 1
    if not counts:
        return "flood"
    return sorted(counts.items(), key=lambda x: (-x[1], x[0]))[0][0]


def sha256_of_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _update_model_registry(registry_path: str, record: Dict[str, Any], replace_same_version: bool = True) -> None:
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                arr = json.load(f)
                if not isinstance(arr, list):
                    arr = []
        except Exception:
            arr = []
    else:
        arr = []

    if replace_same_version:
        arr = [r for r in arr if not (r.get("model_name") == record.get("model_name") and r.get("version") == record.get("version"))]
    arr.append(record)

    with open(registry_path, "w", encoding="utf-8") as f:
        json.dump(arr, f, indent=2)


def parse_args(argv=None):
    p = argparse.ArgumentParser("Package disaster analysis outputs and update model registry")
    p.add_argument("--out-dir", type=str, required=True, help="Output directory produced by run_analysis.py")
    p.add_argument("--config", type=str, default="ml-training/config.yaml", help="Path to YAML config")
    p.add_argument("--version", type=str, default=os.getenv("MODEL_VERSION", "1.0.0"), help="Artifact version, e.g., 1.0.0")
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = _load_yaml_config(args.config)
    dcfg = load_disaster_cfg(cfg)

    summaries = _read_summaries(args.out_dir)
    n_fields = len(summaries)
    n_detected = sum(1 for r in summaries if bool(r.get("detected", False)))
    sev_counts: Dict[str, int] = {"high": 0, "medium": 0, "low": 0, "none": 0}
    for r in summaries:
        s = str(r.get("severity", "none"))
        if s not in sev_counts:
            sev_counts[s] = 0
        sev_counts[s] += 1
    majority_ev = _majority_event(summaries)

    # Prepare versioned artifact directory
    model_root = os.path.join("ml-training", "models", "disaster_analysis", args.version)
    _ensure_dir(model_root)

    # Write copies of summary artifacts
    summaries_src = os.path.join(args.out_dir, "summaries.json")
    summaries_dst = os.path.join(model_root, "summaries.json")
    with open(summaries_src, "r", encoding="utf-8") as fsrc, open(summaries_dst, "w", encoding="utf-8") as fdst:
        fdst.write(fsrc.read())

    summaries_csv_src = os.path.join(args.out_dir, "summaries.csv")
    if os.path.isfile(summaries_csv_src):
        summaries_csv_dst = os.path.join(model_root, "summaries.csv")
        with open(summaries_csv_src, "r", encoding="utf-8") as fsrc, open(summaries_csv_dst, "w", encoding="utf-8") as fdst:
            fdst.write(fsrc.read())

    # Manifest with thresholds and run metadata
    manifest = {
        "model_name": "disaster_analysis",
        "version": str(args.version),
        "created_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "config": {
            "windows": {
                "pre_days": dcfg.windows.pre_days,
                "post_days": dcfg.windows.post_days,
            },
            "thresholds": {
                "FLOOD_NDWI_DELTA_MIN": dcfg.thresholds.FLOOD_NDWI_DELTA_MIN,
                "FLOOD_NDWI_ABS_MIN": dcfg.thresholds.FLOOD_NDWI_ABS_MIN,
                "DROUGHT_NDWI_DROP_MIN": dcfg.thresholds.DROUGHT_NDWI_DROP_MIN,
                "DROUGHT_NDVI_DROP_MIN": dcfg.thresholds.DROUGHT_NDVI_DROP_MIN,
                "STRESS_TDVI_DELTA_MIN": dcfg.thresholds.STRESS_TDVI_DELTA_MIN,
            },
            "morphology": {
                "min_area_pixels": dcfg.morphology.min_area_pixels,
                "open_size": dcfg.morphology.open_size,
                "close_size": dcfg.morphology.close_size,
            },
        },
        "stats": {
            "fields_analyzed": n_fields,
            "fields_detected": n_detected,
            "severity_counts": sev_counts,
            "event": majority_ev,
        },
        "source_out_dir": args.out_dir.replace("\\", "/"),
    }
    manifest_path = os.path.join(model_root, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Compute sha256 for manifest and write registry entry
    sha = sha256_of_file(manifest_path)

    registry_path = os.path.join("ml-training", "model_registry.json")
    record = {
        "model_name": "disaster_analysis",
        "version": str(args.version),
        "sha256": sha,
        "uri": f"ml-training/models/disaster_analysis/{args.version}",
        "created_at": datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "metrics": {
            "fields_analyzed": n_fields,
            "event": majority_ev,
        },
    }
    _update_model_registry(registry_path, record, replace_same_version=True)

    print(
        json.dumps(
            {
                "status": "ok",
                "model_root": model_root,
                "manifest": manifest_path,
                "sha256": sha,
                "registry": registry_path,
                "record": record,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())