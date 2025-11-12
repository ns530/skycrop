# Disaster Damage Analysis (Sprint 3)

CPU-friendly, deterministic event analysis for flood (water excess), drought (water deficit), and vegetation stress between pre/post time windows using standardized Sentinel-2 indices (NDVI, NDWI, TDVI). Produces per-field summaries and optional GeoJSON polygons of damaged areas. Ships with a versioned export and registry update for future wiring into the ML Flask service.

Key modules:
- [features.py](ml-training/disaster/features.py:1) — time-series windowing, deltas, summaries
- [algorithms.py](ml-training/disaster/algorithms.py:1) — flood/drought/stress detection and severity + change mask builder
- [polygonize.py](ml-training/disaster/polygonize.py:1) — mask cleaning and polygonization helpers
- [run_analysis.py](ml-training/disaster/run_analysis.py:1) — CLI entrypoint (compute summaries, optional GeoJSON)
- [export.py](ml-training/disaster/export.py:1) — package outputs and write registry metadata
- Config block: [config.yaml](ml-training/config.yaml:1) under key `disaster`

## Inputs

indices.csv (CSV):
- Columns: field_id, date, ndvi, ndwi, tdvi
- Example (dates in ISO):
  ```
  field_id,date,ndvi,ndwi,tdvi
  F1,2024-06-10,0.60,0.05,0.05
  F1,2024-06-16,0.50,0.25,0.20
  ...
  ```

Optional: a cloud mask source can be integrated later; current module assumes minimal cloud handling and tests are fully synthetic.

## Configuration

Disaster configuration is defined in [config.yaml](ml-training/config.yaml:1):

```yaml
disaster:
  windows:
    pre_days: 14
    post_days: 7
  thresholds:
    FLOOD_NDWI_DELTA_MIN: 0.15
    FLOOD_NDWI_ABS_MIN: 0.1
    DROUGHT_NDWI_DROP_MIN: 0.12
    DROUGHT_NDVI_DROP_MIN: 0.08
    STRESS_TDVI_DELTA_MIN: 0.08
  morphology:
    min_area_pixels: 50
    open_size: 2
    close_size: 2
  version: "1.0.0"
```

Windows:
- Pre window: [event_date - pre_days, event_date) — event day excluded
- Post window: (event_date, event_date + post_days] — event day excluded

## Algorithms

Let means over windows be computed from [features.compute_window_stats()](ml-training/disaster/features.py:64):
- ndvi_drop = NDVI_pre_mean - NDVI_post_mean
- ndwi_delta = NDWI_post_mean - NDWI_pre_mean
- ndwi_drop = NDWI_pre_mean - NDWI_post_mean
- tdvi_delta = TDVI_post_mean - TDVI_pre_mean

Flood detection ([algorithms.classify_flood()](ml-training/disaster/algorithms.py:25)):
- Signal: ndwi_delta > FLOOD_NDWI_DELTA_MIN AND NDWI_post_mean > FLOOD_NDWI_ABS_MIN
- Severity:
  - high if ndwi_delta > 0.25 OR ndvi_drop > 0.2
  - medium if 0.15 ≤ ndwi_delta < 0.25
  - low if 0.10 ≤ ndwi_delta < 0.15 AND NDWI_post_mean > 0.08

Drought detection ([algorithms.classify_drought()](ml-training/disaster/algorithms.py:62)):
- Signal: ndwi_drop > DROUGHT_NDWI_DROP_MIN AND ndvi_drop > DROUGHT_NDVI_DROP_MIN
- Severity: scales by ndwi_drop and ndvi_drop (bands: low/medium/high)

Vegetation stress ([algorithms.classify_stress()](ml-training/disaster/algorithms.py:95)):
- Signal: tdvi_delta > STRESS_TDVI_DELTA_MIN AND ndvi_drop > 0.05
- Severity: high if tdvi_delta > 0.15 OR ndvi_drop > 0.15; else medium/low

Pixelwise change mask ([algorithms.build_change_mask()](ml-training/disaster/algorithms.py:142)):
- Build change raster via per-pixel pre/post means
- Apply thresholds per event; optional cloud masking
- Morphological open/close and small-area removal (configurable)

## CLI

Entrypoint: [run_analysis.py](ml-training/disaster/run_analysis.py:1)

Arguments:
- --indices PATH: indices.csv path
- --event-date YYYY-MM-DD
- --event flood|drought|stress|auto
- --out-dir PATH
- --config PATH to YAML (defaults to ml-training/config.yaml)
- --field-id optional single field
- --pre-days, --post-days overrides
- --write-geojson to produce per-field polygons

Examples:
```bash
# Flood
python ml-training/disaster/run_analysis.py \
  --indices ./examples/indices.csv \
  --event-date 2024-06-15 \
  --event flood \
  --out-dir ./out \
  --config ml-training/config.yaml \
  --write-geojson

# Drought
python ml-training/disaster/run_analysis.py \
  --indices ./examples/indices.csv \
  --event-date 2024-06-15 \
  --event drought \
  --out-dir ./out \
  --config ml-training/config.yaml

# Vegetation stress
python ml-training/disaster/run_analysis.py \
  --indices ./examples/indices.csv \
  --event-date 2024-06-15 \
  --event stress \
  --out-dir ./out
```

Makefile shortcuts:
- [Makefile target: disaster-run](ml-training/Makefile:136)
- [Makefile target: disaster-export](ml-training/Makefile:145)

## Outputs

From [run_analysis.py](ml-training/disaster/run_analysis.py:155):
- summaries.json — list of per-field records:
  - field_id, event, event_date, detected, severity, score
  - window { pre_days, post_days }
  - metrics: event-specific deltas
  - window_stats: ndvi/ndwi/tdvi pre/post means and deltas
- summaries.csv — convenience flat table (optional)
- masks/geojson/{field_id}_{event}_{date}.geojson — cleaned polygons per field if --write-geojson

From [export.py](ml-training/disaster/export.py:1):
- Versioned artifacts under ml-training/models/disaster_analysis/1.0.0/:
  - summaries.json (copied)
  - summaries.csv (if present)
  - manifest.json — windows, thresholds, morphology, counts, majority event
- Registry update to [model_registry.json](ml-training/model_registry.json:1)

## Tests

Unit tests:
- [test_disaster_algorithms.py](ml-training/tests/test_disaster_algorithms.py:1) — windowing/deltas, flood/drought/stress decisions
- [test_disaster_polygonize.py](ml-training/tests/test_disaster_polygonize.py:1) — mask cleaning and polygonization sanity
- [test_disaster_cli_and_export.py](ml-training/tests/test_disaster_cli_and_export.py:1) — end-to-end run + registry update

Run: `make test` (targets ≥80% coverage for the disaster module; CPU-only, under ~2 minutes).

## Dependencies

Already present in [requirements.txt](ml-training/requirements.txt:1):
- numpy, pandas, shapely, scikit-image, rasterio (optional), pytest, pytest-cov

## Limitations

- Pixel areas in GeoJSON are approximate (in pixel units, no CRS).
- Cloud handling minimal; production masks should be supplied to improve quality.
- Sensitivity depends on sampling cadence; sparser time series reduce reliability.