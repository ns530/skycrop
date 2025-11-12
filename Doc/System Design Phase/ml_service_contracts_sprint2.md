# SkyCrop — Sprint 2 ML Service API Contracts (Flask)

Owner: Architecture  
Scope: Authoritative internal API contracts for the Python ML service to be implemented in Sprint 2. Consumed exclusively by Backend (Node). Not exposed publicly.  
References:
- Backend OpenAPI baseline: [`backend/src/api/openapi.yaml`](backend/src/api/openapi.yaml)
- Backend ML Gateway contract: [`Doc/System Design Phase/api_contracts_sprint2.md`](Doc/System Design Phase/api_contracts_sprint2.md)
- Integration plan: [`Doc/System Design Phase/sprint2_integration_plan.md`](Doc/System Design Phase/sprint2_integration_plan.md)
- Env template (additions proposed): [`backend/.env.example`](backend/.env.example)

Conventions:
- Base URL (Docker): http://ml:8000
- Base URL (Local dev): http://localhost:8000
- Authentication: X-Internal-Token header with shared secret configured in env (ML_INTERNAL_TOKEN)
- Content-Type: application/json; charset=utf-8
- All coordinates in SRID 4326 (lon, lat)
- Request size cap: 10 MB (reject with 413 if exceeded)
- Timeout budget: 60s p95 per request (see timeouts section)

## 1) Authentication and Headers

- Required header: `X-Internal-Token: <shared-secret>`
  - 401 if missing; 403 if invalid.
- Optional correlation: `X-Request-Id: <uuid>` — echoed back in responses.
- Optional model override: `X-Model-Version: unet-1.0.0` — used if body model_version is absent.

Example headers:
```
X-Internal-Token: ${ML_INTERNAL_TOKEN}
X-Request-Id: d1c6f3b3-1c3e-4c2e-8dbf-39e22f2f1f5e
X-Model-Version: unet-1.0.0
Content-Type: application/json
```

## 2) Endpoints

### 2.1 GET /health

Purpose: Liveness/readiness probe and basic telemetry.

Response 200:
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_s": 12345.6
}

Headers echoed:
- X-Request-Id (if provided)

Errors:
- 500 on internal failure.

### 2.2 POST /v1/segmentation/predict

Purpose: Generate segmentation mask for a given bbox or stored field boundary (field_id resolved by Backend; ML accepts bbox only for Sprint 2). Backward-compatible path allows ML to accept a bbox always; Backend is responsible for resolving field_id to bbox.

Request body (one of):
{
  "bbox": [minLon, minLat, maxLon, maxLat],
  "date": "YYYY-MM-DD",
  "model_version": "unet-1.0.0",
  "tiling": { "size": 512, "overlap": 64 },
  "return": "mask_url" | "inline"
}

Validation:
- bbox: required; array length=4; -180 ≤ lon ≤ 180; -90 ≤ lat ≤ 90; min < max
- date: required; format YYYY-MM-DD
- model_version: optional; if absent, service resolves default per Model Versioning (§4)
- tiling: optional; defaults size=512, overlap=64
- return: defaults to "mask_url"; "inline" allowed if payload ≤ 2 MB

Response 200 (mask_url):
{
  "request_id": "uuid",
  "model": { "name": "unet", "version": "1.0.0" },
  "mask_url": "https://cdn.skycrop.local/masks/req_abc123.geojson",
  "mask_format": "geojson",
  "metrics": { "latency_ms": 2300, "tile_count": 9, "cloud_coverage": 12.3 },
  "warnings": []
}

Response 200 (inline):
{
  "request_id": "uuid",
  "model": { "name": "unet", "version": "1.0.0" },
  "mask_base64": "<base64-encoded-geojson-or-png>",
  "mask_format": "png",
  "metrics": { "latency_ms": 2100, "tile_count": 9, "cloud_coverage": 12.3 }
}

Response headers:
- X-Request-Id: echo
- X-Model-Version: effective version string (e.g., unet-1.0.0)

Errors:
- 400 INVALID_INPUT — malformed bbox/date; response body:
  {
    "error": { "code": "INVALID_INPUT", "message": "bbox invalid", "details": { "bbox": "minLon>=maxLon" } }
  }
- 404 MODEL_NOT_FOUND — unknown model_version
- 504 TIMEOUT — inference exceeded service timeout
- 502/503 UPSTREAM_ERROR — any upstream failure (e.g., Sentinel fetch inside ML pipeline if used later)

## 3) Error Schema

Canonical error shape (JSON):
{
  "error": {
    "code": "INVALID_INPUT | MODEL_NOT_FOUND | TIMEOUT | UPSTREAM_ERROR",
    "message": "human-readable summary",
    "details": { "...": "..." }
  },
  "meta": {
    "correlation_id": "uuid",
    "timestamp": "2025-11-07T10:00:00Z"
  }
}

HTTP mappings:
- 400 → INVALID_INPUT
- 401 → AUTH_REQUIRED (missing X-Internal-Token) — used only internally; Backend maps if needed
- 403 → UNAUTHORIZED_INTERNAL (invalid token)
- 404 → MODEL_NOT_FOUND
- 408/504 → TIMEOUT
- 5xx → UPSTREAM_ERROR

## 4) Model Versioning Policy

- Default resolution:
  - If header X-Model-Version present → use header
  - Else if body model_version present → use body
  - Else resolve latest stable for model_name="unet" from model registry (Backend source of truth; ML keeps a local mapping or environment-configured default, e.g., UNET_DEFAULT_VERSION=1.0.0)
- Explicit response header `X-Model-Version` communicates the effective version used.
- Stability rules:
  - Only semver tags with MAJOR.MINOR.PATCH are accepted; pre-release tags allowed for staging only.
- Model artifact verification:
  - SHA-256 integrity check on model load; failures → 500 UPSTREAM_ERROR

## 5) Rate Limits, Size Caps, and Resource Controls

- Per-instance soft limit (enforced in code):
  - 60 requests/min sustained; burst up to queue depth 5 (configurable)
- Request body size cap: 10 MB — reject 413 if exceeded
- Concurrency:
  - Max 5 concurrent inferences; additional requests queued up to 10; beyond → 503 with Retry-After: 10
- Memory guard:
  - Tiles processed one batch at a time to limit peak memory footprint

## 6) Timeouts, Retries, Backoff

- Inference timeout: 60s (configurable via ML_TIMEOUT_S)
- Retries:
  - The ML service does not retry inference; any deterministic failures return immediately
  - For transient upstream data fetch (if used), up to 2 retries
- Backoff table (exponential with jitter):
  - Attempt 1 → immediate
  - Attempt 2 → 0.5s ± 20%
  - Attempt 3 → 1.5s ± 20%
  - Max cumulative delay: 3s

- Backend behavior:
  - Backend may retry 502/503 per integration plan; ML should remain idempotent given identical inputs

## 7) Observability

- Logs (structured JSON):
  - { ts, level, route, request_id, model_version, latency_ms, tile_count, cache_hit, error.code }
- Metrics (to stdout/logs for Sprint 2):
  - inference_latency_ms (histogram bins)
  - tile_count
  - queue_depth
  - errors_total by error.code
- Correlation ID propagation via X-Request-Id

## 8) Example Requests/Responses

Example 1: bbox → mask_url
Request:
POST /v1/segmentation/predict
Headers:
  X-Internal-Token: s3cr3t
  X-Request-Id: 58bb0a2f-3f46-4d7d-a8c6-0b7f34dc4df1
Body:
{
  "bbox": [80.10, 7.20, 80.12, 7.22],
  "date": "2025-10-15",
  "model_version": "unet-1.0.0",
  "return": "mask_url"
}

Response 200:
{
  "request_id": "58bb0a2f-3f46-4d7d-a8c6-0b7f34dc4df1",
  "model": { "name": "unet", "version": "1.0.0" },
  "mask_url": "https://cdn.skycrop.local/masks/58bb0a2f.geojson",
  "mask_format": "geojson",
  "metrics": { "latency_ms": 1850, "tile_count": 4, "cloud_coverage": 8.2 }
}

Example 2: bbox → inline png
Request:
{
  "bbox": [80.10, 7.20, 80.11, 7.21],
  "date": "2025-10-10",
  "return": "inline",
  "tiling": { "size": 512, "overlap": 64 }
}

Response 200:
{
  "request_id": "c2f0a3b0-6e1f-44c8-a0f1-2e2a3f1a2b9d",
  "model": { "name": "unet", "version": "1.0.0" },
  "mask_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mask_format": "png",
  "metrics": { "latency_ms": 2150, "tile_count": 1, "cloud_coverage": 3.1 }
}

Example 3: Errors
- 400 INVALID_INPUT:
  {
    "error": { "code": "INVALID_INPUT", "message": "bbox invalid", "details": { "bbox": "minLon>=maxLon" } }
  }
- 404 MODEL_NOT_FOUND:
  {
    "error": { "code": "MODEL_NOT_FOUND", "message": "unet-9.9.9 not available", "details": { "requested": "unet-9.9.9" } }
  }
- 504 TIMEOUT:
  {
    "error": { "code": "TIMEOUT", "message": "Inference timed out after 60s" }
  }

## 9) Contract Test Cases (Backend ↔ ML)

Positive paths:
- bbox + explicit model_version → 200 with mask_url and metrics; X-Model-Version echoed
- bbox + header X-Model-Version (no body version) → header takes precedence
- bbox + inline return with small mask → returns mask_base64 and format=png
- correlation propagation: X-Request-Id echoed, matches request_id in payload

Negative paths:
- Missing/invalid token → 401/403
- INVALID_INPUT: bad bbox, missing date → 400 with details
- MODEL_NOT_FOUND: unknown version → 404
- TIMEOUT: injected delay > 60s → 504
- Queue overflow: 5 running + 10 queued → 503 with Retry-After

Idempotency:
- Same bbox/date/model_version produces deterministic mask_url for test fixtures (hash-based path)

## 10) Mock Data and Determinism

- Deterministic tiling/mask pipeline stub:
  - For bbox [80.10,7.20,80.12,7.22] on any date, return a canned GeoJSON polygon mask and fixed metrics
- PNG inline stub: 64×64 green square PNG base64
- Cloud coverage: return fixed 12.3 for canned path
- Randomness: seed any PRNG at process start for reproducibility

## 11) Seed and Local Setup

- ENV:
  - ML_INTERNAL_TOKEN=local-dev-token
  - ML_TIMEOUT_S=60
  - UNET_DEFAULT_VERSION=1.0.0
- Docker compose integrates ML at service name ml:8000; Backend uses ML_BASE_URL=http://ml:8000 and X-Internal-Token with same value
- No persistent storage required in Sprint 2 (mask_url can be synthetic file path or /tmp served via static in Flask dev)

## 12) Open Questions & Assumptions

- Mask storage:
  - For Sprint 2, mask_url can be ephemeral served from ML; Production will migrate to object storage (S3/R2) managed by Backend
- CRS transformations:
  - Backend guarantees SRID 4326 bbox; ML will not perform reprojection in Sprint 2
- Model registry source of truth:
  - Backend registry per [`Doc/System Design Phase/data_schemas_postgis_sprint2.md`](Doc/System Design Phase/data_schemas_postgis_sprint2.md); ML receives resolved version via header/body and does not query DB directly in Sprint 2
