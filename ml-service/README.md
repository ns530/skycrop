# SkyCrop ML Service (Sprint 3)

Internal Flask-based ML microservice exposing health and segmentation prediction endpoints per the Sprint 2 contracts. This service is for internal use only and authenticated via `X-Internal-Token`.

Key references
- Contracts: Doc/System Design Phase/ml_service_contracts_sprint2.md
- Integration plan: Doc/System Design Phase/sprint2_integration_plan.md
- Backend API contracts: Doc/System Design Phase/api_contracts_sprint2.md
- Acceptance criteria: Doc/System Design Phase/acceptance_criteria_sprint2.md

## Endpoints (Sprint 2)

- GET /health
  - No auth required
  - Returns: { status: "ok", version, uptime_s }
  - Echoes X-Request-Id header if present

- POST /v1/segmentation/predict
  - Auth: X-Internal-Token required
  - Headers:
    - X-Internal-Token: shared secret
    - X-Request-Id: optional correlation id (echoed)
    - X-Model-Version: optional version override (header takes precedence over body)
  - Body (either bbox or field_id required):
    {
      "bbox": [minLon, minLat, maxLon, maxLat] | null,
      "field_id": "uuid" | null,
      "date": "YYYY-MM-DD",
      "model_version": "unet-1.0.0",           // optional (if header absent)
      "tiling": { "size": 512, "overlap": 64 }, // optional (defaults shown)
      "return": "mask_url" | "inline"           // default "mask_url"
    }
  - Behavior (Sprint 2 scaffold):
    - bbox path: generates deterministic GeoJSON polygon mask (ring derived from bbox)
    - field_id path:
      - If FIELD_RESOLVER_URL not set → 501 NOT_IMPLEMENTED
      - If set (future) → resolve then do bbox flow
    - return = "mask_url":
      - Persist under static/masks/{request_id}.geojson
      - Return mask_url served by Flask static
    - return = "inline":
      - Return mask_base64 (base64-encoded GeoJSON), mask_format = "geojson"
  - Response includes:
    - request_id (uuid4)
    - model: { name, version }
    - metrics: { latency_ms, tile_count: 1, cloud_coverage: 0 }
    - warnings: []
    - Headers echo: X-Request-Id, X-Model-Version (effective, e.g., "unet-1.0.0")

Error schema (canonical)
{
  "error": { "code": "INVALID_INPUT | MODEL_NOT_FOUND | TIMEOUT | UPSTREAM_ERROR | AUTH_REQUIRED | UNAUTHORIZED_INTERNAL | NOT_IMPLEMENTED | NOT_FOUND", "message": "...", "details": { ... } },
  "meta": { "correlation_id": "uuid", "timestamp": "..." }
}

## Quickstart (Local, without Docker)

Prereqs: Python 3.11, venv

1) Create venv and install deps
- make install

2) Configure env (optional)
- cp .env.example .env
- adjust ML_INTERNAL_TOKEN, MODEL_VERSION, etc.

3) Run dev server
- make run
- Service on http://localhost:80

4) Run tests
- make test
- Coverage threshold enforced via pytest.ini/pyproject (≥85% for app/)

Lint/format
- make lint
- make format

## Docker

Build image
- docker build -t skycrop-ml:local ./ml-service

Run
- docker run --rm -p 80:80 -e ML_INTERNAL_TOKEN=change-me skycrop-ml:local

Compose (root docker-compose.yml)
- docker compose up --build ml-service

Healthcheck uses GET /health.

## Example requests

Health
- curl -s http://localhost:80/health | jq

Predict (bbox → mask_url)
- curl -s -X POST http://localhost:80/v1/segmentation/predict \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: change-me" \
  -H "X-Request-Id: 58bb0a2f-3f46-4d7d-a8c6-0b7f34dc4df1" \
  -H "X-Model-Version: unet-1.0.0" \
  -d '{ "bbox":[80.10,7.20,80.12,7.22], "date":"2025-10-15", "return":"mask_url" }'

Predict (bbox → inline base64)
- curl -s -X POST http://localhost:80/v1/segmentation/predict \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: change-me" \
  -d '{ "bbox":[80.11,7.21,80.12,7.22], "date":"2025-10-10", "return":"inline" }'

Auth failure (401)
- curl -s -X POST http://localhost:80/v1/segmentation/predict -d '{}'

## Configuration

Key env vars
- ML_PORT: default 80
- ML_INTERNAL_TOKEN: required for internal auth
- MODEL_NAME: "unet"
- UNET_DEFAULT_VERSION / MODEL_VERSION: default version ("1.0.0")
- REQUEST_TIMEOUT_S: request timeout budget (used for simulated timeout path)
- MAX_PAYLOAD_MB: Flask MAX_CONTENT_LENGTH cap (default 10)
- FIELD_RESOLVER_URL: optional backend resolver for field_id (not implemented in Sprint 2)
- LOG_LEVEL: INFO/DEBUG/WARN/ERROR
- LOG_JSON: 1 to enable json logs (default)

## Implementation notes

- App factory: app/__init__.py
- Routes and handlers: app/api.py
- Auth decorator: app/auth.py
- Pydantic schemas: app/schemas.py
- Stub inference: app/inference.py
- Config: app/config.py
- Logging: app/logging.py
- WSGI entrypoint (gunicorn): wsgi.py
- Dev entrypoint: main.py
- Static masks directory is auto-created at startup under static/masks/
- Sample mask fixture: data/sample_mask.geojson

## Testing

What tests cover
- Health happy path
- bbox predict → mask_url file persisted and served
- bbox predict → inline base64 variant
- Auth failures: missing/invalid token
- Validation failures: bbox ranges, both/none bbox/field_id
- field_id without resolver: 501 NOT_IMPLEMENTED
- Timeout path: 504/408 based on simulated sleep_ms > REQUEST_TIMEOUT_S

Run
- make test

Coverage
- Enforced ≥85% for app/ (pytest.ini / pyproject.toml)

## Notes and assumptions

- Deterministic stub polygon is CPU-only (Shapely) and based on bbox hash; no ML frameworks included.
- mask_url serves from the Flask static folder for Sprint 2; future work will move to object storage.
- field_id resolution is explicitly not implemented in this sprint (501 unless FIELD_RESOLVER_URL path is wired later).

## Sprint 3 Additions

Two new internal endpoints were added to wrap ML Research Sprint 3 artifacts. These are authenticated via X-Internal-Token and return canonical error schemas identical to Sprint 2.

### POST /v1/yield/predict

- Headers:
  - X-Internal-Token: required
  - X-Request-Id: optional (echoed)
  - X-Model-Version: optional; accepts "yield_rf-1.0.0" or "1.0.0" (header takes precedence)
- Request body (one of):
  - Form A (object rows):
    {
      "features": [
        { "field_id": "f1", "season": "2024", "f1": 1.0, "f2": 0.5 },
        { "field_id": "f2", "season": "2024", "f1": 3.0, "f2": 2.5 }
      ],
      "model_version": "1.0.0"
    }
  - Form B (matrix rows + names):
    {
      "rows": [[1.0,0.5],[3.0,2.5]],
      "feature_names": ["f1","f2"],
      "model_version": "1.0.0"
    }
- Response 200:
  {
    "request_id": "uuid",
    "model": { "name": "yield_rf", "version": "1.0.0" },
    "predictions": [
      { "field_id": "f1", "yield_kg_per_ha": 3456.7 },
      { "field_id": "f2", "yield_kg_per_ha": 5123.4 }
    ],
    "metrics": { "latency_ms": 12 },
    "warnings": []
  }
- Errors: INVALID_INPUT 400, MODEL_NOT_FOUND 404, TIMEOUT 504, UPSTREAM_ERROR 502

Notes:
- Model resolution uses env ML_YIELD_MODEL_PATH (default ml-training/models/yield_rf/1.0.0/model.onnx).
- ONNX is preferred; when onnxruntime is missing or .onnx not found, service falls back to a sibling .joblib path.
- Tests mock onnxruntime.InferenceSession and verify joblib fallback.

### POST /v1/disaster/analyze

- Headers:
  - X-Internal-Token: required
  - X-Request-Id: optional (echoed)
  - X-Model-Version: optional; accepts "disaster_analysis-1.0.0" or "1.0.0"
- Request body (implemented form for Sprint 3):
  {
    "indices": [
      { "field_id": "A", "date": "2025-01-10", "ndvi": 0.62, "ndwi": 0.03, "tdvi": 0.47 },
      { "field_id": "A", "date": "2025-01-16", "ndvi": 0.51, "ndwi": 0.28, "tdvi": 0.54 }
    ],
    "event": "flood|drought|stress|auto",
    "event_date": "YYYY-MM-DD",
    "pre_days": 14,
    "post_days": 7,
    "return": "summary|geojson|both"
  }
- Response 200 (summary):
  {
    "request_id": "uuid",
    "analysis": [
      {
        "field_id": "A",
        "event": "flood",
        "severity": "medium",
        "metrics": { "ndvi_drop": 0.21, "ndwi_drop": 0.18, "tdvi_delta": 0.09 },
        "windows": { "pre_days": 14, "post_days": 7 }
      }
    ],
    "model": { "name": "disaster_analysis", "version": "1.0.0" },
    "metrics": { "latency_ms": 10 }
  }
- Response 200 (geojson|both):
  - Adds "mask_geojson": { "type": "FeatureCollection", "features": [... polygons per field ...] }
- Errors: INVALID_INPUT 400, MODEL_NOT_FOUND 404, TIMEOUT 504, UPSTREAM_ERROR 502

Notes:
- Analysis computes pre/post window means and event-specific deltas with thresholds derived from env DISASTER_THRESHOLDS_JSON (defaults match training).
- For simplicity in this sprint, polygons are deterministic synthetic squares per-field to keep tests deterministic.

### Error schema (canonical)
{
  "error": { "code": "...", "message": "...", "details": { ... } },
  "meta": { "correlation_id": "uuid", "timestamp": "..." }
}

## Configuration (Sprint 3 additions)

- ML_YIELD_MODEL_PATH: path to yield RF ONNX; falls back to sibling .joblib when .onnx/ORT unavailable
  - default: ml-training/models/yield_rf/1.0.0/model.onnx
- DISASTER_PRE_DAYS: default pre window days (int, default 14)
- DISASTER_POST_DAYS: default post window days (int, default 7)
- DISASTER_THRESHOLDS_JSON: JSON object with thresholds (defaults):
  {
    "FLOOD_NDWI_DELTA_MIN": 0.15,
    "FLOOD_NDWI_ABS_MIN": 0.1,
    "DROUGHT_NDWI_DROP_MIN": 0.12,
    "DROUGHT_NDVI_DROP_MIN": 0.08,
    "STRESS_TDVI_DELTA_MIN": 0.08
  }

See existing envs for auth, limits, logging in .env.example.

## Logging

Structured JSON logging includes route, method, status, latency_ms, correlation_id, model_version. New endpoints also inject record_count and event (for disaster) via internal extras.

## Run tests

- make test
- Coverage gate: ≥85% for app/ (pytest.ini and pyproject.toml)

## Docker

- CPU baseline:
  - docker build -t skycrop-ml:local ./ml-service
- Optional GPU scaffold:
  - ARG ENABLE_GPU=true is available as a build-time toggle; switching to an NVIDIA CUDA base and onnxruntime-gpu is deferred (see comments in Dockerfile).
- Run:
  - docker run --rm -p 80:80 -e ML_INTERNAL_TOKEN=change-me skycrop-ml:local

## Example cURL

Yield Predict (features)
- curl -s -X POST http://localhost:80/v1/yield/predict \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: change-me" \
  -H "X-Model-Version: yield_rf-1.0.0" \
  -d '{ "features":[{"field_id":"f1","f1":1,"f2":2}], "model_version":"1.0.0" }'

Disaster Analyze (both)
- curl -s -X POST http://localhost:80/v1/disaster/analyze \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: change-me" \
  -H "X-Model-Version: disaster_analysis-1.0.0" \
  -d '{ "indices":[{"field_id":"A","date":"2025-01-10","ndvi":0.6,"ndwi":0.05,"tdvi":0.05},{"field_id":"A","date":"2025-01-16","ndvi":0.4,"ndwi":0.3,"tdvi":0.06}], "event":"auto","event_date":"2025-01-15","pre_days":14,"post_days":7,"return":"both" }'

## Notes

- Backend Node.js is unchanged in this sprint. A follow-up task will proxy these new endpoints through the existing ML Gateway.
- Models can be mounted under the repo path indicated by ML_YIELD_MODEL_PATH for local testing.