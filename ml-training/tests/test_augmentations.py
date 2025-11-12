import os
import sys
import numpy as np

# Ensure ml-training is importable
HERE = os.path.dirname(__file__)
ML_TRAINING_ROOT = os.path.abspath(os.path.join(HERE, ".."))
if ML_TRAINING_ROOT not in sys.path:
    sys.path.insert(0, ML_TRAINING_ROOT)

from dataset import build_augmentations_from_cfg, set_global_seeds  # noqa: E402


def _make_rgb_with_square(h=64, w=64, square=(16, 16, 32, 32), val=255):
    img = np.zeros((h, w, 3), dtype=np.uint8)
    y0, x0, y1, x1 = square
    img[y0:y1, x0:x1, :] = val
    mask = np.zeros((h, w), dtype=np.uint8)
    mask[y0:y1, x0:x1] = 1
    return img, mask


def _make_rgba_with_square(h=64, w=64, square=(16, 16, 32, 32), val_rgb=200, val_a=77):
    img = np.zeros((h, w, 4), dtype=np.uint8)
    y0, x0, y1, x1 = square
    img[y0:y1, x0:x1, :3] = val_rgb
    img[:, :, 3] = val_a  # NIR/alpha channel with constant pattern
    mask = np.zeros((h, w), dtype=np.uint8)
    mask[y0:y1, x0:x1] = 1
    return img, mask


def test_alignment_spatial_transforms():
    # Synthetic image with white square and binary mask
    img, mask = _make_rgb_with_square(h=64, w=64, square=(16, 20, 32, 36), val=255)

    # Deterministic spatial-only pipeline: flips + shift (no rotate/scale)
    seed = 123
    aug_cfg = {
        "flip_horizontal": {"enabled": True, "p": 1.0},
        "flip_vertical": {"enabled": True, "p": 1.0},
        "random_rotate_90": {"enabled": False, "p": 0.0},
        "shift_scale_rotate": {
            "enabled": True,
            "p": 1.0,
            "shift_limit": 0.1,
            "scale_limit": 0.0,
            "rotate_limit": 0,
            "border_mode": "reflect",
        },
        # Ensure no photometric ops
        "brightness_contrast": {"enabled": False, "p": 0.0},
    }
    set_global_seeds(seed)
    aug = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)

    out = aug(image=img, mask=mask)
    img_aug = out["image"]
    mask_aug = out["mask"]

    # Threshold image to detect the transformed square region
    bright = (img_aug.astype(np.int32).mean(axis=2) > 200).astype(np.uint8)
    # Masks should align exactly with the bright region
    assert img_aug.shape[:2] == mask_aug.shape[:2]
    assert np.array_equal(bright, (mask_aug > 0).astype(np.uint8)), "Transformed mask must align with transformed image square"


def test_photometric_no_effect_on_masks():
    img, mask = _make_rgb_with_square(h=64, w=64, square=(8, 8, 40, 40), val=180)

    seed = 7
    aug_cfg = {
        # No spatial ops
        "flip_horizontal": {"enabled": False, "p": 0.0},
        "flip_vertical": {"enabled": False, "p": 0.0},
        "random_rotate_90": {"enabled": False, "p": 0.0},
        "shift_scale_rotate": {"enabled": False, "p": 0.0},
        # Photometric ops enabled
        "brightness_contrast": {"enabled": True, "p": 1.0, "brightness_limit": 0.3, "contrast_limit": 0.3},
        "hsv": {"enabled": True, "p": 1.0, "hue_shift_limit": 10, "sat_shift_limit": 20, "val_shift_limit": 10},
        "gaussian_noise": {"enabled": True, "p": 1.0, "std_range": [5.0, 10.0]},
        "blur": {"enabled": True, "p": 1.0, "blur_limit": 3},
        "gamma": {"enabled": True, "p": 1.0, "gamma_range": [0.9, 1.1]},
        "clahe": {"enabled": True, "p": 1.0, "clip_limit": 2.0, "tile_grid_size": [8, 8]},
        "fog_haze": {"enabled": True, "p": 1.0, "density": 0.05},
        "shadow": {"enabled": True, "p": 1.0, "num_shadows": 1, "shadow_dimension": 5},
    }
    set_global_seeds(seed)
    aug = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)

    out = aug(image=img, mask=mask)
    mask_aug = out["mask"]

    # Mask must be exactly unchanged and binary
    assert np.array_equal(mask_aug, mask), "Photometric transforms must not modify masks"
    uniq = np.unique(mask_aug)
    assert set(uniq.tolist()).issubset({0, 1}), "Mask must remain binary {0,1}"
    assert mask_aug.sum() == mask.sum(), "Count of positives in mask must be unchanged"


def test_multichannel_photometric_disabled_by_default():
    img4, mask = _make_rgba_with_square(h=64, w=64, square=(12, 22, 28, 44), val_rgb=150, val_a=123)

    seed = 99
    # Enable only photometric ops with p=1.0 but do NOT allow on multichannel
    aug_cfg = {
        "allow_photometric_on_multichannel": False,
        "brightness_contrast": {"enabled": True, "p": 1.0, "brightness_limit": 0.4, "contrast_limit": 0.4},
        "hsv": {"enabled": True, "p": 1.0, "hue_shift_limit": 15, "sat_shift_limit": 25, "val_shift_limit": 15},
        "gaussian_noise": {"enabled": True, "p": 1.0, "std_range": [10.0, 20.0]},
        "blur": {"enabled": True, "p": 1.0, "blur_limit": 3},
        "gamma": {"enabled": True, "p": 1.0, "gamma_range": [0.8, 1.2]},
        "clahe": {"enabled": True, "p": 1.0, "clip_limit": 2.0, "tile_grid_size": [8, 8]},
        "fog_haze": {"enabled": True, "p": 1.0, "density": 0.05},
        "shadow": {"enabled": True, "p": 1.0, "num_shadows": 1, "shadow_dimension": 5},
    }
    set_global_seeds(seed)
    aug = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=4, seed=seed)

    out = aug(image=img4, mask=mask)
    img4_aug = out["image"]
    mask_aug = out["mask"]

    # Because photometric ops are disabled for 4-channel by default, and no spatial ops are enabled,
    # both image and mask should remain exactly identical.
    assert np.array_equal(img4_aug, img4), "Photometric transforms must be skipped for multichannel inputs by default"
    assert np.array_equal(mask_aug, mask), "Mask must remain unchanged when only photometric transforms are requested"


def test_determinism_fixed_seed():
    img, mask = _make_rgb_with_square(h=64, w=64, square=(10, 18, 30, 42), val=200)

    seed = 2025
    aug_cfg = {
        "flip_horizontal": {"enabled": True, "p": 0.7},
        "flip_vertical": {"enabled": True, "p": 0.6},
        "random_rotate_90": {"enabled": True, "p": 0.5},
        "shift_scale_rotate": {"enabled": True, "p": 0.8, "shift_limit": 0.1, "scale_limit": 0.0, "rotate_limit": 0},
        "brightness_contrast": {"enabled": True, "p": 0.5, "brightness_limit": 0.2, "contrast_limit": 0.2},
    }

    # Build and apply twice, resetting seeds each time to guarantee identical outputs
    set_global_seeds(seed)
    aug1 = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)
    out1 = aug1(image=img, mask=mask)
    img1, mask1 = out1["image"], out1["mask"]

    set_global_seeds(seed)
    aug2 = build_augmentations_from_cfg(aug_cfg=aug_cfg, image_channels=3, seed=seed)
    out2 = aug2(image=img, mask=mask)
    img2, mask2 = out2["image"], out2["mask"]

    assert np.array_equal(img1, img2), "With fixed seed, repeated pipeline builds should yield identical image outputs"
    assert np.array_equal(mask1, mask2), "With fixed seed, repeated pipeline builds should yield identical mask outputs"