# Yield RF — Random Forest Yield Prediction (Sprint 3)

This module implements a CPU-friendly Random Forest (RF) pipeline for agricultural yield prediction with configurable feature engineering, deterministic training, artifact export (Joblib + ONNX), offline inference, and tests. It integrates with the existing ml-training artifacts/registry introduced in Sprint 2.

Key deliverables:
- Feature engineering with rolling windows for vegetation indices and weather
- RandomForestRegressor training with time-aware validation
- Export to versioned artifacts (Joblib and ONNX) + registry update
- Offline inference CLI for CSV/JSON inputs
- Synthetic data generators in-code to keep CI fast and self-contained

## Data layout and minimal columns

The pipeline expects (documented and enforced in code):

- Labels CSV (per-sample target) at:
  - `${DATA_DIR}/yield/raw/train.csv` with columns:
    - `field_id` (string)
    - `season` (YYYY or YYYY-YYYY)
    - `date` (ISO date)
    - `yield_kg_per_ha` (float target)
- Derived/feature CSVs (optionally provided; otherwise synthesized in tests):
  - `${DATA_DIR}/yield/features/indices.csv` with columns:
    - `field_id`, `date`, `ndvi`, `ndwi`, `tdvi`
  - `${DATA_DIR}/yield/features/weather.csv` with columns:
    - `field_id`, `date`, `rain_mm`, `tmin`, `tmax`
  - Optional field statics:
    - `${DATA_DIR}/yield/features/fields.csv` with columns:
      - `field_id`, `area_ha`

If any of these are missing and `allow_synthetic=True` (the default in training for tests), synthetic sources are generated to support smoke tests.

## Feature pipeline

Implemented in [features.py](ml-training/yield/features.py):

- Rolling statistics (window sizes configurable via config):
  - For NDVI/NDWI/TDVI: mean, std, min, max over 7/14/30 days
  - For weather:
    - Cumulative rain over 7/14/30 days
    - Degree days (GDD) over 7/14/30 days using `tmean = (tmin + tmax)/2`, `gdd = max(0, tmean - base_temp_c)`
- Seasonality:
  - `month_sin`, `month_cos`
  - Optional season one-hots (only for low cardinality to avoid explosion)
- Optional field-level statics: `area_ha` if provided
- Output:
  - Features DataFrame aligned on `(field_id, date)` and merged with labels on exact date
  - Returns `(X, y, feature_names, merged_df)`; missing values after rolling are ffilled/bfilled then 0.0

## Configuration

Add the `yield_rf` block to [config.yaml](ml-training/config.yaml). A default snippet has already been added:

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
    fields_csv: ${DATA_DIR:-./data}/yield/features/fields.csv  # optional
```

Environment overrides:
- `DATA_DIR` — base data directory
- `RUNS_DIR` — path for runs/checkpoints
- `MODEL_VERSION` — version tag used for artifacts/registry

## Training

Makefile target:

```bash
make yield-train CONFIG=ml-training/config.yaml DATA_DIR=./data RUNS_DIR=./runs
```

Direct:

```bash
# Windows (cmd)
set DATA_DIR=./data && set RUNS_DIR=./runs && ^
python ml-training/yield/train_rf.py --config ml-training/config.yaml

# Linux/macOS
DATA_DIR=./data RUNS_DIR=./runs \
python ml-training/yield/train_rf.py --config ml-training/config.yaml
```

Outputs:
- Best checkpoint (Joblib): `RUNS_DIR/yield_rf/checkpoints/best.joblib`
- Train summary (JSON): `RUNS_DIR/yield_rf/train_summary.json` including metrics, params, feature names/importances

Validation split:
- Time-aware where possible: train on seasons strictly less than the last season; validate on last season
- Fallback: random 80/20 split (seeded)

Metrics:
- RMSE, MAE, R^2

## Export and registry

Makefile target:

```bash
make yield-export CONFIG=ml-training/config.yaml MODEL_VERSION=1.0.0
```

Direct:

```bash
python ml-training/yield/export_rf.py --config ml-training/config.yaml --version 1.0.0
```

Exports:
- Joblib: `ml-training/models/yield_rf/1.0.0/model.joblib`
- ONNX: `ml-training/models/yield_rf/1.0.0/model.onnx`
- SHA256s: `ml-training/models/yield_rf/1.0.0/sha256.txt`
- Metrics: `ml-training/models/yield_rf/1.0.0/metrics.json` (RMSE, MAE, R^2, n_features, feature_names)
- Registry append in [model_registry.json](ml-training/model_registry.json) with:
  ```json
  {
    "model_name": "yield_rf",
    "version": "1.0.0",
    "sha256": "<onnx_sha256>",
    "uri": "ml-training/models/yield_rf/1.0.0",
    "created_at": "YYYY-MM-DDThh:mm:ssZ",
    "metrics": { "rmse": ..., "mae": ..., "r2": ..., "n_features": ..., "feature_names": [...] }
  }
  ```

## Offline inference

Makefile target (uses exported ONNX):

```bash
make yield-infer INPUT=./samples.csv OUT=./preds.json MODEL_VERSION=1.0.0
```

Direct:

```bash
python ml-training/yield/infer_rf.py \
  --model ml-training/models/yield_rf/1.0.0/model.onnx \
  --input ./samples.csv \
  --out ./preds.json
```

Notes:
- Input can be CSV (header=feature columns) or JSON-lines objects
- If `metrics.json` is collocated, feature_names order will be applied automatically
- Output contains a list of predictions with optional echo of identifiers (`field_id`, `season`, `date`) if present

## Dependencies (CPU-only)

Added to [requirements.txt](ml-training/requirements.txt):
- `scikit-learn`, `joblib`, `pandas`, `skl2onnx`, `onnxruntime`

Install:

```bash
python -m pip install -U pip
python -m pip install -r ml-training/requirements.txt
```

## Assumptions and limitations

- Degree-days use a simple `tmean - base_temp_c` approximation
- Seasonality features are minimal (sin/cos + low-cardinality one-hots)
- Feature CSVs are expected to be pre-aggregated per `field_id` and daily dates; missing inputs are handled via synthetic generators in tests
- This module does not modify the ML Flask service (integration handled by a separate task)

## Make targets

- `yield-train`: train RF with features from config
- `yield-export`: export Joblib + ONNX and update registry
- `yield-infer`: run offline predictions on provided features

For a quick end-to-end smoke:
```bash
make yield-train CONFIG=ml-training/config.yaml DATA_DIR=./data RUNS_DIR=./runs
make yield-export CONFIG=ml-training/config.yaml MODEL_VERSION=1.0.0
make yield-infer INPUT=./your_features.csv OUT=./preds.json MODEL_VERSION=1.0.0