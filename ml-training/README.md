# SkyCrop ML Training — U-Net Baseline (Sprint 2)

This package provides a reproducible, CPU-friendly U-Net training workflow for boundary detection (agricultural fields/paddy boundaries). It implements Sprint 2 ML research assets to satisfy the ML service integration contract and produce baseline artifacts for inference and registry management.

Key capabilities:
- Dataset preparation pipeline (tiling + augmentations) for DeepGlobe-style image/mask pairs
- Configurable U-Net baseline (Keras/TensorFlow) with BCE+Dice loss, IoU/Dice metrics
- Training entrypoint with TensorBoard logging and checkpointing
- Export to TensorFlow SavedModel and ONNX, with sha256 and model registry update
- Offline inference utility with tiling + stitching to GeoJSON polygons
- Tests and synthetic fixtures for CI-friendly smoke validation

Refer to the Sprint 2 contracts and integration plan:
- [ml_service_contracts_sprint2.md](Doc/System Design Phase/ml_service_contracts_sprint2.md)
- [sprint2_integration_plan.md](Doc/System Design Phase/sprint2_integration_plan.md)
- [acceptance_criteria_sprint2.md](Doc/System Design Phase/acceptance_criteria_sprint2.md)

## Environment

- Python 3.9–3.11 recommended
- CPU-only expected (no GPU required)
- Install requirements:

```bash
python -m pip install -U pip
python -m pip install -r ml-training/requirements.txt
```

You may copy and adapt the environment file:
```bash
cp ml-training/.env.example .env
```

`.env` variables (optional, can also be set per-command):
- `DATA_DIR` default: `./data`
- `RUNS_DIR` default: `./runs`
- `MODEL_VERSION` default: `1.0.0`

## Repository Layout

- Code
  - [config.yaml](ml-training/config.yaml)
  - [dataset.py](ml-training/dataset.py) — loader, tiler, augmentations, train/val split
  - [model_unet.py](ml-training/model_unet.py) — U-Net + loss/metrics wrappers
  - [train_unet.py](ml-training/train_unet.py) — training loop, TensorBoard, checkpoints
  - [infer.py](ml-training/infer.py) — offline inference on large raster to GeoJSON
  - [export.py](ml-training/export.py) — SavedModel + ONNX exports, sha256, registry
  - [metrics.py](ml-training/metrics.py) — IoU, Dice, PR AUC
  - [utils_geo.py](ml-training/utils_geo.py) — raster→vector polygonization
- Artifacts and registry
  - `ml-training/models/unet/1.0.0/` — trained artifacts live here after export
  - [model_registry.json](ml-training/model_registry.json) — append-only registry
- Packaging
  - [requirements.txt](ml-training/requirements.txt)
  - [Makefile](ml-training/Makefile)
  - [.env.example](ml-training/.env.example)
  - [.gitignore](ml-training/.gitignore)
- Tests
  - `ml-training/tests/` — dataset, smoke train, export/registry + synthetic fixtures

## Dataset

This project expects DeepGlobe-style paired images and masks (or any equivalent boundary dataset you can map to a binary segmentation mask).

Directory layout under `DATA_DIR`:
```
${DATA_DIR}/
  raw/
    images/   # source rasters (GeoTIFF/PNG/JPEG)
    masks/    # corresponding binary masks (same filename base)
  tiles/
    train/
      images/
      masks/
    val/
      images/
      masks/
```

Notes:
- Filenames should match between `images` and `masks` by base name (e.g., `A_001.png` and `A_001.png`).
- Masks should be single-channel with 0/1 values (or convertible via thresholding to binary).
- For DeepGlobe Land Cover or similar datasets, download them locally and place files under `raw/images` and `raw/masks`. Actual download steps are omitted to avoid large binaries in the repo.

Example sources (for your convenience; validate license and paths yourself):
- DeepGlobe: https://competitions.codalab.org/competitions/18468
- Additional agricultural boundary datasets may be used if compatible.

## Tiling

Use a sliding window to tile large images to 512×512 with overlap=64 and skip tiles with mask coverage < 0.5% to reduce empty samples.

The tiling and indexing utility will be provided via [dataset.py](ml-training/dataset.py) CLI. Example (to be implemented by this package):

```bash
# Example tiling command (provided by dataset.py)
python ml-training/dataset.py tile \
  --data-dir ./data \
  --tile-size 512 \
  --overlap 64 \
  --val-ratio 0.2 \
  --min-mask-coverage 0.005 \
  --seed 1337
```

After running, you should see train/val tiles in `DATA_DIR/tiles/{train,val}/{images,masks}`.

## Config

[config.yaml](ml-training/config.yaml:1) controls most aspects:
- Data and tiling parameters
- Train/val split ratio
- Training hyperparameters, loss weights, and augmentations probabilities
- Model architecture (U-Net depth, base filters)
- Metric thresholds
- Paths for runs and models
- Checkpoint/early stopping policy
- Registry version

Override via environment variables (`DATA_DIR`, `RUNS_DIR`, `MODEL_VERSION`) or pass a different config file at runtime.

### Advanced augmentations (Albumentations)

- Spatial transforms (mask-safe; nearest-neighbor for masks):
  - flip_horizontal, flip_vertical, random_rotate_90
  - shift_scale_rotate (shift_limit, scale_limit, rotate_limit, border_mode)
  - elastic_transform (alpha, sigma, alpha_affine) [disabled by default]
  - cutout/CoarseDropout (num_holes, max_h_size, max_w_size) [disabled by default]
- Photometric transforms (image-only; masks never changed):
  - gaussian_noise, blur, gamma, hsv, brightness_contrast, clahe
  - Atmospheric: fog_haze, shadow
- Multi-channel behavior:
  - 3-channel RGB: spatial + photometric allowed.
  - 4-channel RGB+NIR: spatial allowed; photometric disabled by default unless `allow_photometric_on_multichannel: true`.
- Determinism:
  - Pipelines honor the global seed and produce reproducible results across runs.
  - See [python.build_augmentations_from_cfg()](ml-training/dataset.py:253).

Example config snippet (all options optional; defaults preserve previous behavior):
```yaml
train:
  augment:
    # Backward-compatible legacy probabilities (unchanged defaults)
    hflip: 0.5
    vflip: 0.5
    rotate90: 0.5
    brightness_contrast: 0.2
    shift_scale_rotate: 0.2

    # Multi-channel photometric policy
    allow_photometric_on_multichannel: false

    # New, individually toggleable transforms (disabled by default)
    flip_horizontal: { enabled: true, p: 0.5 }
    flip_vertical:   { enabled: true, p: 0.5 }
    random_rotate_90:{ enabled: true, p: 0.5 }

    shift_scale_rotate:
      enabled: true
      p: 0.3
      shift_limit: 0.1
      scale_limit: 0.1
      rotate_limit: 15
      border_mode: reflect   # reflect|constant|edge

    elastic_transform:
      enabled: false
      p: 0.2
      alpha: 1.0
      sigma: 50.0
      alpha_affine: 50.0

    gaussian_noise: { enabled: false, p: 0.1, std_range: [5.0, 25.0] }
    blur:           { enabled: false, p: 0.1, blur_limit: 3 }
    gamma:          { enabled: false, p: 0.1, gamma_range: [0.9, 1.1] }
    hsv:
      enabled: false
      p: 0.1
      hue_shift_limit: 10
      sat_shift_limit: 20
      val_shift_limit: 10
    brightness_contrast:
      enabled: false
      p: 0.3
      brightness_limit: 0.2
      contrast_limit: 0.2
    clahe:
      enabled: false
      p: 0.1
      clip_limit: 2.0
      tile_grid_size: [8, 8]
    fog_haze: { enabled: false, p: 0.1, density: 0.05 }
    shadow:   { enabled: false, p: 0.1, num_shadows: 1, shadow_dimension: 5 }
    cutout:   { enabled: false, p: 0.1, num_holes: 4, max_h_size: 32, max_w_size: 32 }
```

### Sentinel-2 NetCDF Preprocessing (optional)

A lightweight preprocessor converts Sentinel-2 NetCDF (.nc) tiles into training-ready RGB or RGB+NIR PNG/GeoTIFF images with optional cloud masks.

- Module: [preprocess_sentinel2.py](ml-training/preprocess_sentinel2.py:1)
- Default band mapping: RGB = B04,B03,B02; optional NIR = B08 when `include_nir=true`
- Normalization modes:
  - `percentile` (default): per-band [p2,p98] stretch to [0,255]
  - `per_band`: min/max per band mapped to [0,255]
  - `none`: assume reflectance-like scale and map linearly (0..10000 -> 0..255)
- Cloud mask (optional):
  - Sources: `scl` (Scene Classification), `cloud_probability` (e.g., s2cloudless), `heuristic` (brightness)
  - When selected source is missing, the pipeline logs a warning and proceeds without masking

Enable via config (kept disabled by default to preserve current flows):
```yaml
data:
  sentinel2:
    enabled: false
    input_dir: sentinel2_datasets/
    output_dir: data/processed/sentinel2/
    bands: [B04, B03, B02]
    include_nir: false
    normalize: { method: percentile, percentiles: [2, 98] }
    cloud_mask: { enabled: false, source: scl, threshold: 0.4 }
    output: { format: png, structure: folders }  # folders | manifest
```

Run preprocessing (CLI):
```bash
# RGB PNGs (default)
python ml-training/preprocess_sentinel2.py \
  --input-dir sentinel2_datasets/test/test_images \
  --output-dir ./data/processed/sentinel2 \
  --bands B04,B03,B02 \
  --output-format png \
  --structure folders

# RGB+NIR PNGs
python ml-training/preprocess_sentinel2.py \
  --input-dir sentinel2_datasets/test/test_images \
  --output-dir ./data/processed/sentinel2_rgba \
  --bands B04,B03,B02 \
  --include-nir \
  --output-format png

# With cloud mask from SCL (if present)
python ml-training/preprocess_sentinel2.py \
  --input-dir sentinel2_datasets/test/test_images \
  --output-dir ./data/processed/sentinel2_masked \
  --cloud-mask-enabled \
  --cloud-mask-source scl
```

Typical output structure:
```
data/processed/sentinel2/
  images/
    AT_316_S2_10m_256.png
    ...
  masks/                 # only if cloud_mask.enabled true and available
    AT_316_S2_10m_256.png
```

Notes:
- The dataset loader [dataset.py](ml-training/dataset.py:1) can read 3- or 4-channel PNGs (and TIFFs) transparently.
- Augmentations:
  - Spatial transforms apply identically to images and masks; masks use nearest-neighbor and stay binary {0,1}.
  - Photometric transforms never alter masks; for 4-channel inputs they are disabled by default unless `train.augment.allow_photometric_on_multichannel: true`.
- If .nc files are consumed directly, the helper read path is used only when explicitly pointed at .nc files; default pipelines remain unchanged.

## Training

Run via Makefile:
```bash
make train CONFIG=ml-training/config.yaml DATA_DIR=./data RUNS_DIR=./runs MODEL_VERSION=1.0.0
```

Or directly:
```bash
# Windows (cmd)
set DATA_DIR=./data && set RUNS_DIR=./runs && set MODEL_VERSION=1.0.0 && ^
python ml-training/train_unet.py --config ml-training/config.yaml

# Linux/macOS
DATA_DIR=./data RUNS_DIR=./runs MODEL_VERSION=1.0.0 \
python ml-training/train_unet.py --config ml-training/config.yaml
```

During training:
- TensorBoard logs are saved under `RUNS_DIR/unet_baseline/` (or experiment name)
- Best checkpoint saved based on validation IoU

TensorBoard:
```bash
tensorboard --logdir ./runs
```

## Export and Registry

After training, export artifacts:
```bash
make export CONFIG=ml-training/config.yaml MODEL_VERSION=1.0.0
```

This will:
- Export TensorFlow SavedModel to `ml-training/models/unet/1.0.0/savedmodel/`
- Export ONNX to `ml-training/models/unet/1.0.0/model.onnx`
- Compute sha256 for ONNX and SavedModel tarball and write `sha256.txt`
- Write `metrics.json` with val IoU, Dice, and loss
- Append an entry to [model_registry.json](ml-training/model_registry.json) with:
  ```json
  {
    "model_name": "unet",
    "version": "1.0.0",
    "sha256": "<sha256sum>",
    "uri": "ml-training/models/unet/1.0.0/",
    "created_at": "YYYY-MM-DDThh:mm:ssZ",
    "metrics": {
      "val_iou": ...,
      "val_dice": ...,
      "val_loss": ...
    }
  }
  ```

## Offline Inference

Run inference on a single large raster (GeoTIFF or PNG), producing a GeoJSON of polygons corresponding to predicted boundaries/fields.

Makefile:
```bash
make infer IMAGE=/path/to/image.tif OUT=./out.geojson MODEL=ml-training/models/unet/1.0.0/model.onnx TILE_SIZE=512 OVERLAP=64 THRESHOLD=0.5
```

Direct:
```bash
python ml-training/infer.py \
  --image /path/to/image.tif \
  --out ./out.geojson \
  --tile-size 512 \
  --overlap 64 \
  --threshold 0.5 \
  --model ml-training/models/unet/1.0.0/model.onnx
```

Inference uses ONNXRuntime by default for speed; TensorFlow SavedModel load is also supported as a fallback. Tiling and stitching mirror the training tiler. Polygonization uses simple thresholding and raster→vector conversion with minimal postprocessing.

## Tests and Coverage

Run tests (with coverage target ≥80%):
```bash
make test
# or
pytest -q --cov=ml-training --cov-report=term-missing
```

Tests include:
- Dataset tiling/augmentation shape checks
- 1-epoch smoke training on synthetic mini dataset (CPU-only, ≤2 minutes)
- Export writes SavedModel and ONNX; registry is updated; sha256 present

Synthetic fixtures are generated programmatically at runtime (no binary assets committed).

## Resource Expectations

- CPU-only, batch size defaults are modest for memory safety
- Baseline metrics are expected to be modest on small/synthetic datasets
- For real datasets, adjust hyperparameters and consider more epochs

## Reproducibility

- Fixed seeds in [config.yaml](ml-training/config.yaml)
- Deterministic augmentations where applicable
- Explicit versioned artifacts under `ml-training/models/unet/${MODEL_VERSION}/`

## Makefile Quick Reference

```bash
make install
make train CONFIG=ml-training/config.yaml DATA_DIR=./data RUNS_DIR=./runs MODEL_VERSION=1.0.0
make export CONFIG=ml-training/config.yaml MODEL_VERSION=1.0.0
make infer IMAGE=/path/to/image.tif OUT=out.geojson MODEL=ml-training/models/unet/1.0.0/model.onnx
make test
make lint
make format
make clean
```

## Integration Notes

- This package does not modify the running ML Flask service under `ml-service/`.
- Artifacts and registry entries are designed to be discovered and loaded by the ML service per Sprint 2 integration plan.
- All paths are relative to repository root to ease mounting/copying in CI/CD and Docker contexts.

## Troubleshooting

- TensorFlow CPU wheels can be large; ensure sufficient disk and network resources during install.
- If ONNX export fails due to opset constraints, ensure `tf2onnx` and `onnx` versions match those in [requirements.txt](ml-training/requirements.txt).
- For geospatial inputs (GeoTIFF), ensure `rasterio` can read CRS and transforms; the inference script will attempt to preserve georeferencing when writing GeoJSON.


---

## Yield RF — Random Forest Yield Prediction (Sprint 3)

This module provides a CPU-friendly RandomForestRegressor pipeline for yield prediction with configurable feature engineering, deterministic training, versioned exports (Joblib + ONNX), offline inference, and registry updates.

Key files:
- [features.py](ml-training/yield/features.py:1) — feature engineering and synthetic data assembly
- [model_rf.py](ml-training/yield/model_rf.py:1) — RF constructors, metrics, ONNX helpers
- [train_rf.py](ml-training/yield/train_rf.py:1) — training entrypoint, time-aware split, checkpointing, train_summary.json
- [export_rf.py](ml-training/yield/export_rf.py:1) — artifact export (joblib, onnx), sha256, metrics.json, registry append
- [infer_rf.py](ml-training/yield/infer_rf.py:1) — offline inference CLI (CSV/JSON lines)
- [README.md](ml-training/yield/README.md:1) — module-specific documentation and run instructions

Data layout (minimum):
- Labels CSV: `${DATA_DIR}/yield/raw/train.csv` with columns:
  - field_id, season (YYYY or YYYY-YYYY), date (ISO), yield_kg_per_ha
- Feature CSVs (optional; tests can synthesize):
  - `${DATA_DIR}/yield/features/indices.csv`: field_id, date, ndvi, ndwi, tdvi
  - `${DATA_DIR}/yield/features/weather.csv`: field_id, date, rain_mm, tmin, tmax
  - Optional: `${DATA_DIR}/yield/features/fields.csv`: field_id, area_ha

Feature pipeline (defaults configurable in [config.yaml](ml-training/config.yaml:1) under yield_rf):
- Rolling 7/14/30-day stats (mean/std/min/max) for NDVI/NDWI/TDVI
- Weather aggregates: cumulative rain 7/14/30d; degree-days via tmin/tmax approximation
- Seasonality: month_sin, month_cos; optional low-cardinality season one-hots
- Optional statics: area_ha
- Output: features aligned on (field_id, date), merged to labels on exact date

Configuration snippet:
```yaml
yield_rf:
  version: "1.0.0"
  windows: { w7: 7, w14: 14, w30: 30 }
  rf: { n_estimators: 200, max_depth: 12, min_samples_leaf: 3, random_state: 1337 }
  features:
    ndvi: true
    ndwi: true
    tdvi: true
    rain_cum: true
    degree_days: true
    seasonality: true
    area: false
    base_temp_c: 10.0
  paths:
    labels_csv: ${DATA_DIR:-./data}/yield/raw/train.csv
    indices_csv: ${DATA_DIR:-./data}/yield/features/indices.csv
    weather_csv: ${DATA_DIR:-./data}/yield/features/weather.csv
    fields_csv: ${DATA_DIR:-./data}/yield/features/fields.csv
```

Make targets:
- Train RF:
  - make yield-train CONFIG=ml-training/config.yaml DATA_DIR=./data RUNS_DIR=./runs
- Export RF:
  - make yield-export CONFIG=ml-training/config.yaml MODEL_VERSION=1.0.0
- Infer RF:
  - make yield-infer INPUT=./samples.csv OUT=./preds.json MODEL_VERSION=1.0.0

Artifacts after export:
- Joblib: ml-training/models/yield_rf/1.0.0/model.joblib
- ONNX: ml-training/models/yield_rf/1.0.0/model.onnx
- SHA256: ml-training/models/yield_rf/1.0.0/sha256.txt
- Metrics: ml-training/models/yield_rf/1.0.0/metrics.json
- Registry append: [model_registry.json](ml-training/model_registry.json:1)

Notes:
- CPU-only stack. Dependencies added in [requirements.txt](ml-training/requirements.txt:1) include scikit-learn, joblib, pandas, skl2onnx, onnxruntime.
- tests/ include synthetic fixtures and smoke tests for training, export, registry, and inference.
- Coverage XML generated at ml-training/coverage.xml via the Makefile test target.

## Disaster Analysis — Flood/Drought/Stress (Sprint 3)

This module provides a CPU-only, deterministic change-detection analysis over standardized Sentinel-2 indices (NDVI, NDWI, TDVI). It computes pre/post window statistics around an event date, classifies severity for flood, drought, and vegetation stress, and optionally generates visualization polygons from cleaned masks. Outputs are versioned and registered for later wiring into the ML Flask service per [ml_service_contracts_sprint2.md](Doc/System Design Phase/ml_service_contracts_sprint2.md:1).

Key files:
- [features.py](ml-training/disaster/features.py:1) — time-series windowing (pre/post), deltas, per-field summaries
- [algorithms.py](ml-training/disaster/algorithms.py:1) — flood/drought/stress rules and pixelwise change masks
- [polygonize.py](ml-training/disaster/polygonize.py:1) — mask cleaning (morphology) and polygonization helpers
- [run_analysis.py](ml-training/disaster/run_analysis.py:1) — CLI entrypoint to run per-field analysis and optional GeoJSON export
- [export.py](ml-training/disaster/export.py:1) — package outputs into versioned artifact and update [model_registry.json](ml-training/model_registry.json:1)
- Config block under [config.yaml](ml-training/config.yaml:1) key: disaster

Configuration (defaults):
```yaml
disaster:
  windows: { pre_days: 14, post_days: 7 }
  thresholds:
    FLOOD_NDWI_DELTA_MIN: 0.15
    FLOOD_NDWI_ABS_MIN: 0.1
    DROUGHT_NDWI_DROP_MIN: 0.12
    DROUGHT_NDVI_DROP_MIN: 0.08
    STRESS_TDVI_DELTA_MIN: 0.08
  morphology: { min_area_pixels: 50, open_size: 2, close_size: 2 }
  version: "1.0.0"
```

Inputs:
- indices.csv columns: field_id, date, ndvi, ndwi, tdvi (ISO date)
- Optional cloud masks are ignored by default (tests are fully synthetic)

Algorithms (window means computed by [features.compute_window_stats()](ml-training/disaster/features.py:64)):
- Flood signal: (NDWI_post - NDWI_pre) > FLOOD_NDWI_DELTA_MIN and NDWI_post > FLOOD_NDWI_ABS_MIN
  - Severity: high if delta > 0.25 or NDVI_drop > 0.2; medium if [0.15,0.25); low if [0.10,0.15) and NDWI_post > 0.08
- Drought signal: NDWI_drop > DROUGHT_NDWI_DROP_MIN and NDVI_drop > DROUGHT_NDVI_DROP_MIN (severity scales with both)
- Vegetation stress signal: TDVI_delta > STRESS_TDVI_DELTA_MIN and NDVI_drop > 0.05 (high if TDVI_delta > 0.15 or NDVI_drop > 0.15)

CLI usage ([run_analysis.py](ml-training/disaster/run_analysis.py:1)):
```bash
# Flood analysis with polygons
python ml-training/disaster/run_analysis.py \
  --indices ./path/to/indices.csv \
  --event-date 2024-06-15 \
  --event flood \
  --out-dir ./out \
  --config ml-training/config.yaml \
  --write-geojson

# Drought analysis (no polygons)
python ml-training/disaster/run_analysis.py \
  --indices ./path/to/indices.csv \
  --event-date 2024-06-15 \
  --event drought \
  --out-dir ./out \
  --config ml-training/config.yaml

# Auto-pick best event by score
python ml-training/disaster/run_analysis.py \
  --indices ./path/to/indices.csv \
  --event-date 2024-06-15 \
  --event auto \
  --out-dir ./out
```

Outputs (from [run_analysis.py](ml-training/disaster/run_analysis.py:155)):
- summaries.json — list of per-field records with event, detected, severity, score, metrics, window_stats
- summaries.csv — flat summary table (optional)
- masks/geojson/{field_id}_{event}_{date}.geojson — polygons (if --write-geojson)

Export (from [export.py](ml-training/disaster/export.py:1)):
- Packages to [ml-training/models/disaster_analysis/1.0.0/](ml-training/models/disaster_analysis/1.0.0/:1):
  - manifest.json — thresholds, windows, morphology, counts, majority event
  - summaries.json (copy), summaries.csv (if present)
- Appends/updates [model_registry.json](ml-training/model_registry.json:1) with record:
  {"model_name":"disaster_analysis","version":"1.0.0","sha256":"...","uri":"ml-training/models/disaster_analysis/1.0.0","created_at":"...","metrics":{"fields_analyzed":N,"event":"..."}} 

Makefile:
- Run analysis: [disaster-run](ml-training/Makefile:136)
- Export artifacts: [disaster-export](ml-training/Makefile:145)

Notes and constraints:
- CPU-only, deterministic; synthetic tests avoid external calls
- Pixel areas are in pixel units (no CRS transform); cloud handling minimal
- Designed to be wired to backend endpoints in a later sprint without changes here

## Optimizer and Loss Options (new)

This training stack now supports configurable optimizers (including decoupled weight decay) and additional loss functions while preserving backward-compatible defaults.

- Optimizers:
  - adam, sgd (always available)
  - adamw, sgdw (require tensorflow-addons for native decoupled weight decay; otherwise a minimal L2 fallback is used)
- Losses:
  - bce, dice, bce_dice (default if not specified)
  - focal (binary), tversky (binary)

Notes on weight decay and exclusions:
- When tensorflow-addons is available, AdamW/SGDW perform true decoupled weight decay.
- When addons are not available and weight_decay > 0, the code applies an L2 kernel_regularizer to Conv2D kernels only (biases and BatchNorm are not regularized), approximating a subset of exclude_from_weight_decay behavior.
- Exclude patterns are advisory in TFA mode (native filters are not provided by default); in fallback L2, biases/BN are excluded by construction.

Backwards compatibility (default behavior):
- If you omit new keys, training behaves exactly as before: optimizer=adam, loss=bce_dice with train.bce_weight/train.dice_weight/train.loss_smooth.

Example configuration snippets

1) Legacy (unchanged)
```yaml
train:
  learning_rate: 0.001
  optimizer: adam     # or sgd
  weight_decay: 0.0
  bce_weight: 0.5
  dice_weight: 0.5
  loss_smooth: 1.0
```

2) New optimizer schema and advanced losses
```yaml
train:
  # New optimizer block (optional)
  optimizer:
    name: adamw            # one of: [adam, sgd, adamw, sgdw]
    lr: 0.0005
    weight_decay: 0.0001
    decoupled_wd: true     # defaults true for adamw/sgdw
    exclude_from_weight_decay: ["bias", "bn", "batchnorm"]
    betas: [0.9, 0.999]    # adam/adamw
    eps: 1e-8              # adam/adamw
    momentum: 0.9          # sgd/sgdw
    nesterov: true         # sgd/sgdw

  # New loss block (optional)
  loss:
    name: focal            # one of: [bce, dice, bce_dice, focal, tversky]
    params:
      alpha: 0.25
      gamma: 2.0
      logits: false
```

Alternative loss examples:
```yaml
train:
  loss:
    name: bce_dice
    params: { bce_weight: 0.5, dice_weight: 0.5, smooth: 1.0 }
```
```yaml
train:
  loss:
    name: dice
    params: { smooth: 1.0 }
```
```yaml
train:
  loss:
    name: tversky
    params: { alpha: 0.5, beta: 0.5, smooth: 1.0 }
```

Optional dependency

- To enable native decoupled weight decay for AdamW/SGDW install tensorflow-addons
  - See [requirements.txt](ml-training/requirements.txt) for an optional commented entry.
  - If not installed, the training automatically falls back to L2 kernel regularization without breaking flows.

Running tests

```bash
pytest -q ml-training/tests/test_losses.py
pytest -q ml-training/tests/test_optimizers.py
# or run all training tests
pytest -q ml-training/tests
```

## Postprocessing options

Training-side polygonization now supports optional, configurable postprocessing that mirrors the ML-Service behavior while remaining fully backward compatible (all options default to disabled/no-op).

Relevant code:
- [utils_geo.py](ml-training/utils_geo.py) — implements mask-to-polygons with optional morphology, simplification, hole filtering, and topology cleaning
- [infer.py](ml-training/infer.py) — threads postprocess options to [utils_geo.mask_to_geojson()](ml-training/utils_geo.py)
- [config.yaml](ml-training/config.yaml) — configuration keys under `inference.postprocess`
- Tests: [tests/test_utils_geo_postprocess.py](ml-training/tests/test_utils_geo_postprocess.py)

YAML configuration (defaults are no-op to preserve previous behavior):
```yaml
inference:
  postprocess:
    # Legacy (kept): still applied unless overridden by new keys
    min_area_pixels: 64
    buffer_pixels: 0

    # New (optional)
    min_area: 0                  # pixels or CRS units; 0 = disabled
    simplify_tolerance: 0.0      # Douglas-Peucker tolerance; 0 = disabled
    remove_holes: false          # true to drop interior rings; below min_area threshold if min_area&gt;0
    topology: preserve           # preserve|clean|none
    morphology:
      smooth: none               # none|open|close
      kernel_size: 3             # odd int
      iterations: 1
```

Guidance:
- simplify_tolerance vs min_area:
  - Use `min_area` to remove tiny slivers or small components without shifting boundaries.
  - Use `simplify_tolerance` to reduce vertex count and smooth jagged edges. This may slightly shift boundaries; prefer small values and `topology: preserve` to maintain validity.
- Hole removal:
  - `remove_holes: true` with `min_area: 0` drops all holes.
  - With `min_area &gt; 0`, interior rings below that area are dropped; larger holes are kept.
- Topology:
  - `preserve` (default): rely on valid geometries; simplification uses `preserve_topology=True`.
  - `clean`: apply a unary-union merge then `buffer(0)` to fix minor self-intersections. This is robust but a bit more CPU-expensive; may dissolve very thin connections.
  - `none`: skip topology correction beyond the merge; fastest but can retain minor defects in edge cases.
- Morphology (applied pre-polygonization to the binary mask with nearest-neighbor semantics):
  - `open`: removes small speckles and isolated noise.
  - `close`: fills small gaps and bridges tiny holes.
  - Mask remains strictly binary `{0,1}`.

Programmatic use:
- The function [utils_geo.mask_to_geojson()](ml-training/utils_geo.py) accepts the new keyword arguments:
  - `min_area`, `simplify_tolerance`, `remove_holes`, `topology`, and `morphology={smooth,kernel_size,iterations}`
  - Legacy `min_area_pixels`, `buffer_pixels` are still supported and remain the defaults when new keys are omitted.
- The offline inference entrypoint [infer.run_inference()](ml-training/infer.py) now accepts an optional `postprocess` dict and forwards it to `mask_to_geojson`.

Example profile (typical smoothing and cleaning):
```yaml
inference:
  postprocess:
    min_area_pixels: 64
    buffer_pixels: 0
    min_area: 100
    simplify_tolerance: 1.5
    remove_holes: true
    topology: clean
    morphology:
      smooth: open
      kernel_size: 3
      iterations: 1
```

Backward compatibility:
- If you omit all new keys, behavior is unchanged compared to previous releases (no extra morphology, simplification, hole removal, or topology cleaning).
