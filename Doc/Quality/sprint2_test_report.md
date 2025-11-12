Sprint 2 Test Report — SkyCrop Modular Monolith

Summary
- Scope: Field CRUD/spatial, Satellite tiles + preprocess, ML Gateway, ML Flask service.
- All automated tests executed locally and are deterministic with full mocks for external dependencies.
- Coverage gates met: Backend ≥80% branches/lines; ML service ≥85% lines.

Coverage Summary
- Backend (Jest): Statements 93.86%, Branches 81.49%, Functions 98.19%, Lines 94.64%.
  - Coverage artifact: [backend/coverage/lcov.info](backend/coverage/lcov.info:1)
- ML service (pytest): Total coverage 91.91% (cov-fail-under=85 passed).
  - Coverage artifacts: [ml-service/.coverage-reports/coverage.xml](ml-service/.coverage-reports/coverage.xml:1), [ml-service/.coverage-reports/html/index.html](ml-service/.coverage-reports/html/index.html:1)

Scenarios Executed (Representative)
- Fields API (integration):
  - Create → Get by ID → List (with bbox and cache) → Patch → Delete happy path
  - Duplicate name 409, invalid GeoJSON 400, bad bbox query 400
  - Tests: [backend/tests/integration/fields.api.test.js](backend/tests/integration/fields.api.test.js:1)
- Satellite tiles (integration):
  - First GET returns 200 image/png with ETag/Cache-Control; subsequent GET with If-None-Match returns 304
  - Validate bad z/x/y, bad bands, bad date → 400
  - Tests: [backend/tests/integration/satellite.tiles.test.js](backend/tests/integration/satellite.tiles.test.js:1)
- Satellite preprocess (integration):
  - 202 Accepted with job_id; Idempotency-Key returns same job_id; status GET coverage
  - Tests: [backend/tests/integration/satellite.preprocess.test.js](backend/tests/integration/satellite.preprocess.test.js:1)
- ML Gateway (integration + unit):
  - bbox mask_url path with cache miss→hit; inline path returns base64 geojson
  - Downstream error mapping: 400 INVALID_INPUT, 404 MODEL_NOT_FOUND, 501 NOT_IMPLEMENTED, 504 TIMEOUT
  - Correlation ID propagation via X-Request-Id
  - Tests: [backend/tests/integration/ml.predict.test.js](backend/tests/integration/ml.predict.test.js:1), [backend/tests/unit/ml.gateway.service.test.js](backend/tests/unit/ml.gateway.service.test.js:1), [backend/tests/unit/ml.gateway.service.branches.test.js](backend/tests/unit/ml.gateway.service.branches.test.js:1)
- Weather current (integration):
  - Provider call then cache hit; invalid field_id 400; not found 404
  - Test: [backend/tests/integration/weather.current.test.js](backend/tests/integration/weather.current.test.js:1)
- OpenAPI contracts:
  - jest-openapi harness loaded [backend/src/api/openapi.yaml](backend/src/api/openapi.yaml:1) and asserted responses for key endpoints
  - Test: [backend/tests/integration/contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:1)
- ML Flask service (pytest):
  - Predict bbox mask_url persists and serves static; inline returns base64 geojson
  - Auth: missing/invalid token; validation: bbox ranges, bbox+field_id, missing bbox/field_id
  - Model version resolution: header precedence, body fallback, prefixed body form accepted
  - Payload too large path (413 handler or 400 route catch) → INVALID_INPUT with correlation echo
  - Timeout simulation → 504 TIMEOUT
  - Correlation ID echoed in headers and response meta; performance smoke ≤ 300ms
  - Tests: [ml-service/tests/test_predict_bbox.py](ml-service/tests/test_predict_bbox.py:1), [ml-service/tests/test_auth_and_validation.py](ml-service/tests/test_auth_and_validation.py:1), [ml-service/tests/test_headers_limits_and_correlation.py](ml-service/tests/test_headers_limits_and_correlation.py:1), [ml-service/tests/test_health.py](ml-service/tests/test_health.py:1)

Contract Validation
- The harness in [backend/tests/integration/contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:19) uses jest-openapi to validate:
  - /api/v1/fields (GET/POST/PATCH/DELETE)
  - /api/v1/satellite/tiles/{z}/{x}/{y} including headers ETag/Cache-Control and binary content-type
  - /api/v1/satellite/preprocess (202 shape and idempotency)
  - /api/v1/ml/segmentation/predict (both inline and mask_url)
- All contract assertions passed.

Performance Smoke Results
- Backend:
  - Satellite tiles GET: mocked Sentinel Hub; first-call latency observed ~1–2ms in local run; stable
  - ML predict proxy: downstream mocked; end-to-end latency ≤ 5ms observed
- ML Flask:
  - /v1/segmentation/predict inline: reported metrics latency_ms ≤ 300 and wall-clock ≤ 350ms (with 50ms margin)
- Methodology documented in [Doc/Quality/sprint2_test_strategy.md](Doc/Quality/sprint2_test_strategy.md:1)

Security/Negative Testing Highlights
- All external HTTP calls (Sentinel Hub, ML service, weather) mocked via axios; no network required
- In-memory Redis fakes with setEx/setex compatibility, scan/del/incr used to exercise caching branches
- Body size enforcement path tested (MAX_CONTENT_LENGTH) and mapped to INVALID_INPUT
- Auth paths for ML Flask: 401 AUTH_REQUIRED, 403 UNAUTHORIZED_INTERNAL

Artifacts
- Backend coverage: [backend/coverage/lcov.info](backend/coverage/lcov.info:1) (HTML under backend/coverage/lcov-report if generated)
- ML service coverage: [ml-service/.coverage-reports/coverage.xml](ml-service/.coverage-reports/coverage.xml:1), [ml-service/.coverage-reports/html/index.html](ml-service/.coverage-reports/html/index.html:1)

How To Run Locally
- Backend:
  - cd backend
  - npm ci --include=dev
  - npx jest --config jest.config.js --coverage --runInBand
- ML service:
  - cd ml-service
  - python -m pip install -r requirements.txt
  - pytest -q

Notable Defects or Risks
- Logging noise in tests from winston console transport; acceptable for sprint; consider silencing in test env.
- OpenAPI spec does not cover every internal header strictly (e.g., ETag patterns) — mitigated with focused header assertions plus jest-openapi.
- Performance smoke thresholds are environment-dependent; margins applied to avoid flakiness.

Files Added/Modified (Sprint 2 QA)
- Added tests:
  - [ml-service/tests/test_headers_limits_and_correlation.py](ml-service/tests/test_headers_limits_and_correlation.py:1)
- Modified:
  - [ml-service/tests/conftest.py](ml-service/tests/conftest.py:1) (sys.path setup for import), [Doc/Quality/sprint2_test_strategy.md](Doc/Quality/sprint2_test_strategy.md:1)

Acceptance Confirmation
- Backend coverage gates met: Branches 81.49%, Lines 94.64% (global thresholds ≥80 configured in [backend/jest.config.js](backend/jest.config.js:35))
- ML service coverage met: 91.91% total with cov-fail-under=85 in [ml-service/pytest.ini](ml-service/pytest.ini:3)
- Contract tests against [backend/src/api/openapi.yaml](backend/src/api/openapi.yaml:1) passed for critical endpoints
- Deterministic, fully mocked tests; performance smoke assertions included; artifacts generated at the paths above.