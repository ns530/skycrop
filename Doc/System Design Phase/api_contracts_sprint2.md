# SkyCrop — Sprint 2 Backend REST API Contracts (Authoritative)

Owner: Architecture  
Scope: OpenAPI-aligned REST contracts for Backend public API to be implemented in Sprint 2. These contracts align with middleware/security patterns and DB schemas.  
References:
- OpenAPI base: [`backend/src/api/openapi.yaml`](backend/src/api/openapi.yaml)
- Auth middleware (JWT): [`backend/src/api/middleware/auth.middleware.js`](backend/src/api/middleware/auth.middleware.js)
- Validation middleware (Joi): [`backend/src/api/middleware/validation.middleware.js`](backend/src/api/middleware/validation.middleware.js)
- Rate limiting middleware: [`backend/src/api/middleware/rateLimit.middleware.js`](backend/src/api/middleware/rateLimit.middleware.js)
- Field model: [`backend/src/models/field.model.js`](backend/src/models/field.model.js)
- DB schema: [`backend/database/init.sql`](backend/database/init.sql)

Conventions:
- All endpoints require Authorization: Bearer <JWT> unless specified.
- Content-Type: application/json; charset=utf-8
- SRID: 4326 (WGS84 lon/lat) for all geometry I/O. Area computed as ST_Area(geography) for m².
- Error schema uses components.schemas.Error (code, message, details).
- Rate limits: default API limiter (1000 req/hour/user-or-IP). Auth endpoints use stricter limits (already implemented).
- Request size caps: default 2 MB; satellite preprocess and ML inline payloads up to 10 MB.

## Common Schemas

- Field (response):
  - field_id (uuid), user_id (uuid), name (string), boundary (GeoJSON Polygon/MultiPolygon), area_sqm (number), center (GeoJSON Point), status (active|archived|deleted), created_at, updated_at
- GeoJSON Polygon:
  - type: "Polygon" or "MultiPolygon", coordinates numeric arrays, SRID 4326
  - Rules: non-empty, ST_IsValid true, non-self-intersecting, minimum 4 points closing ring
- ErrorResponse:
  - { success: false, error: { code: string, message: string, details?: object }, meta?: { correlation_id, timestamp } }

## 1) Fields

### 1.1 GET /api/v1/fields

Purpose: List authenticated user’s fields with spatial filters and pagination.

Security: Bearer JWT  
Rate-limit: apiLimiter  
Cache: server-side cached list results 300s keyed by user and filter hash.

Query parameters:
- bbox: string, format "minLon,minLat,maxLon,maxLat"
  - Validation: 4 comma-separated floats; -180 ≤ lon ≤ 180; -90 ≤ lat ≤ 90; minLon < maxLon; minLat < maxLat
  - Semantics: returns fields whose boundary intersects bbox (Intersects)
- near: string, format "lat,lon,radius_m"
  - Validation: 3 comma-separated; -90 ≤ lat ≤ 90; -180 ≤ lon ≤ 180; 0 < radius_m ≤ 200000
  - Semantics: fields whose center is within radius_m of point (ST_DWithin(center::geography, point::geography, radius_m))
- intersects: string (GeoJSON Polygon/MultiPolygon) OR "field:{uuid}"
  - If GeoJSON: SRID 4326; ST_Intersects(boundary, geom)
  - If "field:{uuid}": uses boundary of referenced field
- page: integer ≥ 1 (default 1)
- page_size: integer 1–100 (default 20)
- sort: enum[name, created_at, area_sqm] (default created_at)
- order: asc|desc (default desc)

Response 200:
{
  "success": true,
  "data": [
    {
      "field_id": "uuid",
      "user_id": "uuid",
      "name": "North plot",
      "boundary": { "type": "Polygon", "coordinates": [[[80.1,7.2],...]] },
      "area_sqm": 7850.23,
      "center": { "type": "Point", "coordinates": [80.102,7.205] },
      "status": "active",
      "created_at": "2025-10-10T10:00:00Z",
      "updated_at": "2025-10-10T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "page_size": 20, "total": 2 }
}

Errors:
- 400 VALIDATION_ERROR (bad bbox/near/intersects)
- 401 AUTH_REQUIRED

Examples:
- GET /api/v1/fields?bbox=80.10,7.20,80.50,7.80&page=1&page_size=10
- GET /api/v1/fields?near=7.21,80.15,5000
- GET /api/v1/fields?intersects=field:6b0f4a2b-2a32-4be5-bb27-5f2f2210b91a

### 1.2 POST /api/v1/fields

Purpose: Create a field with GeoJSON boundary. Computes area_sqm using ST_Area(geography) and center via ST_Centroid.

Security: Bearer JWT  
Rate-limit: apiLimiter  
Validation:
- name: string 1–50
- boundary: GeoJSON Polygon or MultiPolygon, SRID 4326, ST_IsValid true, NOT ST_IsEmpty, no self-intersections
- Optional snapping: server may apply ST_SnapToGrid(boundary, tolerance_meters/111320) if configured; if altered, respond with warnings.

Request:
{
  "name": "North plot",
  "boundary": { "type": "Polygon", "coordinates": [[[80.1,7.2],[80.11,7.2],[80.11,7.21],[80.1,7.21],[80.1,7.2]]] }
}

Response 201:
{
  "success": true,
  "data": {
    "field_id": "uuid",
    "user_id": "uuid",
    "name": "North plot",
    "boundary": { ... },
    "area_sqm": 7850.23,
    "center": { "type": "Point", "coordinates": [80.105,7.205] },
    "status": "active",
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  },
  "warnings": [
    { "code": "GEOMETRY_SNAPPED", "message": "Boundary was snapped with tolerance 0.2m" }
  ]
}

Errors:
- 400 VALIDATION_ERROR (invalid GeoJSON, self-intersection)
- 401 AUTH_REQUIRED
- 409 CONFLICT (duplicate name per user)

### 1.3 GET /api/v1/fields/{id}

Purpose: Retrieve field by ID (owner-only).  
Security: Bearer JWT

Response 200: { "success": true, "data": <Field> }  
Errors: 401, 404

### 1.4 PATCH /api/v1/fields/{id}

Purpose: Update field metadata (name, status). Boundary updates must use boundary endpoint (future) or accept boundary in PATCH if needed; for Sprint 2 keep metadata only.

Security: Bearer JWT  
Validation:
- name?: string 1–50
- status?: enum active|archived|deleted

Response 200: { "success": true, "data": <Field> }  
Errors: 400, 401, 404, 409

### 1.5 DELETE /api/v1/fields/{id}

Purpose: Soft delete field (status = deleted).  
Security: Bearer JWT  
Response 200: { "success": true }  
Errors: 401, 404

Notes:
- On create/update/delete: invalidate Redis keys for lists and byId as per integration plan.

## 2) Satellite

### 2.1 GET /api/v1/satellite/tiles/{z}/{x}/{y}

Purpose: Fetch Sentinel-2 tile image proxied by Backend.  
Security: Bearer JWT (public caching allowed via headers)  
Rate-limit: apiLimiter  
Caching:
- Redis cache for tile bytes + ETag with TTL=6h
- Response headers: ETag, Cache-Control: public, max-age=21600; Support If-None-Match 304

Path params:
- z, x, y: integers (standard web mercator tile indices for the chosen tiling service)

Query params:
- bands: csv enum values subset of [RGB,NIR,SWIR] (default RGB)
- date: string YYYY-MM-DD (optional; defaults to most recent cloud_lt)
- cloud_lt: integer 0–100 (default 20)

Response 200 (image/* or application/octet-stream).  
Response 304 if ETag matches.  
Errors:
- 400 VALIDATION_ERROR (bad bands/date)
- 401 AUTH_REQUIRED
- 502/503 mapped UPSTREAM_ERROR/UPSTREAM_UNAVAILABLE with error schema if upstream failed (when JSON response path used)

Examples:
- GET /api/v1/satellite/tiles/12/3567/2150?bands=RGB,NIR&date=2025-10-10&cloud_lt=20

### 2.2 POST /api/v1/satellite/preprocess

Purpose: Submit preprocessing job for bbox/date/bands/cloud-mask. Idempotent via Idempotency-Key header.

Security: Bearer JWT  
Rate-limit: apiLimiter  
Headers:
- Idempotency-Key: string 1–128 (required for idempotent behavior)

Request:
{
  "bbox": [minLon, minLat, maxLon, maxLat],
  "date": "2025-10-10",
  "bands": ["RGB","NIR"],
  "cloud_mask": true
}

Validation:
- bbox: array of 4 numbers; coordinate ranges valid and min<max
- date: YYYY-MM-DD
- bands: non-empty subset of allowed values
- cloud_mask: boolean (default true)

Response 202:
{
  "success": true,
  "data": {
    "request_id": "uuid-or-hash",
    "status": "accepted",
    "received_at": "2025-10-10T10:00:00Z"
  }
}

Idempotent duplicate: 200 or 202 with same request_id and status.

Errors:
- 400 VALIDATION_ERROR or missing Idempotency-Key
- 401 AUTH_REQUIRED
- 503 UPSTREAM_UNAVAILABLE (Sentinel issues)

## 3) ML Gateway

### POST /api/v1/ml/segmentation/predict

Purpose: Proxy to internal ML Flask service to produce segmentation mask for a bbox or field boundary.

Security: Bearer JWT (external); Backend authenticates to ML via X-Internal-Token  
Rate-limit: apiLimiter  
Timeout: 60s (CPU baseline); queue concurrency limited to 5

Request:
{
  "bbox": [minLon, minLat, maxLon, maxLat] | null,
  "field_id": "uuid" | null,
  "date": "YYYY-MM-DD",
  "model_version": "unet-1.0.0",
  "tiling": { "size": 512, "overlap": 64 },
  "return": "mask_url" | "inline"
}

Validation:
- Require exactly one of bbox or field_id
- bbox as above; field_id must belong to user
- date required; model_version optional; tiling optional (defaults size=512, overlap=64)
- return defaults to mask_url

Response 200:
{
  "success": true,
  "data": {
    "request_id": "uuid",
    "model": { "name": "unet", "version": "1.0.0" },
    "mask_url": "https://.../mask.geojson",
    "mask_format": "geojson",
    "metrics": { "latency_ms": 2300, "tile_count": 9, "cloud_coverage": 12.3 },
    "warnings": []
  }
}

If return=inline and mask fits payload constraints:
{
  "success": true,
  "data": {
    "request_id": "uuid",
    "mask_base64": "<base64-png-or-geojson>",
    "mask_format": "png",
    "metrics": { ... }
  }
}

Errors (mapped from ML):
- 400 INVALID_INPUT
- 404 MODEL_NOT_FOUND
- 504 TIMEOUT
- 502/503 UPSTREAM_ERROR

Headers:
- X-Request-Id: echo/propagate
- X-Model-Version: optional passthrough to ML

## 4) Health (Sprint 3 preview)

- Any vegetation indices endpoints beyond GET latest/history remain stubbed in Sprint 2. For Sprint 2, specify 501 Not Implemented where indices aggregation endpoints would be (e.g., /api/v1/health/indices/raster). Existing health endpoints in OpenAPI remain read-only and out of scope for write operations.

## 5) Validation Rules Summary

- GeoJSON:
  - type must be "Polygon" or "MultiPolygon" for boundaries; coordinates must be arrays of linear rings with first and last vertex equal; numeric finite; within lon/lat bounds
  - Reject self-intersecting geometries; check ST_IsValid
- Spatial Filters:
  - bbox, near, and intersects are mutually combinable; backend applies AND semantics if multiple supplied
  - near radius limited to 200 km
- Pagination caps:
  - page_size max 100 to bound payloads
- Name uniqueness:
  - (user_id, name) unique; return 409 CONFLICT if violated
- Size caps:
  - Enforce request body size limit; reject 413 with error schema if exceeded

## 6) Headers and Caching

- Authentication: Authorization: Bearer <token>
- Idempotency (preprocess): Idempotency-Key
- ETag and Cache-Control for tiles; support If-None-Match
- Correlation: X-Request-Id (accept and echo)
- Responses include meta.correlation_id and timestamp where feasible

## 7) Examples

Example: Create Field
Request:
POST /api/v1/fields
Authorization: Bearer <token>
{
  "name": "Block A",
  "boundary": {
    "type": "Polygon",
    "coordinates": [[[80.10,7.20],[80.12,7.20],[80.12,7.22],[80.10,7.22],[80.10,7.20]]]
  }
}

Response 201:
{
  "success": true,
  "data": {
    "field_id": "1f2a8b1d-6d13-4e8a-86f3-4e031f5a2d7f",
    "user_id": "c6b4c73a-2d5c-4c3c-8a41-8b3f2d3e6f1a",
    "name": "Block A",
    "boundary": { ... },
    "area_sqm": 22149.56,
    "center": { "type": "Point", "coordinates": [80.11,7.21] },
    "status": "active",
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
}

Example: Field list with spatial filter and pagination
GET /api/v1/fields?bbox=80.10,7.20,80.50,7.80&page=2&page_size=20

Example: ML Predict by field_id
POST /api/v1/ml/segmentation/predict
{
  "field_id": "6b0f4a2b-2a32-4be5-bb27-5f2f2210b91a",
  "date": "2025-10-15",
  "return": "mask_url"
}

## 8) OpenAPI Additions (to be applied via patch)

Paths to add/update in OpenAPI:
- /api/v1/fields (GET with filters, POST with GeoJSON validation)
- /api/v1/fields/{id} (GET, PATCH, DELETE)
- /api/v1/satellite/tiles/{z}/{x}/{y} (GET with bands/date/cloud_lt and ETag caching)
- /api/v1/satellite/preprocess (POST with Idempotency-Key)
- /api/v1/ml/segmentation/predict (POST)

Components schemas to add:
- GeoJSONPolygon, Field, FieldCreateRequest, ErrorResponse, TileResponse (headers only; body is binary), MLMaskResponse

Security scheme:
- bearerAuth (JWT) already defined in [`backend/src/api/openapi.yaml`](backend/src/api/openapi.yaml)

Note: The exact OpenAPI diff will be provided in [`Doc/System Design Phase/openapi-sprint2.patch.md`](Doc/System Design Phase/openapi-sprint2.patch.md).