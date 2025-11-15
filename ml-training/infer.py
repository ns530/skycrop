import os
import sys
import json
import math
import argparse
from typing import Tuple, Optional, Dict, Any

import numpy as np
import cv2

# Ensure local imports work when running as "python ml-training/infer.py"
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from dataset import (  # noqa: E402
    is_tiff,
    read_image_any,
    sliding_window_steps,
)
from utils_geo import mask_to_geojson, save_geojson  # noqa: E402

# Optional heavy deps
try:
    import rasterio
except Exception:  # pragma: no cover - optional at runtime
    rasterio = None  # type: ignore

# ONNX Runtime optional
try:
    import onnxruntime as ort
except Exception:  # pragma: no cover
    ort = None  # type: ignore

# TensorFlow optional
try:
    import tensorflow as tf  # type: ignore
except Exception:
    tf = None  # type: ignore


def _normalize_image(img: np.ndarray) -> np.ndarray:
    # Convert to float32 in [0,1]
    if img.dtype != np.float32:
        img = img.astype(np.float32)
    img = img / 255.0
    return img


def _accumulate_probs(
    img: np.ndarray, H: int, W: int, tile_size: int, overlap: int, predict_fn, pad_to_tile: bool = False
) -> np.ndarray:
    """
    Sliding window inference with overlap; accumulate probabilities and average on overlaps.
    predict_fn expects input batch (N, tile, tile, 3) in [0,1] and returns (N, tile, tile, 1) probs.
    """
    stride = max(1, tile_size - overlap)

    # If image smaller than tile, optionally pad to tile to allow a single pass
    if pad_to_tile:
        H_eff = max(H, tile_size)
        W_eff = max(W, tile_size)
    else:
        H_eff = H
        W_eff = W

    prob_acc = np.zeros((H_eff, W_eff), dtype=np.float32)
    weight = np.zeros((H_eff, W_eff), dtype=np.float32)

    ys = sliding_window_steps(H_eff, tile_size, overlap)
    xs = sliding_window_steps(W_eff, tile_size, overlap)

    # Build a normalized weight window (cosine/hann-like) to reduce edge artifacts
    wy = np.hanning(tile_size) if tile_size > 1 else np.ones((1,), dtype=np.float32)
    wx = np.hanning(tile_size) if tile_size > 1 else np.ones((1,), dtype=np.float32)
    window = np.outer(wy, wx).astype(np.float32)
    if window.max() > 0:
        window /= window.max()
    else:
        window[:] = 1.0

    # Process in mini-batches for efficiency
    batch_imgs: list[np.ndarray] = []
    batch_coords: list[Tuple[int, int]] = []
    max_batch = 4

    def _flush_batch():
        nonlocal batch_imgs, batch_coords
        if not batch_imgs:
            return
        inp = np.stack(batch_imgs, axis=0)
        probs = predict_fn(inp)  # (N, tile, tile, 1)
        probs = probs.squeeze(-1)  # (N, tile, tile)
        for (x, y), p in zip(batch_coords, probs):
            prob_acc[y : y + tile_size, x : x + tile_size] += p * window
            weight[y : y + tile_size, x : x + tile_size] += window
        batch_imgs = []
        batch_coords = []

    for y in ys:
        for x in xs:
            y0 = min(y, H - tile_size) if H >= tile_size else 0
            x0 = min(x, W - tile_size) if W >= tile_size else 0

            if y0 < 0 or x0 < 0:
                y0, x0 = 0, 0

            # Crop tile; pad if necessary
            tile = np.zeros((tile_size, tile_size, 3), dtype=np.float32)
            ih = min(tile_size, max(0, H - y0))
            iw = min(tile_size, max(0, W - x0))
            if ih > 0 and iw > 0:
                tile[:ih, :iw, :] = _normalize_image(img[y0 : y0 + ih, x0 : x0 + iw, :])

            batch_imgs.append(tile)
            batch_coords.append((x0, y0))
            if len(batch_imgs) >= max_batch:
                _flush_batch()
    _flush_batch()

    # Trim to original size
    prob_acc = prob_acc[:H, :W]
    weight = weight[:H, :W]
    weight = np.maximum(weight, 1e-6)
    prob = prob_acc / weight
    return prob


def _predictor_from_model(model_path: str, tile_size: int) -> Any:
    """
    Returns a predict_fn that maps (N, tile, tile, 3) -> (N, tile, tile, 1) probabilities
    """
    ext = os.path.splitext(model_path)[1].lower()
    if ext == ".onnx":
        assert ort is not None, "onnxruntime is not installed"
        sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        inp_name = sess.get_inputs()[0].name
        out_name = sess.get_outputs()[0].name

        def predict_fn(x: np.ndarray) -> np.ndarray:
            # Ensure float32
            x = x.astype(np.float32)
            # Some ONNX models might require NHWC or NCHW; our export uses Keras NHWC
            out = sess.run([out_name], {inp_name: x})[0]
            # Ensure output shape (N, tile, tile, 1)
            if out.ndim == 3:
                out = out[..., None]
            return out

        return predict_fn
    else:
        assert tf is not None, "TensorFlow is required to load SavedModel"
        # Allow passing either SavedModel dir or a .keras model file
        if os.path.isdir(model_path):
            model = tf.keras.models.load_model(model_path, compile=False)
        else:
            model = tf.keras.models.load_model(model_path, compile=False)

        def predict_fn(x: np.ndarray) -> np.ndarray:
            x = x.astype(np.float32)
            out = model.predict(x, verbose=0)
            if out.ndim == 3:
                out = out[..., None]
            return out

        return predict_fn


def run_inference(
    image_path: str,
    out_geojson: str,
    model_path: str,
    tile_size: int = 512,
    overlap: int = 64,
    threshold: float = 0.5,
    min_area_pixels: int = 64,
    buffer_pixels: int = 0,
    postprocess: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Perform offline inference and write GeoJSON polygons.

    Args:
        image_path: input raster path (GeoTIFF or PNG/JPEG)
        out_geojson: output GeoJSON file path
        model_path: ONNX or SavedModel path
        tile_size, overlap, threshold: inference tiling and probability threshold
        min_area_pixels, buffer_pixels: legacy polygonization controls (kept for backward compatibility)
        postprocess: optional dict mirroring ML-Service options:
          {
            "min_area": int,
            "simplify_tolerance": float,
            "remove_holes": bool,
            "topology": "preserve"|"clean"|"none",
            "morphology": { "smooth": "none"|"open"|"close", "kernel_size": int, "iterations": int }
          }

    Returns:
        Small summary dict with metadata.
    """
    # Read image
    if is_tiff(image_path):
        if rasterio is None:
            raise RuntimeError("rasterio not installed; required for GeoTIFF")
        with rasterio.open(image_path) as src:
            # Read RGB or replicate single band
            if src.count >= 3:
                arr = src.read(indexes=(1, 2, 3))
                arr = np.transpose(arr, (1, 2, 0))
            else:
                band = src.read(1)
                arr = np.stack([band, band, band], axis=-1)
            transform = src.transform
            crs = src.crs
    else:
        arr = cv2.cvtColor(cv2.imread(image_path, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
        transform = None
        crs = None

    if arr is None:
        raise FileNotFoundError(f"Failed to read image: {image_path}")

    H, W, _ = arr.shape

    # Predictor
    predict_fn = _predictor_from_model(model_path, tile_size=tile_size)

    # Accumulate probabilities
    prob = _accumulate_probs(arr, H, W, tile_size, overlap, predict_fn, pad_to_tile=True)

    # Threshold to binary
    mask01 = (prob >= float(threshold)).astype(np.uint8)

    # Vectorize to GeoJSON
    pp = postprocess or {}
    fc = mask_to_geojson(
        mask01,
        transform=transform,
        crs=crs,
        min_area_pixels=int(min_area_pixels),
        buffer_pixels=int(buffer_pixels),
        properties={"source": os.path.basename(model_path)},
        # New postprocess controls (defaults preserve previous behavior)
        min_area=pp.get("min_area", None),
        simplify_tolerance=float(pp.get("simplify_tolerance", 0.0)),
        remove_holes=bool(pp.get("remove_holes", False)),
        topology=str(pp.get("topology", "preserve")),
        morphology=pp.get(
            "morphology",
            {
                "smooth": "none",
                "kernel_size": 3,
                "iterations": 1,
            },
        ),
    )
    # Save
    os.makedirs(os.path.dirname(out_geojson) or ".", exist_ok=True)
    save_geojson(fc, out_geojson)

    return {
        "status": "ok",
        "image": image_path,
        "out": out_geojson,
        "shape": [int(H), int(W)],
        "threshold": float(threshold),
        "tile_size": int(tile_size),
        "overlap": int(overlap),
        "num_features": len(fc.get("features", [])),
    }


def parse_args(argv=None):
    p = argparse.ArgumentParser("Offline inference: tile+stitch to GeoJSON polygons")
    p.add_argument("--image", type=str, required=True, help="Path to input image (GeoTIFF or PNG/JPEG)")
    p.add_argument("--out", type=str, required=True, help="Output GeoJSON path")
    p.add_argument(
        "--model",
        type=str,
        default=os.path.join("ml-training", "models", "unet", os.getenv("MODEL_VERSION", "1.0.0"), "model.onnx"),
        help="Path to model.onnx or SavedModel directory/.keras file",
    )
    p.add_argument("--tile-size", type=int, default=512)
    p.add_argument("--overlap", type=int, default=64)
    p.add_argument("--threshold", type=float, default=0.5)
    p.add_argument("--min-area-pixels", type=int, default=64)
    p.add_argument("--buffer-pixels", type=int, default=0)
    return p.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    res = run_inference(
        image_path=args.image,
        out_geojson=args.out,
        model_path=args.model,
        tile_size=int(args.tile_size),
        overlap=int(args.overlap),
        threshold=float(args.threshold),
        min_area_pixels=int(args.min_area_pixels),
        buffer_pixels=int(args.buffer_pixels),
    )
    print(json.dumps(res, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())