Sprint 2 Test Strategy — SkyCrop Modular Monolith

Version
- Owner: QA
- Sprint: 2
- Scope freeze: this strategy covers only test and QA artifacts. No runtime logic changes.

1) Objectives and Scope
Objectives
- Establish deterministic automated QA for Sprint 2 scope with 80%+ coverage per backend component and 85%+ for ML Flask.
- Validate API contracts against OpenAPI and ML contracts with schema-level checks.
- Add negative/edge cases for Field, Satellite, and ML Gateway.
- Add performance smoke assertions for critical paths (non-flaky thresholds).
- Generate coverage and test evidence in-repo (artifacts paths below).

In-Scope Components
- Backend (Node/Express, Jest):
  - Field CRUD + spatial operations: [field.routes.js](backend/src/api/routes/field.routes.js:1), [field.controller.js](backend/src/api/controllers/field.controller.js:1), [field.service.js](backend/src/services/field.service.js:1)
  - Satellite proxy/caching: [satellite.routes.js](backend/src/api/routes/satellite.routes.js:1), [satellite.controller.js](backend/src/api/controllers/satellite.controller.js:1), [satellite.service.js](backend/src/services/satellite.service.js:1)
  - ML Gateway proxy: [ml.routes.js](backend/src/api/routes/ml.routes.js:1), [ml.controller.js](backend/src/api/controllers/ml.controller.js:1), [mlGateway.service.js](backend/src/services/mlGateway.service.js:1)
  - Weather (for coverage improvement): [weather.routes.js](backend/src/api/routes/weather.routes.js:1), [weather.controller.js](backend/src/api/controllers/weather.controller.js:1), [weather.service.js](backend/src/services/weather.service.js:1)
  - OpenAPI: [openapi.yaml](backend/src/api/openapi.yaml:1)
- ML Flask service (pytest):
  - API: [api.py](ml-service/app/api.py:1)
  - Config and logging: [config.py](ml-service/app/config.py:1), [logging.py](ml-service/app/logging.py:1)
  - Schemas/inference stubs: [schemas.py](ml-service/app/schemas.py:1), [inference.py](ml-service/app/inference.py:1)
  - App factory: [__init__.py](ml-service/app/__init__.py:32)

Out of Scope
- CI pipelines or runtime refactors (provide guidance only).
- Production performance/load testing (only smoke checks are included here).

2) Test Types
- Unit tests
  - Backend: services/controllers/routes branch coverage lift; custom-errors mapping.
  - ML service: request parsing, model-version resolution, error mappers, logging headers.
- Integration tests
  - Backend HTTP via supertest with in-memory Redis and axios mocks.
  - End-to-end of route → controller → service → cache/mock downstream.
- Contract tests (OpenAPI-backed)
  - jest-openapi harness validates responses against [openapi.yaml](backend/src/api/openapi.yaml:1).
  - File: [contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:1).
- Negative and edge tests
  - Field: invalid GeoJSON, duplicate name, bad bbox filters.
  - Satellite: invalid z/x/y, invalid bands/date, ETag behaviors.
  - ML Gateway: invalid combinations (bbox+field_id), bad bbox ranges, downstream error mapping (400/404/501/504).
- Performance smoke (non-flaky)
  - Threshold: ≤ 300ms locally with mocks for Satellite tiles and ML predict; assert reported metrics and wall-clock.
  - Documented methodology and margins for CI jitter.
- Security linting note (advisory)
  - Dependency checks suggested: npm audit (backend), pip-audit (ml-service). Not enforced in this sprint.
  - Input validation negative-path coverage included.

3) Entry/Exit Criteria and Quality Gates
Entry
- Sprint 2 backend and ML service implemented and bootstrapped test scaffolds.
- Mocks/fakes available for Redis and HTTP clients (axios).

Exit
- Coverage gates achieved:
  - Backend (Jest): ≥ 80% lines and branches
  - ML service (pytest): ≥ 85% lines (branch where feasible)
- Contract validations passing for critical endpoints.
- Performance smoke thresholds met reliably with mocks.
- Reports generated and stored at:
  - Backend coverage: [backend/coverage/lcov.info](backend/coverage/lcov.info:1) (+ HTML if enabled)
  - ML service coverage: [ml-service/.coverage-reports/](ml-service/.coverage-reports/:1)
- Test report authored: [sprint2_test_report.md](Doc/Quality/sprint2_test_report.md:1)

4) Environments, Data, and External Dependencies
Test Environments
- Local Node 20+, Python 3.11+ (observed 3.14 works), OS: Windows 11.
- No real external calls; all HTTP requests mocked.

External Dependencies Handling
- Sentinel Hub OAuth/Process mocked via axios in tests.
- ML service downstream from backend mocked via axios.
- Redis replaced with in-memory fakes for deterministic behavior:
  - Backend integration/unit tests mock [redis.config](backend/src/config/redis.config.js:1) to return fake clients supporting get/setEx/setex/del/scan.
- Seed/fixtures
  - Fields API integration creates minimal field instances via mocked DB calls; consistent coordinates in Sri Lanka.
  - No real Postgres required; [sequelize.query](backend/src/config/database.config.js:1) and model methods stubbed in tests.

5) Risk-Based Prioritization and Mapping
High-priority risks (covered by tests)
- Contract drift with OpenAPI → jest-openapi assertions: [contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:1)
- Satellite caching/ETag behavior correctness → [satellite.tiles.test.js](backend/tests/integration/satellite.tiles.test.js:1)
- ML Gateway error mapping and caching → [ml.predict.test.js](backend/tests/integration/ml.predict.test.js:1) and unit tests
- ML service version resolution and payload limits → [test_headers_limits_and_correlation.py](ml-service/tests/test_headers_limits_and_correlation.py:1), [test_auth_and_validation.py](ml-service/tests/test_auth_and_validation.py:1)

Medium risks
- Performance regressions in mocked paths → smoke thresholds with jitter margins
- Header/correlation propagation → explicit assertions in both backend and ML tests

6) Test Suites Overview (key files)
Backend Integration (Jest)
- Fields: [fields.api.test.js](backend/tests/integration/fields.api.test.js:1)
- Satellite tiles: [satellite.tiles.test.js](backend/tests/integration/satellite.tiles.test.js:1)
- Satellite preprocess: [satellite.preprocess.test.js](backend/tests/integration/satellite.preprocess.test.js:1)
- ML Gateway: [ml.predict.test.js](backend/tests/integration/ml.predict.test.js:1)
- OpenAPI contract harness: [contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:1)
- Weather current: [weather.current.test.js](backend/tests/integration/weather.current.test.js:1)

Backend Unit (Jest)
- MLGateway service: [ml.gateway.service.test.js](backend/tests/unit/ml.gateway.service.test.js:1)
- Satellite service: [satellite.service.test.js](backend/tests/unit/satellite.service.test.js:1)
- Additional branch-coverage suites (added in Sprint 2) reside under [backend/tests/unit/](backend/tests/unit/:1)

ML Service (pytest)
- Health: [test_health.py](ml-service/tests/test_health.py:1)
- Predict bbox flows: [test_predict_bbox.py](ml-service/tests/test_predict_bbox.py:1)
- Auth/validation/timeout: [test_auth_and_validation.py](ml-service/tests/test_auth_and_validation.py:1)
- Headers/limits/correlation/perf: [test_headers_limits_and_correlation.py](ml-service/tests/test_headers_limits_and_correlation.py:1)

7) Performance Smoke Methodology
- Target endpoints
  - Backend: Satellite tiles GET, ML predict POST (downstream ML mocked)
  - ML service: /v1/segmentation/predict (stub inference)
- Approach
  - Warm-up excluded; single stable measurement; verify both reported metrics and wall-clock.
  - Threshold: ≤ 300ms locally with mocks; CI margin +50ms (documented in tests).
- Notes
  - Tests assert sanity on latency without tight coupling to specific hardware.

8) Coverage and Reporting Configuration
Backend (Jest)
- Config: [jest.config.js](backend/jest.config.js:1)
  - collectCoverage: true, reporters: text-summary, lcov
  - coverageDirectory: coverage
  - coverageThreshold: global ≥ 80 for branches/functions/lines/statements
Commands
- Install: npm ci (or npm i)
- Run: npm run test:coverage
Artifacts
- [backend/coverage/lcov.info](backend/coverage/lcov.info:1)
- Optional HTML under backend/coverage/lcov-report

ML Service (pytest)
- Config: [pytest.ini](ml-service/pytest.ini:1)
  - --cov=app, XML/HTML outputs to [.coverage-reports](ml-service/.coverage-reports/:1)
  - --cov-fail-under=85
Commands
- pip install -r requirements.txt
- pytest -q
Artifacts
- [ml-service/.coverage-reports/coverage.xml](ml-service/.coverage-reports/coverage.xml:1)
- [ml-service/.coverage-reports/html/index.html](ml-service/.coverage-reports/html/index.html:1)

9) How to Run Locally
Backend
- cd backend
- npm i
- npm run test:coverage
ML Service
- cd ml-service
- python -m pip install -r requirements.txt
- pytest -q
Artifacts will be generated to the locations listed above.

10) Contract Validation Notes
- Harness: jest-openapi matchers in [contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:19)
- Loads [openapi.yaml](backend/src/api/openapi.yaml:1) once per test run; asserts responses for:
  - Fields GET/POST/PATCH/DELETE
  - Satellite tiles (headers/schema for binary content), preprocess POST (202 structure, idempotency)
  - ML predict (both inline and mask_url)
- If jest-openapi is absent, assertions are made schema-lite and the strict assertions are skipped gracefully (documented in test file).

11) Mocks/Stubs
- Redis: in-memory fake client with get/setEx/setex/del/scan/incr/expire
- axios: post/get stubs for Sentinel Hub, ML service, weather provider
- DB: sequelize.query and model methods mocked; no real DB
- Headers: X-Request-Id propagated and asserted; model-version header echoed for ML paths

12) Security and Reliability Notes
- Dependency scans (advisory)
  - Backend: npm audit --production
  - ML: pip-audit (optional)
- Input validation
  - Negative-path coverage implemented for malformed GeoJSON, bbox ranges, body size 413, auth headers, and unsupported combinations.
- Determinism
  - Avoid real timers in retry logic; use short-circuit strategies or direct awaits
  - Cross-realm instanceof issues avoided by property-based assertions (documented in unit tests)

13) CI Guidance (not implemented here)
- Suggested jobs:
  - Backend: npm ci; npm run test:coverage; store lcov HTML and lcov.info as artifacts; enforce coverageThreshold via Jest
  - ML: pip install -r requirements.txt; pytest -q; archive .coverage-reports/html and XML
- Caching: node_modules and Python wheels cache
- Failing gates:
  - Jest coverageThreshold; pytest --cov-fail-under=85

14) Acceptance Mapping
- 80%+ backend coverage gate enforced via [jest.config.js](backend/jest.config.js:35)
- 85%+ ML coverage gate enforced via [pytest.ini](ml-service/pytest.ini:3)
- Contract validations in [contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:19)
- Reports generated at target paths (see Section 8)
- Non-flaky performance smoke tests added in backend/ML suites
- All external dependencies fully mocked

Appendix — Notable Test Artifacts/Files
- Backend:
  - Integration: [fields.api.test.js](backend/tests/integration/fields.api.test.js:1), [satellite.tiles.test.js](backend/tests/integration/satellite.tiles.test.js:1), [satellite.preprocess.test.js](backend/tests/integration/satellite.preprocess.test.js:1), [ml.predict.test.js](backend/tests/integration/ml.predict.test.js:1), [weather.current.test.js](backend/tests/integration/weather.current.test.js:1), [contracts.openapi.test.js](backend/tests/integration/contracts.openapi.test.js:1)
  - Unit: [ml.gateway.service.test.js](backend/tests/unit/ml.gateway.service.test.js:1), [satellite.service.test.js](backend/tests/unit/satellite.service.test.js:1) and additional branch-coverage files under [backend/tests/unit/](backend/tests/unit/:1)
- ML service:
  - [test_health.py](ml-service/tests/test_health.py:1), [test_predict_bbox.py](ml-service/tests/test_predict_bbox.py:1), [test_auth_and_validation.py](ml-service/tests/test_auth_and_validation.py:1), [test_headers_limits_and_correlation.py](ml-service/tests/test_headers_limits_and_correlation.py:1)

15) CI/CD Runbook — Sprint 2

Workflows (paths, triggers, artifacts)
- Backend CI [.github/workflows/backend-ci.yml](.github/workflows/backend-ci.yml)
  - Triggers: push and pull_request on paths under backend/**
  - Runtimes: Node 18.x and 20.x (matrix)
  - Steps (scoped to backend/): npm ci → npm run lint → npx jest --config jest.config.js --coverage --runInBand
  - Coverage gate: enforced via [jest.config.js](backend/jest.config.js:1) thresholds (≥ 80%)
  - Artifacts:
    - backend-coverage-lcov-<node>: [backend/coverage/lcov.info](backend/coverage/lcov.info:1)
    - backend-coverage-html-<node>: HTML folder [backend/coverage/lcov-report/index.html](backend/coverage/lcov-report/index.html:1)

- ML Service CI (pytest) [.github/workflows/ml-service-ci.yml](.github/workflows/ml-service-ci.yml)
  - Triggers: push and pull_request on paths under ml-service/**
  - Runtime: Python 3.11, pip cache enabled
  - Steps (scoped to ml-service/): pip install -r requirements.txt → optional black/ruff checks (if configured in [pyproject.toml](ml-service/pyproject.toml:1)) → pytest with coverage
  - Coverage gate: pytest --cov=app --cov-fail-under=85 producing XML/HTML to [.coverage-reports](ml-service/.coverage-reports/:1)
  - Artifacts:
    - ml-service-coverage-xml: [ml-service/.coverage-reports/coverage.xml](ml-service/.coverage-reports/coverage.xml:1)
    - ml-service-coverage-html: [ml-service/.coverage-reports/html/index.html](ml-service/.coverage-reports/html/index.html:1)

- ML Training CI (fast smoke) [.github/workflows/ml-training-ci.yml](.github/workflows/ml-training-ci.yml)
  - Triggers: push and pull_request on paths under ml-training/**
  - Runtime: Python 3.11, pip cache enabled
  - Steps (scoped to ml-training/): fast tests only; pytest -q tests --maxfail=1 --timeout=120
  - Coverage gate: --cov=ml-training --cov-fail-under=80 (kept lightweight)
  - Artifact:
    - ml-training-coverage-xml: [ml-training/coverage.xml](ml-training/coverage.xml:1)

- ML Service Docker build/publish [.github/workflows/ml-service-docker.yml](.github/workflows/ml-service-docker.yml)
  - Triggers: workflow_dispatch; push on branch main; push tags v*.*.* (semantic tags)
  - Build: docker/build-push-action@v5 with context ./ml-service, platforms linux/amd64, Buildx/QEMU enabled
  - Tags:
    - main branch: ghcr.io/${{ github.repository_owner }}/skycrop-ml-service:main
    - tag refs: ghcr.io/${{ github.repository_owner }}/skycrop-ml-service:${{ github.ref_name }}
  - Publish: conditional; pushes only if GHCR secrets are present (see Secrets below)
  - Artifact:
    - ml-service-image-digest: image-digest.txt with tag and digest for traceability

- CodeQL (security analysis) [.github/workflows/codeql.yml](.github/workflows/codeql.yml)
  - Triggers: push and pull_request to main; scheduled weekly (Mon 02:00 UTC)
  - Languages: javascript, python
  - Steps: init → autobuild → analyze; results appear in Security → Code scanning alerts

- Dependabot (dependency PRs) [.github/dependabot.yml](.github/dependabot.yml)
  - Ecosystems/schedules:
    - npm in /backend (weekly)
    - pip in /ml-service (weekly)
    - pip in /ml-training (weekly)
    - github-actions in / (weekly)
  - Output: automated PRs with version bumps and changelogs

How to access coverage artifacts in GitHub Actions
- Navigate to Actions → select the relevant workflow run → Artifacts (right panel):
  - Backend: backend-coverage-lcov-18.x / backend-coverage-lcov-20.x, and backend-coverage-html-18.x / 20.x
  - ML Service: ml-service-coverage-xml, ml-service-coverage-html
  - ML Training: ml-training-coverage-xml
  - Docker: ml-service-image-digest
- Download and unzip HTML coverage archives to view [index.html](backend/coverage/lcov-report/index.html:1) or [ml-service/.coverage-reports/html/index.html](ml-service/.coverage-reports/html/index.html:1) locally.

GHCR publishing (optional)
- Repository Secrets required (Settings → Secrets and variables → Actions):
  - GHCR_USERNAME: your GitHub username or org
  - GHCR_TOKEN: a PAT with write:packages scope (classic) or a fine‑grained token with Packages: write
- Behavior:
  - If both secrets exist: docker/build-push-action pushes to ghcr.io with the tag computed for branch/tag refs.
  - If secrets are missing: the workflow still succeeds but skips push; digest is still produced for traceability.
- Pulling the image:
  - docker pull ghcr.io/&lt;owner&gt;/skycrop-ml-service:main
  - or docker pull ghcr.io/&lt;owner&gt;/skycrop-ml-service:&lt;semver-tag&gt;

Branch protection recommendations (main)
- Require status checks to pass before merging:
  - backend-ci
  - ml-service-ci
  - ml-training-ci
  - codeql
- Require pull request reviews and up‑to‑date branches before merge.
- Optionally enforce linear history and signed commits per org policy.

Coverage gates summary
- Backend (Jest): enforced via [jest.config.js](backend/jest.config.js:1) global thresholds ≥ 80%
- ML Service (pytest): --cov-fail-under=85 with outputs to [.coverage-reports](ml-service/.coverage-reports/:1)
- ML Training (pytest): --cov-fail-under=80 (smoke-speed optimized)

Appendix — Security automation in CI (advisory; not enforced this sprint)
- Backend npm audit (production dependencies):
  - Example step: npm audit --production || true
- Python pip-audit for ml-service and ml-training:
  - Install: pip install pip-audit
  - Run: pip-audit || true
- Rationale: produce advisory vulnerability findings without causing flaky CI failures. Elevate to enforced gates in future sprints once baselines are triaged.
