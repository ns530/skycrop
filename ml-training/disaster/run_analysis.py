from __future__ import annotations

import os
import sys
import json
import argparse
from dataclasses import dataclass
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
import pandas as pd
import yaml

# Import disaster modules with fallback when executed as a script
try:
    from .features import load_indices_csv, group_fields, summarize_field, WindowConfig
    from .algorithms import (
        Thresholds,
        MorphologyConfig as AlgoMorphologyConfig,
        classify_flood,
        classify_drought,
        classify_stress,
        decide_auto,
        synthetic_mask_from_severity,
    )
    from . import polygonize as poly
except Exception:
    CURRENT_DIR = os.path.dirname(__file__)
    ML_TRAINING_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
    if ML_TRAINING_ROOT not in sys.path:
        sys.path.insert(0, ML_TRAINING_ROOT)
    from disaster.features import load_indices_csv, group_fields, summarize_field, WindowConfig  # type: ignore
    from disaster.algorithms import (  # type: ignore
        Thresholds,
        MorphologyConfig as AlgoMorphologyConfig,
        classify_flood,
        classify_drought,
        classify_stress,
        decide_auto,
        synthetic_mask_from_severity,
    )
    from disaster import polygonize as poly  # type: ignore


@dataclass(frozen=True)
class DisasterConfig:
    windows: WindowConfig
    thresholds: Thresholds
    morphology: AlgoMorphologyConfig
    version: str = "1.0.0"


def _expand_env_style_vars(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    out = os.path.expandvars(value)

    def _replace_default(match):
        inner = match.group(1)
        if ":-" in inner:
            var, default = inner.split(":-", 1)
            return os.getenv(var, default)
        return os.getenv(inner, "")

    import re

    out = re.sub(r"\$\{([^}]+)\}", _replace_default, out)
    return out


def _expand_in_obj(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _expand_in_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_expand_in_obj(v) for v in obj]
    return _expand_env_style_vars(obj)


def _load_yaml_config(path: Optional[str]) -> Dict[str, Any]:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    return _expand_in_obj(cfg)


def load_disaster_cfg(cfg: Dict[str, Any], override_pre: Optional[int] = None, override_post: Optional[int] = None) -> DisasterConfig:
    d = cfg.get("disaster", {}) if isinstance(cfg, dict) else {}
    win = d.get("windows", {}) if isinstance(d, dict) else {}
    thr = d.get("thresholds", {}) if isinstance(d, dict) else {}
    morph = d.get("morphology", {}) if isinstance(d, dict) else {}

    pre_days = int(override_pre) if override_pre is not None else int(win.get("pre_days", 14))
    post_days = int(override_post) if override_post is not None else int(win.get("post_days", 7))

    windows = WindowConfig(pre_days=pre_days, post_days=post_days)
    thresholds = Thresholds(
        FLOOD_NDWI_DELTA_MIN=float(thr.get("FLOOD_NDWI_DELTA_MIN", 0.15)),
        FLOOD_NDWI_ABS_MIN=float(thr.get("FLOOD_NDWI_ABS_MIN", 0.1)),
        DROUGHT_NDWI_DROP_MIN=float(thr.get("DROUGHT_NDWI_DROP_MIN", 0.12)),
        DROUGHT_NDVI_DROP_MIN=float(thr.get("DROUGHT_NDVI_DROP_MIN", 0.08)),
        STRESS_TDVI_DELTA_MIN=float(thr.get("STRESS_TDVI_DELTA_MIN", 0.08)),
    )
    morphology = AlgoMorphologyConfig(
        min_area_pixels=int(morph.get("min_area_pixels", 50)),
        open_size=int(morph.get("open_size", 2)),
        close_size=int(morph.get("close_size", 2)),
    )
    version = str(d.get("version", "1.0.0"))
    return DisasterConfig(windows=windows, thresholds=thresholds, morphology=morphology, version=version)


def parse_args(argv=None):
    p = argparse.ArgumentParser("Run disaster damage analysis from indices.csv (NDVI/NDWI/TDVI)")
    p.add_argument("--indices", type=str, required=True, help="Path to indices.csv (columns: field_id,date,ndvi,ndwi,tdvi)")
    p.add_argument("--event-date", type=str, required=True, help="Event date (YYYY-MM-DD)")
    p.add_argument("--event", type=str, choices=["flood", "drought", "stress", "auto"], default="auto", help="Event type")
    p.add_argument("--out-dir", type=str, required=True, help="Output directory for summaries and optional GeoJSON")
    p.add_argument("--config", type=str, default="ml-training/config.yaml", help="Path to YAML config (for thresholds/morphology)")
    p.add_argument("--field-id", type=str, default=None, help="Optional single field to analyze")
    p.add_argument("--pre-days", type=int, default=None, help="Override pre window days (default from config)")
    p.add_argument("--post-days", type=int, default=None, help="Override post window days (default from config)")
    p.add_argument("--write-geojson", action="store_true", help="Write per-field damage GeoJSON polygons")
    return p.parse_args(argv)


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def _to_date(s: str) -> date:
    return datetime.strptime(str(s), "%Y-%m-%d").date()


def _classify(event: str, stats: Dict[str, float], thresholds: Thresholds) -> Dict[str, Any]:
    if event == "flood":
        return classify_flood(stats, thresholds)
    if event == "drought":
        return classify_drought(stats, thresholds)
    if event == "stress":
        return classify_stress(stats, thresholds)
    if event == "auto":
        return decide_auto(stats, thresholds)
    raise ValueError(f"Unknown event {event}")


def main(argv=None) -> int:
    args = parse_args(argv)
    cfg = _load_yaml_config(args.config)
    dcfg = load_disaster_cfg(cfg, override_pre=args.pre_days, override_post=args.post_days)

    event_dt = _to_date(args.event_date)

    # Load and group indices
    df = load_indices_csv(args.indices)
    if args.field_id is not None:
        df = df[df["field_id"].astype(str) == str(args.field_id)]

    fields = group_fields(df)
    if not fields:
        raise ValueError("No fields found to analyze (check indices.csv and filters)")

    # Prepare outputs
    out_dir = args.out_dir
    _ensure_dir(out_dir)
    geojson_dir = os.path.join(out_dir, "masks", "geojson")
    if args.write_geojson:
        _ensure_dir(geojson_dir)

    summaries: List[Dict[str, Any]] = []

    for fid, fdf in fields.items():
        stats = summarize_field(fdf, event_dt, dcfg.windows)
        res = _classify(args.event, stats, dcfg.thresholds)

        # Build per-field summary
        rec: Dict[str, Any] = {
            "field_id": fid,
            "event_date": args.event_date,
            "event": res.get("event"),
            "detected": bool(res.get("detected", False)),
            "severity": res.get("severity"),
            "score": float(res.get("score", 0.0)),
            "window": {"pre_days": dcfg.windows.pre_days, "post_days": dcfg.windows.post_days},
            "metrics": dict(res.get("metrics", {})),
            "window_stats": {
                k: float(v) if isinstance(v, (int, float, np.floating)) and np.isfinite(v) else v
                for k, v in stats.items()
            },
        }
        summaries.append(rec)

        # Optional GeoJSON
        if args.write_geojson:
            # Synthetic mask proportional to severity for viz (tests are fully synthetic)
            sev = str(res.get("severity", "none"))
            base_mask = synthetic_mask_from_severity(sev, shape=(128, 128), seed=1337 + hash(fid) % 1000)
            cleaned = poly.clean_mask(
                base_mask,
                morph=poly.MorphologyConfig(
                    min_area_pixels=dcfg.morphology.min_area_pixels,
                    open_size=dcfg.morphology.open_size,
                    close_size=dcfg.morphology.close_size,
                ),
            )
            area_px = int((cleaned > 0).sum())
            props = {
                "field_id": fid,
                "event": res.get("event"),
                "event_date": args.event_date,
                "severity": sev,
                "area_px": area_px,
                "version": dcfg.version,
            }
            fc = poly.polygonize_mask(
                cleaned,
                properties=props,
                min_area_pixels=dcfg.morphology.min_area_pixels,
                simplify_tolerance=0.5,
                buffer_pixels=0.0,
            )
            out_name = f"{fid}_{res.get('event')}_{args.event_date}.geojson"
            out_path = os.path.join(geojson_dir, out_name)
            poly.save_geojson(fc, out_path)

    # Write summaries.json
    summaries_path = os.path.join(out_dir, "summaries.json")
    with open(summaries_path, "w", encoding="utf-8") as f:
        json.dump(summaries, f, indent=2)

    # Also write CSV for convenience
    try:
        rows_flat: List[Dict[str, Any]] = []
        for rec in summaries:
            flat = {
                "field_id": rec["field_id"],
                "event": rec["event"],
                "event_date": rec["event_date"],
                "detected": rec["detected"],
                "severity": rec["severity"],
                "score": rec["score"],
                "pre_days": rec["window"]["pre_days"],
                "post_days": rec["window"]["post_days"],
            }
            # include key metrics
            for mk in ("ndwi_delta", "ndwi_post_mean", "ndvi_drop", "tdvi_delta"):
                if mk in rec.get("metrics", {}):
                    flat[mk] = rec["metrics"][mk]
                elif mk in rec.get("window_stats", {}):
                    flat[mk] = rec["window_stats"][mk]
            rows_flat.append(flat)
        pd.DataFrame(rows_flat).to_csv(os.path.join(out_dir, "summaries.csv"), index=False)
    except Exception:
        # CSV is optional
        pass

    print(json.dumps({"status": "ok", "out_dir": out_dir, "n_fields": len(summaries)}, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())