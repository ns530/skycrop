import os
import sys
import shutil
import random
import argparse
from typing import List, Tuple, Dict
from pathlib import Path
import numpy as np
import cv2

# Ensure local imports work
CURRENT_DIR = os.path.dirname(__file__)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from dataset import list_files, matching_mask_path


def calculate_mask_coverage(mask_path: str) -> float:
    """Calculate the percentage of field pixels in a mask"""
    if not os.path.exists(mask_path):
        return 0.0

    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        return 0.0

    # Calculate coverage (pixels > 127 are considered field)
    coverage = np.mean(mask > 127)
    return float(coverage)


def find_image_mask_pairs(images_dir: str, masks_dir: str) -> List[Tuple[str, str, float]]:
    """Find all image-mask pairs with coverage scores"""
    image_files = list_files(images_dir)
    pairs = []

    print(f"Scanning {len(image_files)} images for valid pairs...")

    for img_path in image_files:
        mask_path = matching_mask_path(images_dir, masks_dir, img_path)
        if mask_path and os.path.exists(mask_path):
            coverage = calculate_mask_coverage(mask_path)
            if coverage > 0.01:  # At least 1% field coverage
                pairs.append((img_path, mask_path, coverage))

    print(f"Found {len(pairs)} valid image-mask pairs")
    return pairs


def stratified_sample_pairs(pairs: List[Tuple[str, str, float]], target_samples: int = 500, seed: int = 42) -> List[Tuple[str, str, float]]:
    """Sample pairs using stratified sampling based on coverage"""

    # Sort by coverage
    pairs_sorted = sorted(pairs, key=lambda x: x[2])

    # Create coverage bins (low, medium, high coverage)
    n_pairs = len(pairs_sorted)
    bin_size = n_pairs // 3

    low_coverage = pairs_sorted[:bin_size]
    medium_coverage = pairs_sorted[bin_size:2*bin_size]
    high_coverage = pairs_sorted[2*bin_size:]

    print(f"Coverage distribution:")
    print(f"  Low (0-33%): {len(low_coverage)} images")
    print(f"  Medium (33-66%): {len(medium_coverage)} images")
    print(f"  High (66-100%): {len(high_coverage)} images")

    # Sample proportionally from each bin
    samples_per_bin = target_samples // 3
    random.seed(seed)

    selected = []
    selected.extend(random.sample(low_coverage, min(samples_per_bin, len(low_coverage))))
    selected.extend(random.sample(medium_coverage, min(samples_per_bin, len(medium_coverage))))
    selected.extend(random.sample(high_coverage, min(samples_per_bin, len(high_coverage))))

    # Fill remaining slots if needed
    remaining = target_samples - len(selected)
    if remaining > 0:
        available = [p for p in pairs_sorted if p not in selected]
        if available:
            selected.extend(random.sample(available, min(remaining, len(available))))

    # Shuffle final selection
    random.shuffle(selected)

    print(f"Selected {len(selected)} images with diverse coverage")
    return selected


def create_training_structure(selected_pairs: List[Tuple[str, str, float]], output_dir: str, val_ratio: float = 0.2, test_ratio: float = 0.1):
    """Create the standard training directory structure"""

    # Create directories
    train_img_dir = os.path.join(output_dir, "train", "images")
    train_mask_dir = os.path.join(output_dir, "train", "masks")
    val_img_dir = os.path.join(output_dir, "val", "images")
    val_mask_dir = os.path.join(output_dir, "val", "masks")
    test_img_dir = os.path.join(output_dir, "test", "images")
    test_mask_dir = os.path.join(output_dir, "test", "masks")

    for dir_path in [train_img_dir, train_mask_dir, val_img_dir, val_mask_dir, test_img_dir, test_mask_dir]:
        os.makedirs(dir_path, exist_ok=True)

    # Split the data
    n_total = len(selected_pairs)
    n_test = int(n_total * test_ratio)
    n_val = int(n_total * val_ratio)
    n_train = n_total - n_test - n_val

    # Shuffle before splitting
    random.shuffle(selected_pairs)

    train_pairs = selected_pairs[:n_train]
    val_pairs = selected_pairs[n_train:n_train + n_val]
    test_pairs = selected_pairs[n_train + n_val:]

    print(f"Split ratios:")
    print(f"  Train: {len(train_pairs)} images ({n_train/n_total:.1%})")
    print(f"  Val: {len(val_pairs)} images ({n_val/n_total:.1%})")
    print(f"  Test: {len(test_pairs)} images ({n_test/n_total:.1%})")

    # Copy files
    def copy_pairs(pairs, img_dest, mask_dest, split_name):
        for i, (img_src, mask_src, coverage) in enumerate(pairs):
            # Generate new filename to avoid conflicts
            base_name = f"{split_name}_{i:04d}"
            img_ext = os.path.splitext(img_src)[1]
            mask_ext = os.path.splitext(mask_src)[1]

            img_dest_path = os.path.join(img_dest, f"{base_name}{img_ext}")
            mask_dest_path = os.path.join(mask_dest, f"{base_name}.png")  # Always save masks as PNG

            # Copy image
            shutil.copy2(img_src, img_dest_path)

            # Copy mask (convert if needed)
            if mask_ext.lower() in ['.png', '.jpg', '.jpeg']:
                shutil.copy2(mask_src, mask_dest_path)
            else:
                # Convert mask to PNG
                mask = cv2.imread(mask_src, cv2.IMREAD_GRAYSCALE)
                if mask is not None:
                    cv2.imwrite(mask_dest_path, mask)

            if (i + 1) % 50 == 0:
                print(f"  Copied {i + 1}/{len(pairs)} {split_name} images")

    print("Copying training images...")
    copy_pairs(train_pairs, train_img_dir, train_mask_dir, "train")

    print("Copying validation images...")
    copy_pairs(val_pairs, val_img_dir, val_mask_dir, "val")

    print("Copying test images...")
    copy_pairs(test_pairs, test_img_dir, test_mask_dir, "test")

    return {
        "train": len(train_pairs),
        "val": len(val_pairs),
        "test": len(test_pairs)
    }


def main():
    parser = argparse.ArgumentParser("Sample and organize dataset for training")
    parser.add_argument("--images-dir", type=str, required=True, help="Directory containing images")
    parser.add_argument("--masks-dir", type=str, required=True, help="Directory containing masks")
    parser.add_argument("--output-dir", type=str, required=True, help="Output directory for organized dataset")
    parser.add_argument("--target-samples", type=int, default=500, help="Number of samples to select")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation ratio")
    parser.add_argument("--test-ratio", type=float, default=0.1, help="Test ratio")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")

    args = parser.parse_args()

    print("=== Dataset Sampling Script ===")
    print(f"Images directory: {args.images_dir}")
    print(f"Masks directory: {args.masks_dir}")
    print(f"Output directory: {args.output_dir}")
    print(f"Target samples: {args.target_samples}")
    print()

    # Find all valid pairs
    pairs = find_image_mask_pairs(args.images_dir, args.masks_dir)

    if len(pairs) < args.target_samples:
        print(f"Warning: Only found {len(pairs)} valid pairs, using all of them")
        args.target_samples = len(pairs)

    # Sample pairs
    selected_pairs = stratified_sample_pairs(pairs, args.target_samples, args.seed)

    # Create training structure
    stats = create_training_structure(
        selected_pairs,
        args.output_dir,
        args.val_ratio,
        args.test_ratio
    )

    print("\n=== Summary ===")
    print(f"Original dataset: {len(pairs)} valid pairs")
    print(f"Sampled dataset: {sum(stats.values())} images")
    print(f"Train: {stats['train']} | Val: {stats['val']} | Test: {stats['test']}")
    print(f"Output directory: {args.output_dir}")
    print("\nYou can now train with:")
    print(f"python train_unet.py --config config.yaml")
    print("(Make sure to update config.yaml data_dir to point to the new dataset)")


if __name__ == "__main__":
    main()