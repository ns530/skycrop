import os
import sys
import csv
import glob
import math
import argparse
import warnings
from typing import Dict, List, Optional, Sequence, Tuple

import numpy as np

# Optional deps: prefer netCDF4; fallback to h5py
try:
    import netCDF4  # type: ignore
except Exception:  # pragma: no cover
    netCDF4 = None  # type: ignore

try:
    import h5py  # type: ignore
except Exception:  # pragma: no cover
    h5py = None  # type: ignore

try:
    import cv2  # type: ignore
except Exception as e:
    raise RuntimeError("opencv-python-headless is required for PNG writing/IO") from e

try:  # optional for GeoTIFF output
    import rasterio  # type: ignore
    from rasterio.transform import Affine  # type: ignore
except Exception:  # pragma: no cover
    rasterio = None  # type: ignore


# ----------------------------
# I/O helpers
# ----------------------------

def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def list_netcdf_files(input_dir: str) -> List[str]:
    pats = ["*.nc", "*.NC", "*.Nc"]
    files: List[str] = []
    for pat in pats:
        files.extend(glob.glob(os.path.join(input_dir, pat)))
    files.sort()
    return files


def _is_png(fmt: str) -> bool:
    return str(fmt).strip().lower() in ("png", ".png")


def _is_tif(fmt: str) -> bool:
    return str(fmt).strip().lower() in ("tif", "tiff", ".tif", ".tiff")


# ----------------------------
# NetCDF reading
# ----------------------------

# Common Sentinel-2 band aliases
BAND_ALIASES: Dict[str, Sequence[str]] = {
    "B02": ("B02", "B2", "blue", "BLUE", "band02", "Band02"),
    "B03": ("B03", "B3", "green", "GREEN", "band03", "Band03"),
    "B04": ("B04", "B4", "red", "RED", "band04", "Band04"),
    "B08": ("B08", "B8", "nir", "NIR", "band08", "Band08", "B8A", "B08A"),
}

SCL_ALIASES = ("SCL", "scl", "SceneClassification", "scene_classification", "S2_SCL")
CLOUD_PROB_ALIASES = (
    "CLDPRB",
    "CLD_PROB",
    "cloud_probability",
    "CloudProbability",
    "CLOUD_PROBABILITY",
    "s2cloudless",
    "probability_cloud",
)


def _norm_key(k: str) -> str:
    return k.strip().lower()


def _try_get_nc4_var(ds, names: Sequence[str]):
    # Search variables case-insensitively at root
    vmap = {_norm_key(k): k for k in ds.variables.keys()}
    for nm in names:
        key = _norm_key(nm)
        if key in vmap:
            return ds.variables[vmap[key]]
    # Fallback: substring match
    for nm in names:
        nm_l = _norm_key(nm)
        for k in ds.variables.keys():
            if nm_l in _norm_key(k):
                return ds.variables[k]
    return None


def _h5_recursive_find(node, names: Sequence[str]):
    # Depth-first search for a dataset whose name matches any of names
    for nm in names:
        key_l = _norm_key(nm)
        # direct child
        for k in node.keys():
            k_l = _norm_key(k)
            if key_l == k_l or key_l in k_l:
                obj = node[k]
                if isinstance(obj, h5py.Dataset):
                    return obj
        # recurse into groups
        for k in node.keys():
            obj = node[k]
            if isinstance(obj, h5py.Group):
                found = _h5_recursive_find(obj, names)
                if found is not None:
                    return found
    return None


def _load_var_array(var) -> np.ndarray:
    # Handle netCDF4.Variable or h5py.Dataset -> np.ndarray (2D)
    arr = np.array(var[:])
    # Accept 2D or 3D; if 3D take the first slice along the smallest leading dimension
    if arr.ndim == 3:
        # Heuristic: choose a slice so that result is HxW
        # Assume dims like (1, H, W) or (Bands, H, W) or (H, W, 1)
        if arr.shape[0] <= 4 and arr.shape[1] >= 8 and arr.shape[2] >= 8:
            arr = arr[0]
        elif arr.shape[-1] <= 4 and arr.shape[0] >= 8 and arr.shape[1] >= 8:
            arr = arr[..., 0]
        else:
            # Fallback to first slice
            arr = arr[0]
    if arr.ndim != 2:
        raise ValueError(f"Expected 2D band array, got shape {arr.shape}")
    return arr.astype(np.float32)


def _read_band(ds, band_name: str) -> Optional[np.ndarray]:
    aliases = BAND_ALIASES.get(band_name, (band_name,))
    if netCDF4 is not None and isinstance(ds, netCDF4.Dataset):
        var = _try_get_nc4_var(ds, aliases)
        if var is not None:
            try:
                return _load_var_array(var)
            except Exception:
                pass
    if h5py is not None and isinstance(ds, h5py.File):
        var = _h5_recursive_find(ds, aliases)
        if var is not None:
            try:
                return _load_var_array(var)
            except Exception:
                pass
    return None


def _read_optional_var(ds, names: Sequence[str]) -> Optional[np.ndarray]:
    if netCDF4 is not None and isinstance(ds, netCDF4.Dataset):
        var = _try_get_nc4_var(ds, names)
        if var is not None:
            try:
                return _load_var_array(var)
            except Exception:
                pass
    if h5py is not None and isinstance(ds, h5py.File):
        var = _h5_recursive_find(ds, names)
        if var is not None:
            try:
                return _load_var_array(var)
            except Exception:
                pass
    return None


def _open_netcdf(path: str):
    if netCDF4 is not None:
        try:
            return netCDF4.Dataset(path, mode="r")
        except Exception:
            pass
    if h5py is not None:
        try:
            return h5py.File(path, mode="r")
        except Exception:
            pass
    raise RuntimeError(
        "Neither netCDF4 nor h5py could open the file. "
        "Install netCDF4 (preferred) or h5py."
    )


# ----------------------------
# Normalization
# ----------------------------

def _normalize_stack_to_uint8(
    stack: np.ndarray,
    method: str = "percentile",
    percentiles: Tuple[float, float] = (2.0, 98.0),
) -> np.ndarray:
    # stack: H W C float32
    out = np.zeros_like(stack, dtype=np.float32)
    C = stack.shape[-1]
    if method == "none":
        # Assume reflectance scaled (0..10000) -> map linearly to [0,255]
        scale = 255.0 / 10000.0
        out = np.clip(stack * scale, 0.0, 255.0)
    elif method == "per_band":
        for c in range(C):
            v = stack[..., c]
            vmin = float(np.nanmin(v))
            vmax = float(np.nanmax(v))
            if not math.isfinite(vmin) or not math.isfinite(vmax) or vmax <= vmin:
                out[..., c] = 0.0
            else:
                out[..., c] = (v - vmin) / (vmax - vmin) * 255.0
        out = np.clip(out, 0.0, 255.0)
    elif method == "percentile":
        p_lo, p_hi = percentiles
        for c in range(C):
            v = stack[..., c]
            lo = float(np.nanpercentile(v, p_lo))
            hi = float(np.nanpercentile(v, p_hi))
            if not math.isfinite(lo) or not math.isfinite(hi) or hi <= lo:
                out[..., c] = 0.0
            else:
                vv = np.clip(v, lo, hi)
                out[..., c] = (vv - lo) / (hi - lo) * 255.0
        out = np.clip(out, 0.0, 255.0)
    else:
        raise ValueError(f"Unknown normalization method: {method}")
    return out.astype(np.uint8)


# ----------------------------
# Cloud mask
# ----------------------------

def _scl_to_cloud_mask(scl: np.ndarray) -> np.ndarray:
    # SCL classes to mask: cloud shadow(3), clouds low(7), med(8), high(9), thin cirrus(10), snow(11)
    CLOUDY = {3, 7, 8, 9, 10, 11}
    mask = np.isin(scl.astype(np.int32), list(CLOUDY)).astype(np.uint8)
    return mask  # 0/1


def _cloudprob_to_mask(prob: np.ndarray, threshold: float = 0.4) -> np.ndarray:
    arr = prob.astype(np.float32)
    # normalize to 0..1 if in 0..100
    if np.nanmax(arr) > 1.0:
        arr = arr / 100.0
    return (arr >= float(threshold)).astype(np.uint8)


def _heuristic_cloud_mask(rgb8: np.ndarray) -> np.ndarray:
    # Simple heuristic: very bright zones as clouds in normalized uint8 RGB
    bright = np.mean(rgb8[:, :, :3].astype(np.float32) / 255.0, axis=2)
    return (bright > 0.9).astype(np.uint8)


# ----------------------------
# Writers
# ----------------------------

def _write_png(path: str, arr: np.ndarray) -> None:
    # arr: H W C (3 or 4), RGB(A) uint8
    if arr.ndim != 3 or arr.shape[-1] not in (3, 4):
        raise ValueError("PNG writer expects HxWx3 or HxWx4 uint8")
    if arr.shape[-1] == 3:
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        cv2.imwrite(path, bgr)
    else:
        # RGBA -> BGRA
        b, g, r, a = arr[:, :, 2], arr[:, :, 1], arr[:, :, 0], arr[:, :, 3]
        bgra = np.stack([b, g, r, a], axis=-1)
        cv2.imwrite(path, bgra)


def _write_mask_png(path: str, mask01: np.ndarray) -> None:
    cv2.imwrite(path, (mask01.astype(np.uint8) * 255))


def _write_tiff(path: str, arr: np.ndarray) -> None:
    if rasterio is None:
        raise RuntimeError("rasterio is required for GeoTIFF output")
    H, W, C = arr.shape
    transform = Affine.identity()
    profile = {
        "driver": "GTiff",
        "height": H,
        "width": W,
        "count": C,
        "dtype": rasterio.uint8,
        "transform": transform,
    }
    with rasterio.open(path, "w", **profile) as dst:
        for i in range(C):
            dst.write(arr[:, :, i], i + 1)


# ----------------------------
# Core preprocessing
# ----------------------------

def preprocess_sentinel2_dataset(
    input_dir: str,
    output_dir: str,
    bands: Sequence[str] = ("B04", "B03", "B02"),
    include_nir: bool = False,
    normalize_cfg: Optional[Dict] = None,
    cloud_mask_cfg: Optional[Dict] = None,
    output_format: str = "png",
    structure: str = "folders",  # "folders" | "manifest"
    seed: int = 1337,
) -> Dict[str, int]:
    """
    Convert Sentinel-2 .nc files into RGB (optionally +NIR) images, with optional cloud masks.

    Output:
      - If structure == 'folders':
          output_dir/images/{basename}.png (.tif)
          output_dir/masks/{basename}.png (if a mask was generated)
      - If structure == 'manifest':
          output_dir/images/...
          output_dir/masks/... (if any)
          output_dir/manifests/{train,val,test}.csv with (image_path,mask_path)

    Returns stats dict with counts and warnings.
    """
    rng = np.random.RandomState(seed)
    if normalize_cfg is None:
        normalize_cfg = {"method": "percentile", "percentiles": (2.0, 98.0)}
    if cloud_mask_cfg is None:
        cloud_mask_cfg = {"enabled": False, "source": "scl", "threshold": 0.4}

    method = str(normalize_cfg.get("method", "percentile")).lower()
    percentiles = normalize_cfg.get("percentiles", (2.0, 98.0))
    if isinstance(percentiles, list):
        percentiles = (float(percentiles[0]), float(percentiles[1]))
    percentiles = tuple(map(float, percentiles))  # type: ignore

    mask_enabled = bool(cloud_mask_cfg.get("enabled", False))
    mask_source = str(cloud_mask_cfg.get("source", "scl")).lower()
    mask_threshold = float(cloud_mask_cfg.get("threshold", 0.4))

    use_png = _is_png(output_format)
    use_tif = _is_tif(output_format)
    if not (use_png or use_tif):
        raise ValueError("output_format must be 'png' or 'tif'/'tiff'")

    files = list_netcdf_files(input_dir)
    if len(files) == 0:
        warnings.warn(f"No .nc files found in {input_dir}")
        return {"processed": 0, "images": 0, "masks": 0, "skipped": 0, "manifest": 0}

    img_dir = os.path.join(output_dir, "images")
    msk_dir = os.path.join(output_dir, "masks")
    mani_dir = os.path.join(output_dir, "manifests")
    ensure_dir(output_dir)
    ensure_dir(img_dir)
    if mask_enabled:
        ensure_dir(msk_dir)
    if structure == "manifest":
        ensure_dir(mani_dir)

    records: List[Tuple[str, Optional[str]]] = []
    counts = {"processed": 0, "images": 0, "masks": 0, "skipped": 0, "manifest": 0, "warnings": 0}

    for path in files:
        base = os.path.splitext(os.path.basename(path))[0]
        try:
            ds = _open_netcdf(path)
        except Exception as e:
            print(f"Warning: cannot open {path}: {e}")
            counts["skipped"] += 1
            counts["warnings"] += 1
            continue

        try:
            # Bands order as requested
            band_arrays: List[np.ndarray] = []
            for b in bands:
                arr = _read_band(ds, b)
                if arr is None:
                    raise ValueError(f"Missing band '{b}' in {path}")
                band_arrays.append(arr.astype(np.float32))

            if include_nir:
                nir = _read_band(ds, "B08")
                if nir is None:
                    raise ValueError("Requested include_nir=True but NIR (B08) not found")
                band_arrays.append(nir.astype(np.float32))

            # Align shapes
            shapes = [a.shape for a in band_arrays]
            H, W = shapes[0]
            if not all(s == (H, W) for s in shapes):
                # Try to crop to min shape
                minH = min(s[0] for s in shapes)
                minW = min(s[1] for s in shapes)
                band_arrays = [a[:minH, :minW] for a in band_arrays]
                H, W = minH, minW

            stack = np.stack(band_arrays, axis=-1)  # H W C

            # Normalize to uint8 [0,255]
            out8 = _normalize_stack_to_uint8(stack, method=method, percentiles=percentiles)

            # Cloud mask (optional)
            mask01: Optional[np.ndarray] = None
            if mask_enabled:
                marr: Optional[np.ndarray] = None
                if mask_source == "scl":
                    scl = _read_optional_var(ds, SCL_ALIASES)
                    if scl is not None:
                        marr = _scl_to_cloud_mask(scl)
                    else:
                        print(f"Warning: SCL not found for {base}; proceeding without mask")
                        counts["warnings"] += 1
                elif mask_source in ("cloud_probability", "cloudprob", "probability"):
                    cp = _read_optional_var(ds, CLOUD_PROB_ALIASES)
                    if cp is not None:
                        marr = _cloudprob_to_mask(cp, threshold=mask_threshold)
                    else:
                        print(f"Warning: cloud probability not found for {base}; proceeding without mask")
                        counts["warnings"] += 1
                elif mask_source == "heuristic":
                    marr = _heuristic_cloud_mask(out8)
                else:
                    print(f"Warning: unknown cloud mask source '{mask_source}', skipping mask")
                    counts["warnings"] += 1

                if marr is not None:
                    if marr.shape != (H, W):
                        mH, mW = marr.shape
                        mH2 = min(H, mH)
                        mW2 = min(W, mW)
                        mask01 = np.zeros((H, W), dtype=np.uint8)
                        mask01[:mH2, :mW2] = marr[:mH2, :mW2]
                    else:
                        mask01 = marr.astype(np.uint8)

            # Write outputs
            ext = ".png" if use_png else ".tif"
            img_out = os.path.join(img_dir, base + ext)
            if use_png:
                _write_png(img_out, out8)
            else:
                _write_tiff(img_out, out8)
            counts["images"] += 1

            mask_out_path: Optional[str] = None
            if mask01 is not None:
                ensure_dir(msk_dir)
                mask_out_path = os.path.join(msk_dir, base + ".png")
                _write_mask_png(mask_out_path, mask01)
                counts["masks"] += 1

            records.append((img_out, mask_out_path))
            counts["processed"] += 1

        except Exception as e:
            print(f"Warning: skipping {base} due to error: {e}")
            counts["skipped"] += 1
            counts["warnings"] += 1
        finally:
            try:
                ds.close()  # type: ignore
            except Exception:
                pass

    # Manifest splitting
    if structure == "manifest" and len(records) > 0:
        idx = np.arange(len(records))
        rng.shuffle(idx)
        n = len(idx)
        n_train = int(0.8 * n)
        n_val = int(0.1 * n)
        train_idx = idx[:n_train]
        val_idx = idx[n_train:n_train + n_val]
        test_idx = idx[n_train + n_val:]

        def write_csv(fname: str, indices: np.ndarray) -> None:
            with open(fname, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f)
                w.writerow(["image_path", "mask_path"])
                for i in indices:
                    imgp, mskp = records[int(i)]
                    w.writerow([imgp, mskp or ""])
        write_csv(os.path.join(mani_dir, "train.csv"), train_idx)
        write_csv(os.path.join(mani_dir, "val.csv"), val_idx)
        write_csv(os.path.join(mani_dir, "test.csv"), test_idx)
        counts["manifest"] = len(records)

    return counts


# ----------------------------
# Minimal dataset helper for .nc (optional integration)
# ----------------------------

def read_netcdf_rgb(
    path: str,
    bands: Sequence[str] = ("B04", "B03", "B02"),
    include_nir: bool = False,
    normalize_cfg: Optional[Dict] = None,
) -> np.ndarray:
    """
    Convenience helper to read a single .nc as RGB (+optional NIR) uint8 image.

    Returns: np.ndarray HxWx3 or HxWx4, dtype=uint8 normalized as requested.
    """
    if normalize_cfg is None:
        normalize_cfg = {"method": "percentile", "percentiles": (2.0, 98.0)}
    method = str(normalize_cfg.get("method", "percentile")).lower()
    percentiles = normalize_cfg.get("percentiles", (2.0, 98.0))
    if isinstance(percentiles, list):
        percentiles = (float(percentiles[0]), float(percentiles[1]))
    percentiles = tuple(map(float, percentiles))  # type: ignore

    ds = _open_netcdf(path)
    try:
        arrs: List[np.ndarray] = []
        for b in bands:
            a = _read_band(ds, b)
            if a is None:
                raise ValueError(f"Missing band {b} in {path}")
            arrs.append(a.astype(np.float32))
        if include_nir:
            nir = _read_band(ds, "B08")
            if nir is None:
                raise ValueError("include_nir=True but NIR (B08) missing")
            arrs.append(nir.astype(np.float32))
        shapes = [a.shape for a in arrs]
        H, W = shapes[0]
        if not all(s == (H, W) for s in shapes):
            minH = min(s[0] for s in shapes)
            minW = min(s[1] for s in shapes)
            arrs = [a[:minH, :minW] for a in arrs]
        stack = np.stack(arrs, axis=-1)
        return _normalize_stack_to_uint8(stack, method=method, percentiles=percentiles)
    finally:
        try:
            ds.close()  # type: ignore
        except Exception:
            pass


# ----------------------------
# CLI
# ----------------------------

def _parse_cli() -> argparse.Namespace:
    p = argparse.ArgumentParser("Sentinel-2 NetCDF preprocessing")
    p.add_argument("--input-dir", type=str, required=True, help="Directory with .nc files")
    p.add_argument("--output-dir", type=str, required=True, help="Output base directory")
    p.add_argument("--bands", type=str, default="B04,B03,B02", help="Comma-separated band names order")
    p.add_argument("--include-nir", action="store_true", help="Append NIR (B08) as 4th channel")
    p.add_argument("--normalize-method", type=str, default="percentile", choices=["percentile", "per_band", "none"])
    p.add_argument("--percentiles", type=str, default="2,98", help="Used when normalize-method=percentile")
    p.add_argument("--cloud-mask-enabled", action="store_true", help="Generate cloud mask if possible")
    p.add_argument("--cloud-mask-source", type=str, default="scl", choices=["scl", "cloud_probability", "heuristic"])
    p.add_argument("--cloud-threshold", type=float, default=0.4, help="Cloud probability threshold (0..1)")
    p.add_argument("--output-format", type=str, default="png", choices=["png", "tif", "tiff"])
    p.add_argument("--structure", type=str, default="folders", choices=["folders", "manifest"])
    p.add_argument("--seed", type=int, default=1337)
    return p.parse_args()


def _main(argv: Optional[List[str]] = None) -> int:
    args = _parse_cli()
    bands = tuple([b.strip() for b in str(args.bands).split(",") if b.strip()])
    p_lo, p_hi = [float(x) for x in str(args.percentiles).split(",")]
    norm_cfg = {"method": args.normalize_method, "percentiles": (p_lo, p_hi)}
    cm_cfg = {
        "enabled": bool(args.cloud_mask_enabled),
        "source": args.cloud_mask_source,
        "threshold": float(args.cloud_threshold),
    }
    stats = preprocess_sentinel2_dataset(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        bands=bands,
        include_nir=bool(args.include_nir),
        normalize_cfg=norm_cfg,
        cloud_mask_cfg=cm_cfg,
        output_format=args.output_format,
        structure=args.structure,
        seed=int(args.seed),
    )
    print(stats)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(_main())