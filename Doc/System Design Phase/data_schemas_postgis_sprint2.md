# SkyCrop — Sprint 2 Postgres/PostGIS Data Schemas and Spatial Policies

Owner: Architecture  
Scope: Authoritative DDL and policies for spatial data, caching, and ML registry aligning with Sprint 2 contracts. Includes migration guidance from current baseline schema.  
References:
- Current DB init: [`backend/database/init.sql`](backend/database/init.sql)
- Field model: [`backend/src/models/field.model.js`](backend/src/models/field.model.js)
- OpenAPI base: [`backend/src/api/openapi.yaml`](backend/src/api/openapi.yaml)

## 1) SRID and Spatial Policies

- Storage SRID: 4326 (WGS84 lon/lat) for all GEOMETRY columns (boundary Polygon/MultiPolygon, center Point).
- Accurate area: compute with `ST_Area(boundary::geography)` in m². Store as `area_sqm NUMERIC`. Derive hectares for presentation when needed (area_ha = area_sqm / 10_000).
- Validity and emptiness:
  - `CHECK (NOT ST_IsEmpty(boundary))`
  - `CHECK (ST_IsValid(boundary))` (reject self-intersections)
- Snapping policy (optional): when minor topology issues detected, apply `ST_SnapToGrid(boundary, tolerance_deg)` prior to validation; tolerance set from config (e.g., 2e-6 ≈ 0.2m at equator). If applied, record a history version and surface a warning to API clients.
- Indexing:
  - GIST on `boundary` and `center`
  - B-tree on common filters: `(user_id, status)`, timestamps

## 2) Tables and Indexes (DDL)

Note: The DDL below reflects the target schema for Sprint 2. See §5 for migration from current baseline.

### 2.1 fields

Purpose: Authoritative store for user fields (polygons).

```sql
-- Extensions (once per DB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Target schema (Sprint 2)
CREATE TABLE IF NOT EXISTS fields (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  boundary GEOMETRY(Polygon, 4326) NOT NULL,
  area_sqm NUMERIC NOT NULL, -- m², computed from geography
  center GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
  UNIQUE (user_id, name),
  CHECK (ST_IsValid(boundary)),
  CHECK (NOT ST_IsEmpty(boundary)),
  -- business guardrails: 0.1 ha .. 50 ha equivalently in m²
  CHECK (area_sqm >= 1000 AND area_sqm <= 500000)
);

CREATE INDEX IF NOT EXISTS idx_fields_user_status ON fields(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fields_boundary_gist ON fields USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_fields_center_gist ON fields USING GIST(center);
```

Updated_at trigger (optional):

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fields_updated_at ON fields;
CREATE TRIGGER trg_fields_updated_at
BEFORE UPDATE ON fields
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

Area/center compute trigger (optional if not done in service layer):

```sql
CREATE OR REPLACE FUNCTION compute_field_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize SRID to 4326 in case input diffs
  NEW.boundary := ST_Force2D(ST_SetSRID(NEW.boundary, 4326));
  NEW.center := ST_SetSRID(ST_Centroid(NEW.boundary), 4326);
  NEW.area_sqm := ST_Area(NEW.boundary::geography);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fields_compute ON fields;
CREATE TRIGGER trg_fields_compute
BEFORE INSERT OR UPDATE OF boundary ON fields
FOR EACH ROW
EXECUTE FUNCTION compute_field_metrics();
```

### 2.2 field_boundaries_history

Purpose: Audit trail of boundary changes with versioning.

```sql
CREATE TABLE IF NOT EXISTS field_boundaries_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  boundary GEOMETRY(Polygon, 4326) NOT NULL,
  area_sqm NUMERIC NOT NULL,
  version INTEGER NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by UUID, -- optional: users.user_id if available
  CHECK (ST_IsValid(boundary)),
  CHECK (NOT ST_IsEmpty(boundary))
);

CREATE INDEX IF NOT EXISTS idx_field_hist_field_version ON field_boundaries_history(field_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_field_hist_changed_at ON field_boundaries_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_hist_boundary_gist ON field_boundaries_history USING GIST(boundary);
```

Populate on boundary changes:

```sql
CREATE OR REPLACE FUNCTION log_field_boundary_change()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
  FROM field_boundaries_history
  WHERE field_id = NEW.field_id;

  INSERT INTO field_boundaries_history(field_id, boundary, area_sqm, version, changed_by)
  VALUES (NEW.field_id, NEW.boundary, ST_Area(NEW.boundary::geography), next_version, NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fields_log_change ON fields;
CREATE TRIGGER trg_fields_log_change
AFTER UPDATE OF boundary ON fields
FOR EACH ROW
WHEN (OLD.boundary IS DISTINCT FROM NEW.boundary)
EXECUTE FUNCTION log_field_boundary_change();
```

### 2.3 satellite_tiles_cache

Purpose: Cache Sentinel tiles or processed artifacts for performance and quota management.

```sql
CREATE TABLE IF NOT EXISTS satellite_tiles_cache (
  cache_key TEXT PRIMARY KEY, -- deterministic hash of z/x/y/bands/date/cloud_lt or bbox/date/bands
  z INT,
  x INT,
  y INT,
  bands TEXT[] NOT NULL,
  date DATE,
  data BYTEA,           -- optional inline bytes (small tiles)
  url TEXT,             -- optional external storage URL (preferred for larger payloads)
  etag TEXT,
  ttl_expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sat_cache_ttl ON satellite_tiles_cache(ttl_expires_at);
CREATE INDEX IF NOT EXISTS idx_sat_cache_tile ON satellite_tiles_cache(z, x, y);
```

TTL enforcement (optional cleanup job):

```sql
-- Periodic cleanup: DELETE FROM satellite_tiles_cache WHERE ttl_expires_at < NOW();
```

### 2.4 health_snapshots

Purpose: Per-field time series of vegetation indices for read models. Note: baseline already has `health_records`. Keep both with clear purpose or use a view.

Option A (new table):

```sql
CREATE TABLE IF NOT EXISTS health_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL, -- finer granularity than DATE
  ndvi NUMERIC,
  ndwi NUMERIC,
  tdvi NUMERIC,
  source VARCHAR(50), -- e.g., "sentinel_hub"
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_snap_field_time ON health_snapshots(field_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_snap_source ON health_snapshots(source);
```

Option B (view over existing `health_records` for Sprint 2):

```sql
CREATE OR REPLACE VIEW health_snapshots AS
SELECT
  gen_random_uuid() AS snapshot_id,
  hr.field_id,
  (hr.measurement_date::timestamp) AS timestamp,
  hr.ndvi_mean AS ndvi,
  hr.ndwi_mean AS ndwi,
  hr.tdvi_mean AS tdvi,
  'sentinel_hub'::VARCHAR(50) AS source,
  NULL::TEXT AS notes
FROM health_records hr;
```

### 2.5 model_registry

Purpose: Register ML models and metadata for deterministic inference.

```sql
CREATE TABLE IF NOT EXISTS model_registry (
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  uri TEXT NOT NULL,           -- storage location (e.g., s3://bucket/models/unet/1.0.0/)
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metrics JSONB,               -- e.g., {"f1":0.82,"iou":0.76,"dataset":"srilanka-v1"}
  PRIMARY KEY (model_name, version)
);

CREATE INDEX IF NOT EXISTS idx_model_created ON model_registry(created_at DESC);
```

## 3) Validation Rules and Constraints

- Geometry:
  - Enforce 2D via `ST_Force2D`
  - Ensure rings are closed; `ST_IsValid` covers common cases; reject self-intersections
- Area guardrails:
  - 0.1 ha ≤ area ≤ 50 ha → m² bounds [1,000 ; 500,000]
- Ownership:
  - All field operations must scope by `user_id`; consider RLS (Row-Level Security) in future sprints
- Names:
  - `(user_id, name)` unique; return 409 on violation in API

## 4) Query Patterns and Index Usage

- List fields by spatial filters:
  - bbox: `WHERE boundary && ST_MakeEnvelope(minLon, minLat, maxLon, maxLat, 4326)`
    - Optional precise filter: `AND ST_Intersects(boundary, ST_MakeEnvelope(...))`
  - near: `WHERE ST_DWithin(center::geography, ST_SetSRID(ST_Point(lon, lat),4326)::geography, radius_m)`
  - intersects-geometry: `WHERE ST_Intersects(boundary, :geom4326)`
  - intersects-field: `WHERE ST_Intersects(f.boundary, (SELECT boundary FROM fields WHERE field_id = :id))`
- GIST index on `boundary` and `center` supports these efficiently at 10k+ rows
- Pagination:
  - `ORDER BY created_at DESC, field_id` keyset pagination recommended for deep pages

## 5) Migration Approach from Baseline (init.sql)

Baseline differences:
- Current `fields` has `area DECIMAL(10,2)` (hectares semantics), not `area_sqm`.
- Current constraints: `CHECK (area >= 0.1 AND area <= 50)` (in hectares).
- `field_boundaries_history`, `satellite_tiles_cache`, `model_registry` not present.

Sprint 2 migration plan:
1) Non-breaking phase:
   - Add column: `ALTER TABLE fields ADD COLUMN IF NOT EXISTS area_sqm NUMERIC;`
   - Backfill: `UPDATE fields SET area_sqm = ST_Area(boundary::geography) WHERE area_sqm IS NULL;`
   - Create view for backward compat (if needed by existing app layer until refactor):
     ```sql
     CREATE OR REPLACE VIEW v_fields AS
     SELECT
       field_id, user_id, name, boundary, center, created_at, updated_at, status,
       area_sqm,
       (area_sqm / 10000.0)::DECIMAL(10,2) AS area_ha
     FROM fields;
     ```
   - Keep existing `area` column for Sprint 2. Service layer may prefer `area_sqm` going forward.
2) Introduce new tables:
   - Create `field_boundaries_history`, `satellite_tiles_cache`, `model_registry`
   - Optionally create `health_snapshots` as a view over `health_records`
3) Tighten constraints (optional in Sprint 3):
   - Replace hectares checks with `area_sqm`-based checks; deprecate `area` column
4) Code alignment:
   - Update models in a later sprint to read/write `area_sqm` and derive hectares at presentation
5) Rollback strategy:
   - Safe to drop `area_sqm` if not adopted; otherwise keep both until fully migrated

## 6) Sample DDL Bundle (Idempotent)

```sql
-- 1) Columns and compute function
ALTER TABLE fields ADD COLUMN IF NOT EXISTS area_sqm NUMERIC;

CREATE OR REPLACE FUNCTION compute_field_metrics()
RETURNS TRIGGER AS $$
BEGIN
  NEW.boundary := ST_Force2D(ST_SetSRID(NEW.boundary, 4326));
  NEW.center := ST_SetSRID(ST_Centroid(NEW.boundary), 4326);
  NEW.area_sqm := ST_Area(NEW.boundary::geography);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fields_compute ON fields;
CREATE TRIGGER trg_fields_compute
BEFORE INSERT OR UPDATE OF boundary ON fields
FOR EACH ROW
EXECUTE FUNCTION compute_field_metrics();

-- 2) History table and trigger
CREATE TABLE IF NOT EXISTS field_boundaries_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  boundary GEOMETRY(Polygon, 4326) NOT NULL,
  area_sqm NUMERIC NOT NULL,
  version INTEGER NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by UUID,
  CHECK (ST_IsValid(boundary)),
  CHECK (NOT ST_IsEmpty(boundary))
);
CREATE INDEX IF NOT EXISTS idx_field_hist_field_version ON field_boundaries_history(field_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_field_hist_boundary_gist ON field_boundaries_history USING GIST(boundary);

CREATE OR REPLACE FUNCTION log_field_boundary_change()
RETURNS TRIGGER AS $$
DECLARE next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
  FROM field_boundaries_history WHERE field_id = NEW.field_id;
  INSERT INTO field_boundaries_history(field_id, boundary, area_sqm, version, changed_by)
  VALUES (NEW.field_id, NEW.boundary, ST_Area(NEW.boundary::geography), next_version, NEW.user_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fields_log_change ON fields;
CREATE TRIGGER trg_fields_log_change
AFTER UPDATE OF boundary ON fields
FOR EACH ROW
WHEN (OLD.boundary IS DISTINCT FROM NEW.boundary)
EXECUTE FUNCTION log_field_boundary_change();

-- 3) Satellite cache
CREATE TABLE IF NOT EXISTS satellite_tiles_cache (
  cache_key TEXT PRIMARY KEY,
  z INT,
  x INT,
  y INT,
  bands TEXT[] NOT NULL,
  date DATE,
  data BYTEA,
  url TEXT,
  etag TEXT,
  ttl_expires_at TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sat_cache_ttl ON satellite_tiles_cache(ttl_expires_at);
CREATE INDEX IF NOT EXISTS idx_sat_cache_tile ON satellite_tiles_cache(z, x, y);

-- 4) Model registry
CREATE TABLE IF NOT EXISTS model_registry (
  model_name TEXT NOT NULL,
  version TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  uri TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metrics JSONB,
  PRIMARY KEY (model_name, version)
);

-- 5) Optional view for health snapshots
CREATE OR REPLACE VIEW health_snapshots AS
SELECT
  gen_random_uuid() AS snapshot_id,
  hr.field_id,
  (hr.measurement_date::timestamp) AS timestamp,
  hr.ndvi_mean AS ndvi,
  hr.ndwi_mean AS ndwi,
  hr.tdvi_mean AS tdvi,
  'sentinel_hub'::VARCHAR(50) AS source,
  NULL::TEXT AS notes
FROM health_records hr;
```

## 7) Security and RLS (Forward-Looking)

- Consider enabling Row Level Security (RLS) on `fields`, `health_records`, `health_snapshots`:
  - `ALTER TABLE fields ENABLE ROW LEVEL SECURITY;`
  - Policies keyed by `user_id` with application setting `SET app.current_user = '<uuid>'` in session
- For Sprint 2, enforce ownership in service layer; RLS can be introduced in Sprint 3.

## 8) Operational Notes

- Vacuum/Analyze: run after large geometry imports
- Maintenance:
  - Periodic cleanup of `satellite_tiles_cache` expired entries
  - Monitor GIST index size; reindex if needed
- Backups: enable PITR; test restore for geometry-heavy tables

## 9) Alignment Checklist

- [ ] Service layer computes/stores `area_sqm` and `center` consistently with geography
- [ ] API responses use `area_sqm` (and `area_ha` derived if needed)
- [ ] Spatial filters leverage GIST indexes; performance target: ≤ 50ms @10k rows
- [ ] History captured on boundary updates
- [ ] Satellite cache wired to Redis (primary) and optional DB cache for persistence
- [ ] Model registry used to resolve default `model_version` in ML Gateway
