from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple, Literal

import numpy as np
from skimage.morphology import binary_opening, binary_closing, remove_small_objects, disk


EventType = Literal["flood", "drought", "stress"]


@dataclass(frozen=True)
class Thresholds:
    """Default thresholds per spec."""
    FLOOD_NDWI_DELTA_MIN: float = 0.15
    FLOOD_NDWI_ABS_MIN: float = 0.1
    DROUGHT_NDWI_DROP_MIN: float = 0.12
    DROUGHT_NDVI_DROP_MIN: float = 0.08
    STRESS_TDVI_DELTA_MIN: float = 0.08


@dataclass(frozen=True)
class MorphologyConfig:
    min_area_pixels: int = 50
    open_size: int = 2
    close_size: int = 2


def _isfinite(x: float) -> bool:
    try:
        return np.isfinite(float(x))
    except Exception:
        return False


def _nz(x: float) -> float:
    """Return 0.0 for non-finite values to avoid NaN propagation in scores."""
    return float(x) if _isfinite(x) else 0.0


def classify_flood(stats: Dict[str, float], th: Optional[Thresholds] = None) -> Dict[str, object]:
    """
    Flood detection and severity.

    Signal (primary):
      ndwi_delta = NDWI_post_mean - NDWI_pre_mean > FLOOD_NDWI_DELTA_MIN AND NDWI_post_mean > FLOOD_NDWI_ABS_MIN
    Severity:
      - high if ndwi_delta > 0.25 OR ndvi_drop > 0.2
      - medium if ndwi_delta in [0.15, 0.25)
      - low if ndwi_delta in [0.10, 0.15) and NDWI_post_mean > 0.08
    Note: We allow 'low' to be considered a detected event even if below primary signal threshold,
          per severity guidance in the spec.
    """
    th = th or Thresholds()
    ndwi_delta = _nz(stats.get("ndwi_delta", np.nan))
    ndwi_post = _nz(stats.get("ndwi_post_mean", np.nan))
    ndvi_drop = _nz(stats.get("ndvi_drop", np.nan))

    severity = "none"
    detected = False

    # Severity logic first (allows 'low' below main signal threshold)
    if (ndwi_delta > 0.25) or (ndvi_drop > 0.2):
        severity = "high"
    elif (0.15 <= ndwi_delta < 0.25):
        severity = "medium"
    elif (0.10 <= ndwi_delta < 0.15) and (ndwi_post > 0.08):
        severity = "low"

    # Signal gate (primary)
    signal = (ndwi_delta > th.FLOOD_NDWI_DELTA_MIN and ndwi_post > th.FLOOD_NDWI_ABS_MIN)
    detected = signal or (severity == "low")

    # Score emphasizes NDWI delta and slight bonus from NDVI drop
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


def classify_drought(stats: Dict[str, float], th: Optional[Thresholds] = None) -> Dict[str, object]:
    """
    Drought detection and severity.

    Signal:
      ndwi_drop = NDWI_pre_mean - NDWI_post_mean > DROUGHT_NDWI_DROP_MIN
      AND ndvi_drop > DROUGHT_NDVI_DROP_MIN

    Severity:
      - high if ndwi_drop > 0.20 or ndvi_drop > 0.15
      - medium if (ndwi_drop in [0.15, 0.20)) or (ndvi_drop in [0.10, 0.15))
      - low otherwise if signal is True
    """
    th = th or Thresholds()
    ndwi_drop = _nz(stats.get("ndwi_drop", np.nan))
    ndvi_drop = _nz(stats.get("ndvi_drop", np.nan))

    signal = (ndwi_drop > th.DROUGHT_NDWI_DROP_MIN) and (ndvi_drop > th.DROUGHT_NDVI_DROP_MIN)

    severity = "none"
    if signal:
        if (ndwi_drop > 0.20) or (ndvi_drop > 0.15):
            severity = "high"
        elif (0.15 <= ndwi_drop < 0.20) or (0.10 <= ndvi_drop < 0.15):
            severity = "medium"
        else:
            severity = "low"

    # Score balances both drops above their mins
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


def classify_stress(stats: Dict[str, float], th: Optional[Thresholds] = None) -> Dict[str, object]:
    """
    Vegetation stress (heat/disease proxy).

    Signal:
      tdvi_delta = TDVI_post_mean - TDVI_pre_mean > STRESS_TDVI_DELTA_MIN
      AND ndvi_drop > 0.05

    Severity:
      - high if tdvi_delta > 0.15 or ndvi_drop > 0.15
      - medium if tdvi_delta in [0.10, 0.15) or ndvi_drop in [0.10, 0.15)
      - low otherwise if signal True
    """
    th = th or Thresholds()
    tdvi_delta = _nz(stats.get("tdvi_delta", np.nan))
    ndvi_drop = _nz(stats.get("ndvi_drop", np.nan))

    signal = (tdvi_delta > th.STRESS_TDVI_DELTA_MIN) and (ndvi_drop > 0.05)

    severity = "none"
    if signal:
        if (tdvi_delta > 0.15) or (ndvi_drop > 0.15):
            severity = "high"
        elif (0.10 <= tdvi_delta < 0.15) or (0.10 <= ndvi_drop < 0.15):
            severity = "medium"
        else:
            severity = "low"

    # Score weights TDVI delta primarily, with NDVI drop bonus
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


def decide_auto(stats: Dict[str, float], th: Optional[Thresholds] = None) -> Dict[str, object]:
    """
    Evaluate all events and return the one with the highest score.
    If no event is detected, returns the top-scoring event with severity 'none' and detected=False.
    """
    th = th or Thresholds()
    res_f = classify_flood(stats, th)
    res_d = classify_drought(stats, th)
    res_s = classify_stress(stats, th)

    candidates = [res_f, res_d, res_s]
    best = max(candidates, key=lambda r: float(r.get("score", 0.0)))
    return best


def _mean_stack(stack: np.ndarray) -> np.ndarray:
    """Compute mean over time: (T,H,W) -> (H,W)."""
    if stack.ndim != 3:
        raise ValueError("Expected stack with shape (T,H,W)")
    return np.nanmean(stack.astype(np.float32), axis=0)


def build_change_mask(
    pre: Dict[str, np.ndarray],
    post: Dict[str, np.ndarray],
    event: EventType,
    th: Optional[Thresholds] = None,
    cloud_mask: Optional[np.ndarray] = None,
    morph: Optional[MorphologyConfig] = None,
) -> np.ndarray:
    """
    Build a binary change mask based on per-pixel pre/post stacks for indices.

    Args:
      pre/post: dict with keys among {'ndvi','ndwi','tdvi'} and values of shape (T,H,W)
      event: 'flood'|'drought'|'stress'
      cloud_mask: optional (H,W) boolean/0-1 mask; when provided, cloudy pixels are cleared
      morph: morphology config for cleaning

    Returns:
      (H,W) uint8 array with values {0,1}
    """
    th = th or Thresholds()
    morph = morph or MorphologyConfig()

    H = W = None
    # derive shapes from any provided stack
    for v in list(pre.values()) + list(post.values()):
        if isinstance(v, np.ndarray) and v.ndim == 3:
            H, W = v.shape[1], v.shape[2]
            break
    if H is None or W is None:
        raise ValueError("Could not infer (H,W) from input stacks")

    # Compute window means
    ndvi_pre = _mean_stack(pre["ndvi"]) if "ndvi" in pre else None
    ndvi_post = _mean_stack(post["ndvi"]) if "ndvi" in post else None
    ndwi_pre = _mean_stack(pre["ndwi"]) if "ndwi" in pre else None
    ndwi_post = _mean_stack(post["ndwi"]) if "ndwi" in post else None
    tdvi_pre = _mean_stack(pre["tdvi"]) if "tdvi" in pre else None
    tdvi_post = _mean_stack(post["tdvi"]) if "tdvi" in post else None

    base = np.zeros((H, W), dtype=bool)
    if event == "flood":
        if ndwi_pre is None or ndwi_post is None:
            raise ValueError("Flood mask requires ndwi stacks")
        ndwi_delta = ndwi_post - ndwi_pre
        cond_high = (ndwi_delta > th.FLOOD_NDWI_DELTA_MIN) & (ndwi_post > th.FLOOD_NDWI_ABS_MIN)
        cond_low = (ndwi_delta >= 0.10) & (ndwi_delta < 0.15) & (ndwi_post > 0.08)
        base = (cond_high | cond_low)
    elif event == "drought":
        if ndwi_pre is None or ndwi_post is None:
            raise ValueError("Drought mask requires ndwi stacks")
        ndwi_drop = ndwi_pre - ndwi_post
        cond = ndwi_drop > th.DROUGHT_NDWI_DROP_MIN
        # Optional NDVI drop reinforcement when available
        if (ndvi_pre is not None) and (ndvi_post is not None):
            ndvi_drop = ndvi_pre - ndvi_post
            cond = cond & (ndvi_drop > th.DROUGHT_NDVI_DROP_MIN)
        base = cond
    elif event == "stress":
        if tdvi_pre is None or tdvi_post is None:
            raise ValueError("Stress mask requires tdvi stacks")
        tdvi_delta = tdvi_post - tdvi_pre
        cond = tdvi_delta > th.STRESS_TDVI_DELTA_MIN
        if (ndvi_pre is not None) and (ndvi_post is not None):
            ndvi_drop = ndvi_pre - ndvi_post
            cond = cond & (ndvi_drop > 0.05)
        base = cond
    else:
        raise ValueError(f"Unknown event type: {event}")

    # Apply cloud mask if provided
    if cloud_mask is not None:
        cm = cloud_mask.astype(bool)
        base = base & (~cm)

    # Morphological cleaning
    if morph.open_size and morph.open_size > 0:
        base = binary_opening(base, footprint=disk(int(morph.open_size)))
    if morph.close_size and morph.close_size > 0:
        base = binary_closing(base, footprint=disk(int(morph.close_size)))
    if morph.min_area_pixels and morph.min_area_pixels > 0:
        base = remove_small_objects(base, min_size=int(morph.min_area_pixels))

    return (base.astype(np.uint8))


def synthetic_mask_from_severity(
    severity: str,
    shape: Tuple[int, int] = (128, 128),
    seed: int = 1337,
) -> np.ndarray:
    """
    Deterministic synthetic mask generator for CLI visualization tests (no real rasters).
    Creates a filled disk whose radius scales with severity.
    """
    H, W = int(shape[0]), int(shape[1])
    yy, xx = np.mgrid[0:H, 0:W]
    rng = np.random.RandomState(seed)
    # Center jitter for variety but deterministic
    cy = H // 2 + int(rng.randint(-H // 10, H // 10))
    cx = W // 2 + int(rng.randint(-W // 10, W // 10))

    if severity == "high":
        rad = min(H, W) // 3
    elif severity == "medium":
        rad = min(H, W) // 4
    elif severity == "low":
        rad = min(H, W) // 6
    else:
        rad = 0

    mask = ((yy - cy) ** 2 + (xx - cx) ** 2 <= (rad ** 2)).astype(np.uint8)
    return mask