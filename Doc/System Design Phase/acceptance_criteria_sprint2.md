# SkyCrop — Sprint 2 Acceptance Criteria and Quality Gates

Owner: Architecture  
Scope: Measurable definitions of done (DoD), test cases, and quality gates for Sprint 2 backlog. These criteria align with the integration plan and API/ML contracts.  
References:
- OpenAPI baseline: [`backend/src/api/openapi.yaml`](backend/src/api/openapi.yaml)
- Integration plan: [`Doc/System Design Phase/sprint2_integration_plan.md`](Doc/System Design Phase/sprint2_integration_plan.md)
- REST contracts: [`Doc/System Design Phase/api_contracts_sprint2.md`](Doc/System Design Phase/api_contracts_sprint2.md)
- Data schemas: [`Doc/System Design Phase/data_schemas_postgis_sprint2.md`](Doc/System Design Phase/data_schemas_postgis_sprint2.md)
- Middleware: [`backend/src/api/middleware/auth.middleware.js`](backend/src/api/middleware/auth.middleware.js), [`backend/src/api/middleware/validation.middleware.js`](backend/src/api/middleware/validation.middleware.js), [`backend/src/api/middleware/rateLimit.middleware.js`](backend/src/api/middleware/rateLimit.middleware.js)
- Field model/schema: [`backend/src/models/field.model.js`](backend/src/models/field.model.js), [`backend/database/init.sql`](backend/database/init.sql)

Conventions:
- All timings are p95 unless noted.
- All performance measurements on dev baseline: Postgres with PostGIS enabled, Redis local, CPU-only ML.
- All API responses must follow the canonical error schema from OpenAPI.

## A) Field CRUD and Spatial Operations

Definition of Done:
- Implement GET /api/v1/fields with filters (bbox, near, intersects), pagination, and sorting per contracts.
- Implement POST /api/v1/fields to accept GeoJSON Polygon/MultiPolygon and compute area_sqm via ST_Area(geography); compute center via ST_Centroid.
- Implement GET /api/v1/fields/{id}, PATCH /api/v1/fields/{id}, DELETE /api/v1/fields/{id} (soft delete to status=deleted).

Validation and Spatial Rules:
- SRID policy: All inputs normalized to 4326; reject if not transformable or invalid.
- Geometry validity: ST_IsValid(boundary)=true; NOT ST_IsEmpty(boundary); reject self-intersections.
- Optional snapping: if configured, ST_SnapToGrid applied; warning returned in response.

Performance Targets:
- Spatial filters evaluated via GIST indexes:
  - bbox/near/intersects each query ≤ 50 ms at 10k fields (warm cache) measured at DB level.
- Listing endpoint end-to-end ≤ 200 ms p95 for cache-miss with 20 items.

Test Coverage:
- Unit tests: service-level SRID handling, geometry validation, area and centroid computation.
- Integration tests:
  - Create field with valid polygon; verify area_sqm within ±1% vs reference calculation.
  - Reject invalid/self-intersecting polygon; error code VALIDATION_ERROR with path info.
  - Filters:
    - bbox filter returns intersecting fields only;
    - near filter returns fields within radius_m using ST_DWithin(geography);
    - intersects with GeoJSON and with field:{uuid} behaves correctly.
  - Pagination caps enforced; page_size ≤ 100 returns 400 if exceeded.
  - Ownership enforced: user cannot access others’ fields (404 or 403 as per service design).
- Cache behavior:
  - After create/update/delete, keys fields:list:* and fields:byId:{id} invalidated; verified in tests by Redis key inspection or hit/miss markers.

## B) Boundary Validation Quality

Definition of Done:
- Reject self-intersection and degenerate rings with clear error details (ring index / segment if available).
- ST_IsValid enforced; NOT ST_IsEmpty enforced.

Accuracy:
- area_sqm computed via ST_Area(geography) must be within ±1% of offline reference (QGIS/GEOS) for seed polygons.

Optional Snapping:
- If ST_SnapToGrid is configured, responses include warnings: [{code:"GEOMETRY_SNAPPED", message, tolerance_m}].

## C) Satellite Service and Preprocessing

Tile Fetch:
- GET /api/v1/satellite/tiles/{z}/{x}/{y}?bands&date&cloud_lt implemented as a proxy with:
  - Redis caching of tile bytes + ETag with 6h TTL.
  - ETag/If-None-Match support (returns 304).
  - Cache-Control: public, max-age=21600.

Preprocess Job:
- POST /api/v1/satellite/preprocess with body { bbox, date, bands, cloud_mask } and Idempotency-Key header:
  - Returns 202 on first submission with request_id.
  - Duplicate requests with same Idempotency-Key return 200/202 with same request_id.

Reliability Targets:
- Retry policy against Sentinel 429/5xx: exponential backoff with jitter (up to 3 attempts, base 500ms, max 3s).
- Timeouts: 10s per tile; 30s for process job submission.

Caching KPI:
- On repeated tile viewing sessions, achieve Redis tile cache hit rate ≥ 70% (measured over test scenario with ≥ 100 tile requests).

Tests:
- Tile endpoint returns 304 with If-None-Match.
- Idempotency: second identical preprocess request returns same request_id without re-triggering upstream.
- Upstream 429/5xx mapped to 503 with ErrorResponse { code: UPSTREAM_UNAVAILABLE }.

## D) ML Flask Service and Inference (Gateway)

Backend Gateway:
- POST /api/v1/ml/segmentation/predict implemented with:
  - Exactly one of bbox or field_id required; field_id resolves to boundary (owner-checked).
  - X-Request-Id propagated to ML; X-Model-Version header optional passthrough.
  - ML auth via X-Internal-Token.

Latency/Throughput:
- p95 ≤ 60s per request on CPU for 512×512 tiles with overlap=64, queue concurrency limited to 5.
- Proper 504 TIMEOUT mapping if ML exceeds backend timeout.

Caching:
- Responses cached in Redis keyed by request hash (including model_version) for 24h.

Tests:
- Positive: bbox request returns mask_url and metrics.
- field_id request returns mask_url and validates ownership.
- MODEL_NOT_FOUND (404) mapped correctly; INVALID_INPUT (400) mapped to 400 with code.
- TIMEOUT path simulated with delayed stub; returns 504.
- Cache hit path verified by repeated identical request returns from cache with significantly lower latency.

ML Service Scaffold:
- ML exposes /health and /v1/segmentation/predict matching contract in [`Doc/System Design Phase/ml_service_contracts_sprint2.md`](Doc/System Design Phase/ml_service_contracts_sprint2.md).

## E) Docker, CI, and Coverage

- Docker images (backend, ml, redis, postgres) build locally via docker-compose without errors.
- CI pipelines green:
  - Lint passes
  - Unit tests and integration tests pass
  - Test coverage ≥ 80% for backend and ML units (statement/branch average).
- No secrets committed; all secrets via env; verified by secret scanning tool or CI rule.

## F) Security and Validation

- Rate limiting:
  - API limiter active; evident via 429 responses after exceeding configured threshold in test harness.
  - Auth limiter remains active for auth endpoints (unchanged).
- Input validation schemas:
  - Joi validates body/query inputs; errors formatted with details list.
  - Request body size cap enforced: default 2 MB; satellite preprocess and ML inline up to 10 MB.
- Auth:
  - Bearer JWT required for protected routes; invalid/expired returns 401 with proper code.
  - Ownership checks verified by attempting cross-tenant access.

## G) Performance Budgets

- API:
  - p95 < 3s under 100 RPS with Redis enabled (locally simulated with k6/Jest+autocannon).
- Spatial:
  - Field filters ≤ 50 ms DB time at 10k rows (explain analyze captures; shared in artifacts).
- ML:
  - p95 < 60s with queued load of 5 concurrent; queue fairness demonstrated.

## H) Observability

- Logs:
  - Structured JSON logs include { correlation_id, user_id, route, latency_ms, cache_hit, provider }.
- Metrics:
  - At least log-based counters for cache hit rate, upstream errors, and ML latency_ms.
- Tracing:
  - X-Request-Id accepted and echoed; correlation_id returned in response meta.

## I) Testability Hooks and Seed Data

- Sentinel stubs: deterministic PNG bytes + ETag; preprocess job stub returns fixed request_id.
- ML stub: deterministic mask for a fixed bbox/date; controlled latency injection.
- Seed data:
  - Two sample fields (valid SRID 4326 polygons ~0.5–1.0 ha) inserted via SQL or test seeds; used in intersects/near tests.

## J) Exit Criteria Checklist

- [ ] All Field endpoints implemented and passing tests
- [ ] Spatial validations enforced; area_sqm accurate within ±1%
- [ ] Satellite tile caching with ETag and 70%+ hit rate scenario passes
- [ ] Preprocess idempotency verified
- [ ] ML predict proxy implemented; all mapped error paths tested
- [ ] ML service health and predict endpoints available per contract
- [ ] CI green; coverage ≥ 80% for backend and ML units
- [ ] Security checks: rate limits, validation, auth, and no committed secrets
- [ ] Performance budgets met (API and ML)
- [ ] Observability fields present in logs; correlation_id propagation verified