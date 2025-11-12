import hashlib
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Dict, List, Literal, Optional, Tuple

import numpy as np
from shapely.geometry import Polygon, mapping


EventType = Literal["flood", "drought", "stress", "auto"]


@dataclass(frozen=True)
class Thresholds:
    FLOOD_NDWI_DELTA_MIN: float = 0.15
    FLOOD_NDWI_ABS_MIN: float = 0.1
    DROUGHT_NDWI_DROP_MIN: float = 0.12
    DROUGHT_NDVI_DROP_MIN: float = 0.08
    STRESS_TDVI_DELTA_MIN: float = 0.08


def _nz(x: Optional[float]) -> float:
    try:
        v = float(x) if x is not None else np.nan
    except Exception:
        v = np.nan
    return float(v) if np.isfinite(v) else 0.0


def _window_slices(
    indices: List[Dict[str, Any]], event_date: date, pre_days: int, post_days: int
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    pre_start = event_date - timedelta(days=int(pre_days))
    post_end = event_date + timedelta(days=int(post_days))
    pre = [r for r in indices if pre_start <= r["date"] < event_date]
    post = [r for r in indices if event_date < r["date"] <= post_end]
    # sort by date
    pre = sorted(pre, key=lambda r: r["date"])
    post = sorted(post, key=lambda r: r["date"])
    return pre, post


def _safe_mean(arr: List[Optional[float]]) -> float:
    vals: List[float] = []
    for v in arr:
        try:
            f = float(v)
            if np.isfinite(f):
                vals.append(float(f))
        except Exception:
            continue
    if not vals:
        return float("nan")
    return float(np.asarray(vals, dtype=np.float64).mean())


def _compute_stats(pre: List[Dict[str, Any]], post: List[Dict[str, Any]]) -> Dict[str, float]:
    ndvi_pre = _safe_mean([r.get("ndvi") for r in pre])
    ndvi_post = _safe_mean([r.get("ndvi") for r in post])
    ndwi_pre = _safe_mean([r.get("ndwi") for r in pre])
    ndwi_post = _safe_mean([r.get("ndwi") for r in post])
    tdvi_pre = _safe_mean([r.get("tdvi") for r in pre])
    tdvi_post = _safe_mean([r.get("tdvi") for r in post])

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


def _classify_flood(stats: Dict[str, float], th: Thresholds) -> Dict[str, Any]:
    ndwi_delta = _nz(stats.get("ndwi_delta"))
    ndwi_post = _nz(stats.get("ndwi_post_mean"))
    ndvi_drop = _nz(stats.get("ndvi_drop"))

    severity = "none"
    if (ndwi_delta > 0.25) or (ndvi_drop > 0.2):
        severity = "high"
    elif 0.15 <= ndwi_delta < 0.25:
        severity = "medium"
    elif 0.10 <= ndwi_delta < 0.15 and ndwi_post > 0.08:
        severity = "low"

    signal = (ndwi_delta > th.FLOOD_NDWI_DELTA_MIN) and (ndwi_post > th.FLOOD_NDWI_ABS_MIN)
    detected = signal or (severity == "low")
    score = max(0.0, ndwi_delta - th.FLOOD_NDWI_DELTA_MIN) + 0.25 * max(0.0, ndvi_drop - 0.10)

    return {
        "event": "flood",
        "detected": bool(detected),
        "severity": severity,
        "score": float(score),
        "metrics": {
            "ndwi_delta": ndwi_delta,
            "ndwi_post_mean": ndwi_post,
            "ndvi_drop": ndvi_drop,
        },
    }


def _classify_drought(stats: Dict[str, float], th: Thresholds) -> Dict[str, Any]:
    ndwi_drop = _nz(stats.get("ndwi_drop"))
    ndvi_drop = _nz(stats.get("ndvi_drop"))
    signal = (ndwi_drop > th.DROUGHT_NDWI_DROP_MIN) and (ndvi_drop > th.DROUGHT_NDVI_DROP_MIN)

    severity = "none"
    if signal:
        if (ndwi_drop > 0.20) or (ndvi_drop > 0.15):
            severity = "high"
        elif (0.15 <= ndwi_drop < 0.20) or (0.10 <= ndvi_drop < 0.15):
            severity = "medium"
        else:
            severity = "low"

    score = max(0.0, ndwi_drop - th.DROUGHT_NDWI_DROP_MIN) + max(0.0, ndvi_drop - th.DROUGHT_NDVI_DROP_MIN)

    return {
        "event": "drought",
        "detected": bool(signal),
        "severity": severity,
        "score": float(score),
        "metrics": {
            "ndwi_drop": ndwi_drop,
            "ndvi_drop": ndvi_drop,
        },
    }


def _classify_stress(stats: Dict[str, float], th: Thresholds) -> Dict[str, Any]:
    tdvi_delta = _nz(stats.get("tdvi_delta"))
    ndvi_drop = _nz(stats.get("ndvi_drop"))

    signal = (tdvi_delta > th.STRESS_TDVI_DELTA_MIN) and (ndvi_drop > 0.05)
    severity = "none"
    if signal:
        if (tdvi_delta > 0.15) or (ndvi_drop > 0.15):
            severity = "high"
        elif (0.10 <= tdvi_delta < 0.15) or (0.10 <= ndvi_drop < 0.15):
            severity = "medium"
        else:
            severity = "low"

    score = max(0.0, tdvi_delta - th.STRESS_TDVI_DELTA_MIN) + 0.5 * max(0.0, ndvi_drop - 0.05)

    return {
        "event": "stress",
        "detected": bool(signal),
        "severity": severity,
        "score": float(score),
        "metrics": {
            "tdvi_delta": tdvi_delta,
            "ndvi_drop": ndvi_drop,
        },
    }


def _decide_auto(stats: Dict[str, float], th: Thresholds) -> Dict[str, Any]:
    cand = [
        _classify_flood(stats, th),
        _classify_drought(stats, th),
        _classify_stress(stats, th),
    ]
    best = max(cand, key=lambda r: float(r.get("score", 0.0)))
    return best


def _thresholds_from_config(app_config) -> Thresholds:
    d = app_config.get("DISASTER_THRESHOLDS", {}) or {}
    try:
        return Thresholds(
            FLOOD_NDWI_DELTA_MIN=float(d.get("FLOOD_NDWI_DELTA_MIN", 0.15)),
            FLOOD_NDWI_ABS_MIN=float(d.get("FLOOD_NDWI_ABS_MIN", 0.1)),
            DROUGHT_NDWI_DROP_MIN=float(d.get("DROUGHT_NDWI_DROP_MIN", 0.12)),
            DROUGHT_NDVI_DROP_MIN=float(d.get("DROUGHT_NDVI_DROP_MIN", 0.08)),
            STRESS_TDVI_DELTA_MIN=float(d.get("STRESS_TDVI_DELTA_MIN", 0.08)),
        )
    except Exception:
        return Thresholds()


def _group_by_field(indices: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for rec in indices:
        fid = str(rec.get("field_id"))
        groups.setdefault(fid, []).append(rec)
    # sort each by date
    for fid, arr in groups.items():
        arr.sort(key=lambda r: r["date"])
    return groups


def _severity_to_scale(sev: str) -> float:
    if sev == "high":
        return 0.004
    if sev == "medium":
        return 0.003
    if sev == "low":
        return 0.002
    return 0.001


def _det_square(fid: str, idx: int, sev: str) -> Polygon:
    # Deterministic small square using hash(fid) and index to vary slightly
    h = hashlib.sha256(f"{fid}:{idx}".encode("utf-8")).hexdigest()
    base_x = (int(h[:8], 16) % 1000) / 10000.0  # 0.0 .. 0.0999
    base_y = (int(h[8:16], 16) % 1000) / 10000.0
    s = _severity_to_scale(sev)
    minx, miny = 79.9 + base_x, 6.9 + base_y
    maxx, maxy = minx + s, miny + s
    return Polygon([(minx, miny), (maxx, miny), (maxx, maxy), (minx, maxy), (minx, miny)])


def build_feature_collection(analysis: List[Dict[str, Any]]) -> Dict[str, Any]:
    features: List[Dict[str, Any]] = []
    for i, rec in enumerate(analysis):
        fid = rec["field_id"]
        sev = rec.get("severity", "none")
        poly = _det_square(fid, i, sev)
        geom = mapping(poly)
        props = {
            "field_id": fid,
            "event": rec.get("event"),
            "severity": sev,
        }
        features.append({"type": "Feature", "geometry": geom, "properties": props})
    return {"type": "FeatureCollection", "features": features}


def analyze_indices(
    indices_records: List[Dict[str, Any]],
    event: EventType,
    event_date: date,
    app_config,
    pre_days: Optional[int] = None,
    post_days: Optional[int] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Compute per-field summaries and return (analysis_list, thresholds_dict_used)
    """
    th = _thresholds_from_config(app_config)
    pre = int(pre_days if pre_days is not None else int(app_config.get("DISASTER_PRE_DAYS", 14)))
    post = int(post_days if post_days is not None else int(app_config.get("DISASTER_POST_DAYS", 7)))

    grouped = _group_by_field(indices_records)
    out: List[Dict[str, Any]] = []

    for fid, arr in grouped.items():
        pre_arr, post_arr = _window_slices(arr, event_date, pre, post)
        stats = _compute_stats(pre_arr, post_arr)

        if event == "flood":
            res = _classify_flood(stats, th)
        elif event == "drought":
            res = _classify_drought(stats, th)
        elif event == "stress":
            res = _classify_stress(stats, th)
        elif event == "auto":
            res = _decide_auto(stats, th)
        else:
            raise ValueError("invalid_event")

        out.append(
            {
                "field_id": fid,
                "event": res.get("event"),
                "severity": res.get("severity"),
                "metrics": dict(res.get("metrics", {})),
                "windows": {"pre_days": pre, "post_days": post},
            }
        )

    th_dict = {
        "FLOOD_NDWI_DELTA_MIN": th.FLOOD_NDWI_DELTA_MIN,
        "FLOOD_NDWI_ABS_MIN": th.FLOOD_NDWI_ABS_MIN,
        "DROUGHT_NDWI_DROP_MIN": th.DROUGHT_NDWI_DROP_MIN,
        "DROUGHT_NDVI_DROP_MIN": th.DROUGHT_NDVI_DROP_MIN,
        "STRESS_TDVI_DELTA_MIN": th.STRESS_TDVI_DELTA_MIN,
    }
    return out, th_dict