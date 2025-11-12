import base64
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from shapely.geometry import Polygon, MultiPolygon, mapping, shape
from shapely.ops import unary_union
from skimage.morphology import (
    binary_opening,
    binary_closing,
    remove_small_objects,
    remove_small_holes,
    disk,
)
from skimage.measure import label, regionprops

# =========================
# Configuration (ENV-driven)
# =========================

def _env_str(name: str, default: str) -> str:
    return os.getenv(name, default)

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except Exception:
        return default

def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except Exception:
        return default

def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name, None)
    if raw is None:
        return default
    return raw not in ("0", "false", "False", "no", "No")

def _env_list(name: str, default: List[str]) -> List[str]:
    raw = os.getenv(name, None)
    if not raw:
        return default
    return [s.strip() for s in raw.split(",") if s.strip()]

# Model and runtime
MODEL_UNET_VERSION = _env_str("MODEL_UNET_VERSION", _env_str("UNET_DEFAULT_VERSION", "1.0.0"))
MODEL_UNET_PATH = _env_str(
    "MODEL_UNET_PATH",
    os.path.join("ml-training", "models", "unet", MODEL_UNET_VERSION, "model.onnx"),
)
ORT_PROVIDERS = _env_list("ORT_PROVIDERS", ["CPUExecutionProvider"])

# Inference behavior
INFER_TILE_SIZE = _env_int("INFER_TILE_SIZE", 512)
INFER_OVERLAP = _env_int("INFER_OVERLAP", 64)
INFER_BATCH_SIZE = _env_int("INFER_BATCH_SIZE", 4)
INFER_HANN_WEIGHTING = _env_bool("INFER_HANN_WEIGHTING", True)
INFER_PADDING = _env_str("INFER_PADDING", "reflect")  # reflect|constant|edge
INFER_THRESHOLD = _env_float("INFER_THRESHOLD", 0.5)

# Postprocessing
POST_MIN_AREA = _env_int("POST_MIN_AREA", 0)
POST_SIMPLIFY_TOLERANCE = _env_float("POST_SIMPLIFY_TOLERANCE", 0.0)
POST_REMOVE_HOLES = _env_bool("POST_REMOVE_HOLES", False)
POST_TOPOLOGY = _env_str("POST_TOPOLOGY", "preserve")  # preserve|clean|none
POST_MORPHOLOGY = _env_str("POST_MORPHOLOGY", "none")  # none|open|close
POST_MORPH_KERNEL = _env_int("POST_MORPH_KERNEL", 3)   # odd int
POST_MORPH_ITERS = _env_int("POST_MORPH_ITERS", 1)

# ===============
# ORT Singleton
# ===============
_ORT_SESSION = None
_ORT_INPUT_NAME = None
_ORT_OUTPUT_NAME = None
_ORT_INPUT_LAYOUT = "NHWC"  # best guess, switch to NCHW if needed


def _load_ort_session() -> Tuple[Any, str, str, str, List[str]]:
    """
    Create a singleton ONNX Runtime session and determine input/output names and layout.
    Returns (session, input_name, output_name, input_layout, providers)
    """
    global _ORT_SESSION, _ORT_INPUT_NAME, _ORT_OUTPUT_NAME, _ORT_INPUT_LAYOUT
    if _ORT_SESSION is not None:
        return _ORT_SESSION, _ORT_INPUT_NAME, _ORT_OUTPUT_NAME, _ORT_INPUT_LAYOUT, ORT_PROVIDERS

    # Lazy import; onnxruntime is in requirements
    import onnxruntime as ort  # type: ignore

    sess = ort.InferenceSession(MODEL_UNET_PATH, providers=ORT_PROVIDERS)
    inp = sess.get_inputs()[0]
    out = sess.get_outputs()[0]
    _ORT_SESSION = sess
    _ORT_INPUT_NAME = inp.name
    _ORT_OUTPUT_NAME = out.name

    # Try to infer layout from input shape if static
    # Common: NHWC: (N, H, W, C) or NCHW: (N, C, H, W)
    lay = "NHWC"
    try:
        ishape = inp.shape
        if isinstance(ishape, (list, tuple)) and len(ishape) == 4:
            # If channel dim is 3 or 1 and second dim equals 3 or 1, assume NCHW
            if ishape[1] in (1, 3):
                lay = "NCHW"
            elif ishape[-1] in (1, 3):
                lay = "NHWC"
    except Exception:
        lay = "NHWC"
    _ORT_INPUT_LAYOUT = lay
    return _ORT_SESSION, _ORT_INPUT_NAME, _ORT_OUTPUT_NAME, _ORT_INPUT_LAYOUT, ORT_PROVIDERS


# =========================
# Image tiling and stitching
# =========================

def _normalize_nhwc(x: np.ndarray) -> np.ndarray:
    # x: (H, W, 3)
    x = x.astype(np.float32, copy=False)
    return x / 255.0

def _hann_window(tile: int) -> np.ndarray:
    if tile <= 1:
        return np.ones((tile, tile), dtype=np.float32)
    wy = np.hanning(tile).astype(np.float32)
    wx = np.hanning(tile).astype(np.float32)
    w = np.outer(wy, wx)
    m = float(w.max()) if w.size else 1.0
    if m > 0:
        w /= m
    return w.astype(np.float32)

def _sliding_steps(L: int, tile: int, overlap: int) -> List[int]:
    stride = max(1, tile - overlap)
    if L <= tile:
        return [0]
    steps = list(range(0, L - tile + 1, stride))
    if steps[-1] != L - tile:
        steps.append(L - tile)
    return steps

def _pad_image(img: np.ndarray, pad: Tuple[int, int], mode: str) -> np.ndarray:
    """
    Pad image to at least pad height/width.
    mode: reflect|constant|edge
    """
    H, W, C = img.shape
    target_h = max(H, pad[0])
    target_w = max(W, pad[1])
    pad_h = target_h - H
    pad_w = target_w - W
    if pad_h <= 0 and pad_w <= 0:
        return img
    pad_kwargs: Dict[str, Any] = {}
    if mode == "constant":
        pad_kwargs["constant_values"] = 0
    np_mode = "reflect" if mode == "reflect" else ("edge" if mode == "edge" else "constant")
    return np.pad(img, ((0, pad_h), (0, pad_w), (0, 0)), mode=np_mode, **pad_kwargs)


def _infer_tiles(
    img_rgb: np.ndarray,
    tile: int,
    overlap: int,
    batch_size: int,
    use_hann: bool,
    padding: str,
    threshold: float,
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Run sliding window inference using ONNX Runtime session over the given image.

    Returns:
      prob_map: (H, W) accumulated probability map (float32 in [0,1])
      meta: { tile_count, providers, timings: {preprocess_ms,infer_ms,postprocess_ms,total_ms}, ... }
    """
    t_start = time.time()

    # Load ORT session and determine layout
    t0 = time.time()
    sess, inp_name, out_name, layout, providers = _load_ort_session()
    t_pre = int((time.time() - t0) * 1000)

    H, W, C = img_rgb.shape
    assert C == 3, "Expected 3-channel RGB image"
    # Optionally pad to ensure at least one tile
    t1 = time.time()
    img_padded = _pad_image(img_rgb, (tile, tile), padding)
    Hp, Wp, _ = img_padded.shape

    ys = _sliding_steps(Hp, tile, overlap)
    xs = _sliding_steps(Wp, tile, overlap)

    weight_map = np.zeros((Hp, Wp), dtype=np.float32)
    prob_acc = np.zeros((Hp, Wp), dtype=np.float32)
    window = _hann_window(tile) if use_hann else np.ones((tile, tile), dtype=np.float32)

    batch_imgs: List[np.ndarray] = []
    batch_coords: List[Tuple[int, int]] = []

    tile_count = 0

    def _flush_batch():
        nonlocal batch_imgs, batch_coords, prob_acc, weight_map, tile_count
        if not batch_imgs:
            return
        tile_count += len(batch_imgs)
        x = np.stack(batch_imgs, axis=0)  # (N,tile,tile,3), NHWC normalized
        x = _normalize_nhwc(x)
        if layout == "NCHW":
            x = np.transpose(x, (0, 3, 1, 2))  # (N,3,tile,tile)
        # ONNX inference
        out = sess.run([out_name], {inp_name: x})[0]
        # Accept (N,1,H,W) or (N,H,W,1) or (N,H,W)
        if out.ndim == 4:
            if out.shape[1] == 1 and layout == "NCHW":
                out = out[:, 0, :, :]  # (N,H,W)
            elif out.shape[-1] == 1:
                out = out[:, :, :, 0]  # (N,H,W)
        elif out.ndim == 3:
            pass
        else:
            raise ValueError(f"Unexpected ONNX output shape: {out.shape}")

        out = out.astype(np.float32)
        # Accumulate with window weighting
        for (x0, y0), p in zip(batch_coords, out):
            prob_acc[y0 : y0 + tile, x0 : x0 + tile] += p * window
            weight_map[y0 : y0 + tile, x0 : x0 + tile] += window

        batch_imgs = []
        batch_coords = []

    for y0 in ys:
        for x0 in xs:
            tile_img = img_padded[y0 : y0 + tile, x0 : x0 + tile, :]
            if tile_img.shape[0] != tile or tile_img.shape[1] != tile:
                # Final safety pad (shouldn't happen with _pad_image, but keep robust)
                tile_img = _pad_image(tile_img, (tile, tile), padding)
                tile_img = tile_img[:tile, :tile, :]
            batch_imgs.append(tile_img)
            batch_coords.append((x0, y0))
            if len(batch_imgs) >= max(1, int(batch_size)):
                _flush_batch()
    _flush_batch()

    # Normalize accumulated probs
    weight_map = np.maximum(weight_map, 1e-6)
    prob = prob_acc / weight_map
    # Trim to original size
    prob = prob[:H, :W]

    t_infer = int((time.time() - t1) * 1000)
    meta = {
        "tile_count": int(tile_count),
        "providers": providers,
        "timings": {
            "preprocess_ms": int(t_pre),
            "infer_ms": int(t_infer),
            "postprocess_ms": 0,
            "total_ms": int((time.time() - t_start) * 1000),
        },
        "image_shape": [int(H), int(W), int(C)],
        "threshold": float(threshold),
        "config": {
            "tile_size": int(tile),
            "overlap": int(overlap),
            "batch_size": int(batch_size),
            "hann_weighting": bool(use_hann),
            "padding": str(padding),
        },
    }
    return prob.astype(np.float32), meta


# =========================
# Mask postprocessing to GeoJSON
# =========================

def _apply_morphology(mask01: np.ndarray) -> np.ndarray:
    """
    Apply optional morphology operations (open/close) and remove small objects/holes.
    """
    m = (mask01.astype(np.uint8) > 0).astype(bool)
    k = max(1, POST_MORPH_KERNEL)
    fp = disk(int(k // 2)) if k > 1 else disk(1)

    if POST_MORPHOLOGY == "open":
        for _ in range(max(1, POST_MORPH_ITERS)):
            m = binary_opening(m, footprint=fp)
    elif POST_MORPHOLOGY == "close":
        for _ in range(max(1, POST_MORPH_ITERS)):
            m = binary_closing(m, footprint=fp)

    if POST_MIN_AREA and POST_MIN_AREA > 0:
        m = remove_small_objects(m, min_size=int(POST_MIN_AREA))

    if POST_REMOVE_HOLES:
        # Remove holes up to an area threshold ~ POST_MIN_AREA if provided; else remove any holes
        area_thr = int(max(0, POST_MIN_AREA))
        m = remove_small_holes(m, area_threshold=int(max(1, area_thr)))

    return (m.astype(np.uint8))


def _polygonize_mask(mask01: np.ndarray) -> List[Polygon]:
    """
    Extract polygons from a binary mask using connected components + convex hull approximation.
    Returns a list of Shapely Polygons.
    """
    m = (mask01.astype(np.uint8) > 0).astype(np.uint8)
    if m.max() == 0:
        return []

    lbl = label(m, connectivity=1)
    polys: List[Polygon] = []
    for reg in regionprops(lbl):
        if POST_MIN_AREA and reg.area < POST_MIN_AREA:
            continue
        try:
            # Use region convex hull as a robust, fast boundary
            geom = unary_union([ (shape({"type":"Point","coordinates":[float(c[1]), float(c[0])]})) for c in reg.coords ])
            hull = geom.convex_hull
        except Exception:
            continue
        if hull.is_empty:
            continue
        if POST_SIMPLIFY_TOLERANCE and POST_SIMPLIFY_TOLERANCE > 0:
            hull = hull.simplify(float(POST_SIMPLIFY_TOLERANCE), preserve_topology=True)
        if hull.is_empty:
            continue
        if POST_MIN_AREA and hull.area < POST_MIN_AREA:
            continue
        if isinstance(hull, Polygon):
            polys.append(hull)
        elif isinstance(hull, MultiPolygon):
            polys.extend([p for p in hull.geoms if isinstance(p, Polygon)])

    if not polys:
        return []

    # Topology handling
    merged: Any = None
    if POST_TOPOLOGY == "preserve":
        try:
            merged = unary_union(polys).buffer(0)
        except Exception:
            merged = unary_union(polys)
    elif POST_TOPOLOGY == "clean":
        try:
            merged = unary_union(polys)
        except Exception:
            merged = polys
    else:
        merged = polys

    out_polys: List[Polygon] = []
    if isinstance(merged, Polygon):
        out_polys = [merged]
    elif isinstance(merged, MultiPolygon):
        out_polys = [p for p in merged.geoms if isinstance(p, Polygon)]
    elif isinstance(merged, list):
        out_polys = [p for p in merged if isinstance(p, Polygon)]
    else:
        out_polys = []

    # Remove holes if requested
    if POST_REMOVE_HOLES:
        cleaned: List[Polygon] = []
        for p in out_polys:
            cleaned.append(Polygon(p.exterior))
        out_polys = cleaned

    return out_polys


def mask_to_geojson(
    mask01: np.ndarray,
    properties: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Convert a binary mask to a GeoJSON FeatureCollection (pixel coordinate reference).
    """
    m = _apply_morphology(mask01)
    polys = _polygonize_mask(m)
    features: List[Dict[str, Any]] = []
    props = dict(properties or {})
    for p in polys:
        try:
            features.append({
                "type": "Feature",
                "properties": dict(props),
                "geometry": mapping(p),
            })
        except Exception:
            continue
    return {"type": "FeatureCollection", "features": features}


# =========================
# Public Inference Entrypoint
# =========================

def run_unet_geojson(
    image_rgb: np.ndarray,
    threshold: Optional[float] = None,
    tile_size: Optional[int] = None,
    overlap: Optional[int] = None,
    batch_size: Optional[int] = None,
    hann_weighting: Optional[bool] = None,
    padding: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Full inference pipeline:
      - tile+stitch probabilities via ONNX Runtime U-Net
      - threshold to binary mask
      - postprocess to polygons
    Returns: (geojson_feature_collection, meta)
    """
    th = float(INFER_THRESHOLD if threshold is None else threshold)
    ts = int(INFER_TILE_SIZE if tile_size is None else tile_size)
    ov = int(INFER_OVERLAP if overlap is None else overlap)
    bs = int(INFER_BATCH_SIZE if batch_size is None else batch_size)
    hw = bool(INFER_HANN_WEIGHTING if hann_weighting is None else hann_weighting)
    pad = str(INFER_PADDING if padding is None else padding)

    # Inference over tiles
    prob, meta = _infer_tiles(
        image_rgb,
        tile=ts,
        overlap=ov,
        batch_size=bs,
        use_hann=hw,
        padding=pad,
        threshold=th,
    )
    t2 = time.time()
    mask01 = (prob >= th).astype(np.uint8)
    # Vectorize
    fc = mask_to_geojson(
        mask01,
        properties={
            "source": "onnx",
            "model_version": MODEL_UNET_VERSION,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    post_ms = int((time.time() - t2) * 1000)
    meta["timings"]["postprocess_ms"] = int(meta["timings"].get("postprocess_ms", 0)) + post_ms
    meta["timings"]["total_ms"] = int((meta["timings"]["preprocess_ms"] + meta["timings"]["infer_ms"] + meta["timings"]["postprocess_ms"]))
    meta["threshold"] = float(th)
    meta["model_path"] = MODEL_UNET_PATH
    meta["model_version"] = MODEL_UNET_VERSION
    return fc, meta


# =========================
# Persistence and encoding
# =========================

def encode_geojson_base64(geojson_obj: Dict) -> str:
    s = json.dumps(geojson_obj, separators=(",", ":"), ensure_ascii=False)
    return base64.b64encode(s.encode("utf-8")).decode("utf-8")


def persist_mask_geojson(static_folder: str, masks_subdir: str, request_id: str, geojson_obj: Dict) -> str:
    """
    Persist the GeoJSON under static/masks/{request_id}.geojson and return the relative URL path.
    """
    masks_dir = os.path.join(static_folder, masks_subdir)
    os.makedirs(masks_dir, exist_ok=True)
    path = os.path.join(masks_dir, f"{request_id}.geojson")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(geojson_obj, f, ensure_ascii=False)
    # Flask static will serve under /static
    return f"/static/{masks_subdir}/{request_id}.geojson"