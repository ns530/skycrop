import os
import io
import cv2
import sys
import json
import math
import yaml
import glob
import time
import random
import hashlib
import argparse
import numpy as np
from typing import List, Tuple, Optional, Dict

# Third-party
import albumentations as A
from albumentations.core.serialization import to_dict, from_dict
from tqdm import tqdm

# Optional heavy deps used when needed (guarded imports)
try:
    import rasterio
    from rasterio.enums import Resampling
except Exception:  # pragma: no cover - optional at runtime
    rasterio = None  # type: ignore

try:
    import tensorflow as tf
except Exception as e:  # pragma: no cover - CI environments may not install TF
    tf = None  # type: ignore

# Optional Sentinel-2 NetCDF reader (used when consuming .nc directly)
try:
    from preprocess_sentinel2 import read_netcdf_rgb as _read_netcdf_rgb  # type: ignore
except Exception:  # pragma: no cover - optional
    _read_netcdf_rgb = None  # type: ignore

# ----------------------------
# Utilities
# ----------------------------

def set_global_seeds(seed: int = 1337) -> None:
    import random as _random
    import numpy as _np

    _random.seed(seed)
    _np.random.seed(seed)
    if tf is not None:
        try:
            tf.random.set_seed(seed)
        except Exception:
            pass


def load_yaml_config(path: Optional[str]) -> Dict:
    if not path:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def is_tiff(path: str) -> bool:
    ext = os.path.splitext(path)[1].lower()
    return ext in [".tif", ".tiff"]

def is_netcdf(path: str) -> bool:
    ext = os.path.splitext(path)[1].lower()
    return ext in [".nc"]

def _read_netcdf_rgb_wrapper(path: str) -> np.ndarray:
    """
    Read a NetCDF file as RGB (optionally RGBA) uint8 using preprocess_sentinel2 helper if available.
    Uses default band mapping B04,B03,B02 and percentile normalization. This is a convenience for
    consuming .nc directly in pipelines when present. If the helper is unavailable, raises RuntimeError.
    """
    if _read_netcdf_rgb is None:
        raise RuntimeError("NetCDF reader is not available; ensure preprocess_sentinel2.read_netcdf_rgb import succeeded")
    arr = _read_netcdf_rgb(
        path,
        bands=("B04", "B03", "B02"),
        include_nir=False,
        normalize_cfg={"method": "percentile", "percentiles": (2.0, 98.0)},
    )
    return arr


def _read_rasterio_rgb(path: str) -> np.ndarray:
    if rasterio is None:
        raise RuntimeError("rasterio not installed; cannot read GeoTIFF.")
    with rasterio.open(path) as src:
        # Try read first 3 bands, or tile to 3 channels if single band
        count = src.count
        if count >= 3:
            arr = src.read(indexes=(1, 2, 3), out_dtype=np.uint8)
            arr = np.transpose(arr, (1, 2, 0))
        else:
            band = src.read(1, out_dtype=np.uint8)
            arr = np.stack([band, band, band], axis=-1)
    return arr


def _read_cv2_rgb(path: str) -> np.ndarray:
    # Use UNCHANGED to preserve alpha/NIR channels if present
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise FileNotFoundError(f"Failed to read image: {path}")
    if img.ndim == 2:
        # Grayscale -> RGB
        img = np.stack([img, img, img], axis=-1)
    elif img.ndim == 3 and img.shape[-1] == 3:
        # BGR -> RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    elif img.ndim == 3 and img.shape[-1] == 4:
        # BGRA -> RGBA
        b, g, r, a = img[:, :, 0], img[:, :, 1], img[:, :, 2], img[:, :, 3]
        img = np.stack([r, g, b, a], axis=-1)
    else:
        raise ValueError(f"Unsupported image shape from cv2: {img.shape}")
    return img


def read_image_any(path: str) -> np.ndarray:
    if is_netcdf(path):
        return _read_netcdf_rgb_wrapper(path)
    if is_tiff(path):
        return _read_rasterio_rgb(path)
    return _read_cv2_rgb(path)


def _read_rasterio_mask(path: str) -> np.ndarray:
    if rasterio is None:
        raise RuntimeError("rasterio not installed; cannot read GeoTIFF.")
    with rasterio.open(path) as src:
        band = src.read(1, out_dtype=np.uint8)
    return band


def _read_cv2_mask(path: str) -> np.ndarray:
    m = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if m is None:
        raise FileNotFoundError(f"Failed to read mask: {path}")
    return m


def read_mask_any(path: str) -> np.ndarray:
    return _read_rasterio_mask(path) if is_tiff(path) else _read_cv2_mask(path)


def binarize_mask(mask: np.ndarray, threshold: int = 0) -> np.ndarray:
    # Convert to {0,1}
    return (mask > threshold).astype(np.uint8)


def compute_mask_coverage(mask01: np.ndarray) -> float:
    if mask01.size == 0:
        return 0.0
    return float(mask01.mean())


def sliding_window_steps(length: int, tile: int, overlap: int) -> List[int]:
    stride = max(1, tile - overlap)
    if length <= tile:
        return [0]
    steps = list(range(0, length - tile + 1, stride))
    if steps[-1] != length - tile:
        steps.append(length - tile)
    return steps


def tile_image_and_mask(
    image: np.ndarray,
    mask01: np.ndarray,
    tile_size: int,
    overlap: int,
    min_mask_coverage: float,
) -> List[Tuple[np.ndarray, np.ndarray, Tuple[int, int]]]:
    H, W = mask01.shape
    th, tw = tile_size, tile_size
    out: List[Tuple[np.ndarray, np.ndarray, Tuple[int, int]]] = []
    for y in sliding_window_steps(H, th, overlap):
        for x in sliding_window_steps(W, tw, overlap):
            img_tile = image[y : y + th, x : x + tw]
            msk_tile = mask01[y : y + th, x : x + tw]
            if img_tile.shape[0] != th or img_tile.shape[1] != tw:
                # Skip partial tiles (should not happen due to steps)
                continue
            cov = compute_mask_coverage(msk_tile)
            if cov >= min_mask_coverage:
                out.append((img_tile, msk_tile, (x, y)))
    return out


def write_png(path: str, rgb: np.ndarray) -> None:
    """
    Write PNG for 3- or 4-channel arrays.
    - If 3 channels: RGB -> BGR
    - If 4 channels: RGBA -> BGRA
    """
    if rgb.ndim != 3 or rgb.shape[-1] not in (3, 4):
        raise ValueError(f"write_png expects HxWx3 or HxWx4, got shape {rgb.shape}")
    if rgb.shape[-1] == 3:
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        cv2.imwrite(path, bgr)
    else:
        r, g, b, a = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2], rgb[:, :, 3]
        bgra = np.stack([b, g, r, a], axis=-1)
        cv2.imwrite(path, bgra)


def write_mask_png(path: str, mask01: np.ndarray) -> None:
    cv2.imwrite(path, (mask01 * 255).astype(np.uint8))


def matching_mask_path(images_dir: str, masks_dir: str, image_path: str) -> Optional[str]:
    base = os.path.splitext(os.path.basename(image_path))[0]
    # Try common mask extensions
    for ext in [".png", ".jpg", ".jpeg", ".tif", ".tiff"]:
        p = os.path.join(masks_dir, base + ext)
        if os.path.exists(p):
            return p
    return None


def list_files(dir_path: str) -> List[str]:
    exts = ("*.png", "*.jpg", "*.jpeg", "*.tif", "*.tiff")
    files: List[str] = []
    for ex in exts:
        files.extend(glob.glob(os.path.join(dir_path, ex)))
    files.sort()
    return files


# ----------------------------
# Augmentations
# ----------------------------

def _border_mode_from_str(mode: str) -> int:
    m = str(mode).strip().lower()
    if m == "reflect":
        return cv2.BORDER_REFLECT_101
    if m == "constant":
        return cv2.BORDER_CONSTANT
    if m == "edge":
        return cv2.BORDER_REPLICATE
    return cv2.BORDER_REFLECT_101


def build_augmentations_from_cfg(
    aug_cfg: Optional[Dict],
    image_channels: int,
    seed: int = 1337,
) -> A.Compose:
    """
    Build Albumentations Compose from config with backward compatibility:
    - Supports legacy flat probs: hflip, vflip, rotate90, brightness_contrast, shift_scale_rotate
    - Supports new toggles under train.augment.* with enabled/p and params
    - Spatial transforms always applied to both image and mask (mask nearest interpolation)
    - Photometric transforms applied only to images; for 4ch disabled unless allow_photometric_on_multichannel=true
    """
    cfg = aug_cfg or {}

    def _toggle(legacy_key: str, new_key: str, default_p: float = 0.0) -> Tuple[bool, float]:
        p = default_p
        enabled = False
        if isinstance(cfg.get(new_key), dict):
            enabled = bool(cfg[new_key].get("enabled", False))
            p = float(cfg[new_key].get("p", default_p))
        if legacy_key in cfg:
            p = float(cfg.get(legacy_key, p))
            enabled = enabled or (p > 0.0)
        return enabled, p

    # Global photometric allowance for multi-channel inputs
    allow_photo_multi = bool(cfg.get("allow_photometric_on_multichannel", False))
    photometric_allowed = (image_channels == 3) or ((image_channels == 4) and allow_photo_multi)

    # Determinism
    set_global_seeds(seed)

    transforms: List[A.BasicTransform] = []

    # Spatial transforms (image + mask)
    en, p = _toggle("hflip", "flip_horizontal", 0.0)
    if en and p > 0:
        transforms.append(A.HorizontalFlip(p=p))

    en, p = _toggle("vflip", "flip_vertical", 0.0)
    if en and p > 0:
        transforms.append(A.VerticalFlip(p=p))

    en, p = _toggle("rotate90", "random_rotate_90", 0.0)
    if en and p > 0:
        transforms.append(A.RandomRotate90(p=p))

    # Shift/Scale/Rotate
    # Legacy probability under "shift_scale_rotate" is honored. New detailed params under same key if dict.
    ssr_val = cfg.get("shift_scale_rotate", None)
    ssr_enabled = False
    ssr_p = 0.0
    ssr_params = {
        "shift_limit": 0.0625,
        "scale_limit": 0.10,
        "rotate_limit": 15,
        "border_mode": "reflect",
    }
    if isinstance(ssr_val, dict):
        ssr_enabled = bool(ssr_val.get("enabled", False))
        ssr_p = float(ssr_val.get("p", 0.0))
        ssr_params["shift_limit"] = float(ssr_val.get("shift_limit", ssr_params["shift_limit"]))
        ssr_params["scale_limit"] = float(ssr_val.get("scale_limit", ssr_params["scale_limit"]))
        ssr_params["rotate_limit"] = int(ssr_val.get("rotate_limit", ssr_params["rotate_limit"]))
        ssr_params["border_mode"] = str(ssr_val.get("border_mode", ssr_params["border_mode"]))
    elif ssr_val is not None:
        ssr_p = float(ssr_val)
        ssr_enabled = ssr_p > 0.0
    if ssr_enabled and ssr_p > 0:
        transforms.append(
            A.ShiftScaleRotate(
                shift_limit=ssr_params["shift_limit"],
                scale_limit=ssr_params["scale_limit"],
                rotate_limit=ssr_params["rotate_limit"],
                border_mode=_border_mode_from_str(ssr_params["border_mode"]),
                value=0,
                mask_value=0,
                interpolation=cv2.INTER_NEAREST,
                p=ssr_p,
            )
        )

    # Elastic transform (disabled by default)
    et_cfg = cfg.get("elastic_transform", {})
    if isinstance(et_cfg, dict) and bool(et_cfg.get("enabled", False)):
        transforms.append(
            A.ElasticTransform(
                alpha=float(et_cfg.get("alpha", 1.0)),
                sigma=float(et_cfg.get("sigma", 50.0)),
                alpha_affine=float(et_cfg.get("alpha_affine", 50.0)),
                border_mode=_border_mode_from_str(et_cfg.get("border_mode", "reflect")),
                value=0,
                mask_value=0,
                interpolation=cv2.INTER_NEAREST,
                p=float(et_cfg.get("p", 0.0)),
            )
        )

    # Cutout (CoarseDropout) - spatially consistent with masks; disabled by default
    co_cfg = cfg.get("cutout", {})
    if isinstance(co_cfg, dict) and bool(co_cfg.get("enabled", False)):
        num_holes = int(co_cfg.get("num_holes", 0))
        max_h = int(co_cfg.get("max_h_size", 0))
        max_w = int(co_cfg.get("max_w_size", 0))
        if num_holes > 0 and max_h > 0 and max_w > 0:
            transforms.append(
                A.CoarseDropout(
                    max_holes=num_holes,
                    max_height=max_h,
                    max_width=max_w,
                    min_height=max(1, max_h // 2),
                    min_width=max(1, max_w // 2),
                    fill_value=0,
                    mask_fill_value=0,
                    p=float(co_cfg.get("p", 0.0)),
                )
            )

    # Photometric transforms (image only)
    if photometric_allowed:
        photo_transforms: List[A.BasicTransform] = []

        # Brightness/Contrast (legacy and new)
        bc_val = cfg.get("brightness_contrast", None)
        bc_enabled = False
        bc_p = 0.0
        bc_params = {"brightness_limit": 0.2, "contrast_limit": 0.2}
        if isinstance(bc_val, dict):
            bc_enabled = bool(bc_val.get("enabled", False))
            bc_p = float(bc_val.get("p", 0.0))
            bc_params["brightness_limit"] = float(bc_val.get("brightness_limit", bc_params["brightness_limit"]))
            bc_params["contrast_limit"] = float(bc_val.get("contrast_limit", bc_params["contrast_limit"]))
        elif bc_val is not None:
            bc_p = float(bc_val)
            bc_enabled = bc_p > 0.0
        if bc_enabled and bc_p > 0:
            photo_transforms.append(A.RandomBrightnessContrast(p=bc_p, **bc_params))

        # Gaussian noise
        gn_cfg = cfg.get("gaussian_noise", {})
        if isinstance(gn_cfg, dict) and bool(gn_cfg.get("enabled", False)):
            if "var" in gn_cfg:
                var_limit = gn_cfg.get("var")
                if isinstance(var_limit, (int, float)):
                    var_limit = (float(var_limit), float(var_limit))
                else:
                    var_limit = tuple(map(float, var_limit))
            else:
                std_range = gn_cfg.get("std_range", [0.0, 0.0])
                s1, s2 = float(std_range[0]), float(std_range[1])
                var_limit = (s1 * s1, s2 * s2)
            photo_transforms.append(A.GaussNoise(var_limit=var_limit, p=float(gn_cfg.get("p", 0.0))))

        # Blur
        bl_cfg = cfg.get("blur", {})
        if isinstance(bl_cfg, dict) and bool(bl_cfg.get("enabled", False)):
            photo_transforms.append(A.Blur(blur_limit=int(bl_cfg.get("blur_limit", 3)), p=float(bl_cfg.get("p", 0.0))))

        # Gamma
        gm_cfg = cfg.get("gamma", {})
        if isinstance(gm_cfg, dict) and bool(gm_cfg.get("enabled", False)):
            gr = gm_cfg.get("gamma_range", [1.0, 1.0])
            lo, hi = float(gr[0]), float(gr[1])
            # Albumentations expects integers in [80,120] style
            photo_transforms.append(A.RandomGamma(gamma_limit=(int(lo * 100), int(hi * 100)), p=float(gm_cfg.get("p", 0.0))))

        # HSV (RGB-only; will be applied to first 3 channels when C==4)
        hsv_cfg = cfg.get("hsv", {})
        if isinstance(hsv_cfg, dict) and bool(hsv_cfg.get("enabled", False)):
            photo_transforms.append(
                A.HueSaturationValue(
                    hue_shift_limit=int(hsv_cfg.get("hue_shift_limit", 0)),
                    sat_shift_limit=int(hsv_cfg.get("sat_shift_limit", 0)),
                    val_shift_limit=int(hsv_cfg.get("val_shift_limit", 0)),
                    p=float(hsv_cfg.get("p", 0.0)),
                )
            )

        # CLAHE
        clahe_cfg = cfg.get("clahe", {})
        if isinstance(clahe_cfg, dict) and bool(clahe_cfg.get("enabled", False)):
            tgs = clahe_cfg.get("tile_grid_size", [8, 8])
            photo_transforms.append(
                A.CLAHE(
                    clip_limit=float(clahe_cfg.get("clip_limit", 2.0)),
                    tile_grid_size=tuple(map(int, tgs)),
                    p=float(clahe_cfg.get("p", 0.0)),
                )
            )

        # Atmospheric: Fog/Haze
        fog_cfg = cfg.get("fog_haze", {})
        if isinstance(fog_cfg, dict) and bool(fog_cfg.get("enabled", False)):
            density = float(fog_cfg.get("density", 0.05))
            photo_transforms.append(A.RandomFog(fog_coef_lower=density, fog_coef_upper=density, p=float(fog_cfg.get("p", 0.0))))

        # Atmospheric: Shadow
        sh_cfg = cfg.get("shadow", {})
        if isinstance(sh_cfg, dict) and bool(sh_cfg.get("enabled", False)):
            photo_transforms.append(
                A.RandomShadow(
                    num_shadows_lower=int(sh_cfg.get("num_shadows", 1)),
                    num_shadows_upper=int(sh_cfg.get("num_shadows", 1)),
                    shadow_dimension=float(sh_cfg.get("shadow_dimension", 5)),
                    p=float(sh_cfg.get("p", 0.0)),
                )
            )

        if len(photo_transforms) > 0:
            if image_channels == 3:
                transforms.extend(photo_transforms)
            elif image_channels == 4 and allow_photo_multi:
                photo_comp = A.Compose(photo_transforms, p=1.0)

                def _apply_rgb_only(img, comp=photo_comp):
                    rgb = img[:, :, :3]
                    nir = img[:, :, 3:4]
                    rgb_t = comp(image=rgb)["image"]
                    return np.concatenate([rgb_t, nir], axis=-1)

                transforms.append(A.Lambda(image=_apply_rgb_only, p=1.0))

    return A.Compose(transforms, p=1.0)


def build_augmentations(
    hflip_p: float = 0.5,
    vflip_p: float = 0.5,
    rotate90_p: float = 0.5,
    bc_p: float = 0.2,
    ssr_p: float = 0.2,
    seed: int = 1337,
) -> A.Compose:
    """
    Backward-compatible wrapper to preserve legacy callers.
    Maps flat probabilities into the new config-driven builder.
    """
    aug_cfg = {
        "hflip": float(hflip_p),
        "vflip": float(vflip_p),
        "rotate90": float(rotate90_p),
        "brightness_contrast": float(bc_p),
        "shift_scale_rotate": float(ssr_p),
    }
    # Default to 3-channel legacy behavior
    return build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)


# ----------------------------
# Dataset Sequences for Keras
# ----------------------------

class TileDataset(tf.keras.utils.Sequence if tf is not None else object):  # type: ignore
    def __init__(
        self,
        image_paths: List[str],
        mask_paths: List[str],
        batch_size: int = 4,
        shuffle: bool = True,
        augment: bool = False,
        aug_cfg: Optional[Dict] = None,
        seed: int = 1337,
        normalize: bool = True,
    ) -> None:
        self.image_paths = list(image_paths)
        self.mask_paths = list(mask_paths)
        assert len(self.image_paths) == len(self.mask_paths), "Image/mask count mismatch"
        self.batch_size = max(1, int(batch_size))
        self.shuffle = shuffle
        self.augment = augment
        self.normalize = normalize
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        if aug_cfg is None:
            aug_cfg = {}
        # Deterministic pipelines for 3- and 4-channel inputs
        self.aug3 = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)
        self.aug4 = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=4, seed=seed)

        self.indexes = np.arange(len(self.image_paths))
        if self.shuffle:
            self.rng.shuffle(self.indexes)

    def __len__(self) -> int:
        return int(math.ceil(len(self.image_paths) / self.batch_size))

    def on_epoch_end(self) -> None:
        if self.shuffle:
            self.rng.shuffle(self.indexes)

    def __getitem__(self, idx: int) -> Tuple[np.ndarray, np.ndarray]:
        start = idx * self.batch_size
        end = min((idx + 1) * self.batch_size, len(self.image_paths))
        batch_idx = self.indexes[start:end]
        imgs: List[np.ndarray] = []
        msks: List[np.ndarray] = []
        for i in batch_idx:
            # Read image (supports PNG/JPEG/TIFF and .nc if provided)
            img = read_image_any(self.image_paths[i])
            msk = cv2.imread(self.mask_paths[i], cv2.IMREAD_GRAYSCALE)
            if msk is None or img is None:
                raise FileNotFoundError(f"Missing file for pair: {self.image_paths[i]} / {self.mask_paths[i]}")
            msk = (msk > 127).astype(np.uint8)

            # Augmentations: spatial for 3/4ch; photometric for 3ch (and optionally 4ch via config)
            if self.augment and img.ndim == 3 and img.shape[-1] in (3, 4):
                aug = self.aug3 if img.shape[-1] == 3 else self.aug4
                if aug is not None:
                    augmented = aug(image=img, mask=msk)
                    img = augmented["image"]
                    msk = augmented["mask"]
                    # Ensure binary mask after spatial transforms
                    msk = (msk > 0).astype(np.uint8)

            img = img.astype(np.float32)
            if self.normalize:
                img /= 255.0
            msk = msk.astype(np.float32)[..., None]  # H W 1
            imgs.append(img)
            msks.append(msk)
        x = np.stack(imgs, axis=0)
        y = np.stack(msks, axis=0)
        return x, y

class Sentinel2Dataset(tf.keras.utils.Sequence if tf is not None else object):  # type: ignore
    def __init__(
        self,
        images_dir: str,
        masks_dir: str,
        batch_size: int = 4,
        shuffle: bool = True,
        augment: bool = False,
        aug_cfg: Optional[Dict] = None,
        seed: int = 1337,
        normalize: bool = True,
    ) -> None:
        self.images_dir = images_dir
        self.masks_dir = masks_dir
        self.image_paths = list_files(images_dir)
        self.mask_paths = [matching_mask_path(images_dir, masks_dir, p) for p in self.image_paths]
        self.mask_paths = [m for m in self.mask_paths if m is not None]
        self.image_paths = self.image_paths[:len(self.mask_paths)]
        assert len(self.image_paths) == len(self.mask_paths), "Image/mask count mismatch"
        self.batch_size = max(1, int(batch_size))
        self.shuffle = shuffle
        self.augment = augment
        self.normalize = normalize
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        if aug_cfg is None:
            aug_cfg = {}
        self.aug = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)
        self.indexes = np.arange(len(self.image_paths))
        if self.shuffle:
            self.rng.shuffle(self.indexes)

    def __len__(self) -> int:
        return int(math.ceil(len(self.image_paths) / self.batch_size))

    def on_epoch_end(self) -> None:
        if self.shuffle:
            self.rng.shuffle(self.indexes)

    def __getitem__(self, idx: int) -> Tuple[np.ndarray, np.ndarray]:
        start = idx * self.batch_size
        end = min((idx + 1) * self.batch_size, len(self.image_paths))
        batch_idx = self.indexes[start:end]
        imgs: List[np.ndarray] = []
        msks: List[np.ndarray] = []
        for i in batch_idx:
            img = read_image_any(self.image_paths[i])
            msk = cv2.imread(self.mask_paths[i], cv2.IMREAD_GRAYSCALE)
            if msk is None or img is None:
                raise FileNotFoundError(f"Missing file for pair: {self.image_paths[i]} / {self.mask_paths[i]}")
            msk = (msk > 127).astype(np.uint8)
            # Resize to 512x512
            img = cv2.resize(img, (512, 512), interpolation=cv2.INTER_LINEAR)
            msk = cv2.resize(msk, (512, 512), interpolation=cv2.INTER_NEAREST)
            if self.augment and img.ndim == 3 and img.shape[-1] == 3:
                augmented = self.aug(image=img, mask=msk)
                img = augmented["image"]
                msk = augmented["mask"]
                msk = (msk > 0).astype(np.uint8)
            img = img.astype(np.float32)
            if self.normalize:
                img /= 255.0
            msk = msk.astype(np.float32)[..., None]  # H W 1
            imgs.append(img)
            msks.append(msk)
        x = np.stack(imgs, axis=0)
        y = np.stack(msks, axis=0)
        return x, y


def build_sequences_from_tiles(
    tiles_dir: str,
    batch_size: int = 4,
    val_split_dirnames: Tuple[str, str] = ("train", "val"),
    augment_cfg: Optional[Dict] = None,
    seed: int = 1337,
) -> Tuple[TileDataset, TileDataset]:
    train_dir = os.path.join(tiles_dir, val_split_dirnames[0])
    val_dir = os.path.join(tiles_dir, val_split_dirnames[1])
    train_imgs = list_files(os.path.join(train_dir, "images"))
    train_msks = [matching_mask_path(os.path.join(train_dir, "images"), os.path.join(train_dir, "masks"), p) for p in train_imgs]
    train_pairs = [(i, m) for i, m in zip(train_imgs, train_msks) if m is not None]

    val_imgs = list_files(os.path.join(val_dir, "images"))
    val_msks = [matching_mask_path(os.path.join(val_dir, "images"), os.path.join(val_dir, "masks"), p) for p in val_imgs]
    val_pairs = [(i, m) for i, m in zip(val_imgs, val_msks) if m is not None]

    train_images = [p[0] for p in train_pairs]
    train_masks = [p[1] for p in train_pairs]
    val_images = [p[0] for p in val_pairs]
    val_masks = [p[1] for p in val_pairs]

    train_seq = TileDataset(
        train_images,
        train_masks,
        batch_size=batch_size,
        shuffle=True,
        augment=True,
        aug_cfg=augment_cfg,
        seed=seed,
    )
    val_seq = TileDataset(
        val_images,
        val_masks,
        batch_size=batch_size,
        shuffle=False,
        augment=False,
        aug_cfg=augment_cfg,
        seed=seed,
    )
    return train_seq, val_seq


# ----------------------------
# Tiling CLI and Logic
# ----------------------------

def split_by_image(files: List[str], val_ratio: float, seed: int) -> Tuple[List[str], List[str]]:
    rng = np.random.RandomState(seed)
    files_sorted = sorted(files)
    rng.shuffle(files_sorted)
    n_val = max(1, int(round(len(files_sorted) * float(val_ratio)))) if len(files_sorted) > 1 else 1 if len(files_sorted) == 1 and val_ratio > 0 else 0
    val_set = set(files_sorted[:n_val])
    train_list = [f for f in files_sorted if f not in val_set]
    val_list = [f for f in files_sorted if f in val_set]
    return train_list, val_list


def perform_tiling(
    data_dir: str,
    tile_size: int = 512,
    overlap: int = 64,
    min_mask_coverage: float = 0.005,
    val_ratio: float = 0.2,
    seed: int = 1337,
) -> Dict[str, int]:
    raw_images_dir = os.path.join(data_dir, "raw", "images")
    raw_masks_dir = os.path.join(data_dir, "raw", "masks")
    if not os.path.isdir(raw_images_dir) or not os.path.isdir(raw_masks_dir):
        raise FileNotFoundError(f"Expected raw images/masks at {raw_images_dir} and {raw_masks_dir}")

    tiles_base = os.path.join(data_dir, "tiles")
    train_img_out = os.path.join(tiles_base, "train", "images")
    train_msk_out = os.path.join(tiles_base, "train", "masks")
    val_img_out = os.path.join(tiles_base, "val", "images")
    val_msk_out = os.path.join(tiles_base, "val", "masks")
    for d in [train_img_out, train_msk_out, val_img_out, val_msk_out]:
        ensure_dir(d)

    image_files = list_files(raw_images_dir)
    if len(image_files) == 0:
        raise FileNotFoundError(f"No images found under {raw_images_dir}")
def build_sequences_from_sentinel2(
    sentinel2_base_dir: str,
    batch_size: int = 4,
    augment_cfg: Optional[Dict] = None,
    seed: int = 1337,
) -> Tuple[Sentinel2Dataset, Sentinel2Dataset, Sentinel2Dataset]:
    train_images_dir = os.path.join(sentinel2_base_dir, "train", "train_images")
    train_masks_dir = os.path.join(sentinel2_base_dir, "train", "train_masks")
    val_images_dir = os.path.join(sentinel2_base_dir, "val", "val_images")
    val_masks_dir = os.path.join(sentinel2_base_dir, "val", "val_masks")
    test_images_dir = os.path.join(sentinel2_base_dir, "test", "test_images")
    test_masks_dir = os.path.join(sentinel2_base_dir, "test", "test_masks")
    train_seq = Sentinel2Dataset(
        train_images_dir,
        train_masks_dir,
        batch_size=batch_size,
        shuffle=True,
        augment=True,
        aug_cfg=augment_cfg,
        seed=seed,
    )
    val_seq = Sentinel2Dataset(
        val_images_dir,
        val_masks_dir,
        batch_size=batch_size,
        shuffle=False,
        augment=False,
        aug_cfg=augment_cfg,
        seed=seed,
    )
    test_seq = Sentinel2Dataset(
        test_images_dir,
        test_masks_dir,
        batch_size=batch_size,
        shuffle=False,
        augment=False,
        aug_cfg=augment_cfg,
        seed=seed,
    )
    return train_seq, val_seq, test_seq

    # Filter to those with matching masks
    pairs: List[Tuple[str, str]] = []
    for img_path in image_files:
        msk_path = matching_mask_path(raw_images_dir, raw_masks_dir, img_path)
        if msk_path is not None:
            pairs.append((img_path, msk_path))
    if len(pairs) == 0:
        raise FileNotFoundError("No image/mask pairs found in raw/")

    # Split by image to reduce leakage
    img_paths = [p[0] for p in pairs]
    train_imgs, val_imgs = split_by_image(img_paths, val_ratio=val_ratio, seed=seed)
    train_set = set(train_imgs)
    val_set = set(val_imgs)

    counts = {"train_tiles": 0, "val_tiles": 0, "skipped": 0}

    for img_path, msk_path in tqdm(pairs, desc="Tiling", unit="img"):
        try:
            img = read_image_any(img_path)
            msk = read_mask_any(msk_path)
            msk01 = binarize_mask(msk)
        except Exception as e:
            print(f"Warning: skipping pair due to read error: {img_path} / {msk_path} ({e})")
            continue

        tiles = tile_image_and_mask(
            img, msk01, tile_size=tile_size, overlap=overlap, min_mask_coverage=min_mask_coverage
        )
        if len(tiles) == 0:
            counts["skipped"] += 1
            continue

        base = os.path.splitext(os.path.basename(img_path))[0]
        is_val = img_path in val_set

        for (img_tile, msk_tile, (x, y)) in tiles:
            tile_name = f"{base}_x{x}_y{y}.png"
            if is_val:
                write_png(os.path.join(val_img_out, tile_name), img_tile)
                write_mask_png(os.path.join(val_msk_out, tile_name), msk_tile)
                counts["val_tiles"] += 1
            else:
                write_png(os.path.join(train_img_out, tile_name), img_tile)
                write_mask_png(os.path.join(train_msk_out, tile_name), msk_tile)
                counts["train_tiles"] += 1

    return counts


def index_tiles(data_dir: str) -> Dict[str, int]:
    tiles_base = os.path.join(data_dir, "tiles")
    train_img = list_files(os.path.join(tiles_base, "train", "images"))
    train_msk = list_files(os.path.join(tiles_base, "train", "masks"))
    val_img = list_files(os.path.join(tiles_base, "val", "images"))
    val_msk = list_files(os.path.join(tiles_base, "val", "masks"))
    return {
        "train_images": len(train_img),
        "train_masks": len(train_msk),
        "val_images": len(val_img),
        "val_masks": len(val_msk),
    }


# ----------------------------
# CLI
# ----------------------------

def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser("Dataset utilities for tiling and indexing (DeepGlobe-style)")
    sub = p.add_subparsers(dest="cmd", required=True)

    # tile subcommand
    pt = sub.add_parser("tile", help="Tile raw images/masks into fixed-size patches with overlap")
    pt.add_argument("--data-dir", type=str, default=os.getenv("DATA_DIR", "./data"))
    pt.add_argument("--tile-size", type=int, default=512)
    pt.add_argument("--overlap", type=int, default=64)
    pt.add_argument("--min-mask-coverage", type=float, default=0.005, help="Minimum mask coverage (0..1) to keep a tile")
    pt.add_argument("--val-ratio", type=float, default=0.2)
    pt.add_argument("--seed", type=int, default=1337)

    # index subcommand
    pi = sub.add_parser("index", help="Show counts of tiles for train/val")
    pi.add_argument("--data-dir", type=str, default=os.getenv("DATA_DIR", "./data"))

    # build-seq dry-run command (shape check)
    pb = sub.add_parser("check", help="Build sequences from tiles and print batch shapes")
    pb.add_argument("--data-dir", type=str, default=os.getenv("DATA_DIR", "./data"))
    pb.add_argument("--batch-size", type=int, default=4)
    pb.add_argument("--seed", type=int, default=1337)

    return p


def main(argv: Optional[List[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    if args.cmd == "tile":
        start = time.time()
        stats = perform_tiling(
            data_dir=args.data_dir,
            tile_size=int(args.tile_size),
            overlap=int(args.overlap),
            min_mask_coverage=float(args.min_mask_coverage),
            val_ratio=float(args.val_ratio),
            seed=int(args.seed),
        )
        elapsed = time.time() - start
        print(json.dumps({"status": "ok", "stats": stats, "seconds": round(elapsed, 2)}, indent=2))
        return 0

    if args.cmd == "index":
        stats = index_tiles(args.data_dir)
        print(json.dumps({"status": "ok", "stats": stats}, indent=2))
        return 0

    if args.cmd == "check":
        tiles_dir = os.path.join(args.data_dir, "tiles")
        train_seq, val_seq = build_sequences_from_tiles(
            tiles_dir=tiles_dir,
            batch_size=int(args.batch_size),
            val_split_dirnames=("train", "val"),
            augment_cfg={"hflip": 0.5, "vflip": 0.5, "rotate90": 0.5, "brightness_contrast": 0.2, "shift_scale_rotate": 0.2},
            seed=int(args.seed),
        )
        x, y = train_seq[0]
        print(json.dumps({"train_batch": {"x": list(x.shape), "y": list(y.shape)}}, indent=2))
        x2, y2 = val_seq[0]
        print(json.dumps({"val_batch": {"x": list(x2.shape), "y": list(y2.shape)}}, indent=2))
        return 0

    print("Unknown command", file=sys.stderr)
    return 2


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())