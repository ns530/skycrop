-- SkyCrop Database Initialization (PostgreSQL + PostGIS)
-- Creates core tables and indexes for MVP + Sprint 2 spatial updates

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','admin')),
  auth_provider VARCHAR(20) NOT NULL CHECK (auth_provider IN ('google','email')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  profile_photo_url VARCHAR(500),
  location VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted'))
);

CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- FIELDS (PostGIS) — Sprint 2 schema
CREATE TABLE IF NOT EXISTS fields (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  boundary GEOMETRY(MultiPolygon,4326) NOT NULL,
  area DECIMAL(10,2) NOT NULL, -- hectares (legacy; retained for compatibility)
  area_sqm NUMERIC NOT NULL,   -- m² computed from geography
  center GEOMETRY(Point,4326) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','deleted')),
  UNIQUE (user_id, name),
  CHECK (ST_IsValid(boundary)),
  CHECK (NOT ST_IsEmpty(boundary)),
  CHECK (area_sqm >= 1000 AND area_sqm <= 500000)
);

CREATE INDEX IF NOT EXISTS idx_fields_user_status ON fields(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fields_boundary_gist ON fields USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_fields_center_gist ON fields USING GIST(center);
CREATE INDEX IF NOT EXISTS idx_fields_created_at ON fields(created_at DESC);

-- updated_at auto-maintenance
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

-- Metrics compute (normalize SRID, derive center and area_sqm)
CREATE OR REPLACE FUNCTION compute_field_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize to SRID 4326 and MultiPolygon, force 2D
  NEW.boundary := ST_Multi(ST_Force2D(ST_SetSRID(NEW.boundary, 4326)));
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

-- Boundary change history (audit)
CREATE TABLE IF NOT EXISTS field_boundaries_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  boundary GEOMETRY(MultiPolygon, 4326) NOT NULL,
  area_sqm NUMERIC NOT NULL,
  version INTEGER NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by UUID,
  CHECK (ST_IsValid(boundary)),
  CHECK (NOT ST_IsEmpty(boundary))
);

CREATE INDEX IF NOT EXISTS idx_field_hist_field_version ON field_boundaries_history(field_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_field_hist_changed_at ON field_boundaries_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_hist_boundary_gist ON field_boundaries_history USING GIST(boundary);

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

-- HEALTH RECORDS
CREATE TABLE IF NOT EXISTS health_records (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  ndvi_mean DECIMAL(5,4) NOT NULL,
  ndvi_min DECIMAL(5,4) NOT NULL,
  ndvi_max DECIMAL(5,4) NOT NULL,
  ndvi_std DECIMAL(5,4) NOT NULL,
  ndwi_mean DECIMAL(5,4) NOT NULL,
  ndwi_min DECIMAL(5,4) NOT NULL,
  ndwi_max DECIMAL(5,4) NOT NULL,
  ndwi_std DECIMAL(5,4) NOT NULL,
  tdvi_mean DECIMAL(5,4) NOT NULL,
  health_status VARCHAR(20) NOT NULL CHECK (health_status IN ('excellent','good','fair','poor')),
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  trend VARCHAR(20) NOT NULL CHECK (trend IN ('improving','stable','declining')),
  satellite_image_id VARCHAR(100) NOT NULL,
  cloud_cover DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, measurement_date)
);

CREATE INDEX IF NOT EXISTS idx_health_field_date ON health_records(field_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_status ON health_records(health_status);

-- RECOMMENDATIONS (Sprint 3 alerts)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  "timestamp" TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('water','fertilizer')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  reason TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Idempotency unique constraint (safe-create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_recommendations_field_ts_type'
  ) THEN
    ALTER TABLE recommendations
      ADD CONSTRAINT uq_recommendations_field_ts_type UNIQUE (field_id, "timestamp", type);
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_field_ts_desc
  ON recommendations(field_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_details_gin
  ON recommendations USING GIN(details);

-- Maintain updated_at on update
DROP TRIGGER IF EXISTS trg_recommendations_updated_at ON recommendations;
CREATE TRIGGER trg_recommendations_updated_at
BEFORE UPDATE ON recommendations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- YIELD PREDICTIONS
CREATE TABLE IF NOT EXISTS yield_predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  prediction_date DATE NOT NULL,
  predicted_yield_per_ha DECIMAL(10,2) NOT NULL,
  predicted_total_yield DECIMAL(10,2) NOT NULL,
  confidence_lower DECIMAL(10,2) NOT NULL,
  confidence_upper DECIMAL(10,2) NOT NULL,
  expected_revenue DECIMAL(12,2) NOT NULL,
  harvest_date_estimate DATE,
  model_version VARCHAR(20) NOT NULL,
  features_used JSONB NOT NULL,
  actual_yield DECIMAL(10,2),
  accuracy_mape DECIMAL(5,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (predicted_yield_per_ha > 0),
  CHECK (confidence_lower <= confidence_upper)
);

CREATE INDEX IF NOT EXISTS idx_yield_field_date ON yield_predictions(field_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_yield_harvest ON yield_predictions(harvest_date_estimate);

-- DISASTER ASSESSMENTS
CREATE TABLE IF NOT EXISTS disaster_assessments (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  disaster_type VARCHAR(20) NOT NULL CHECK (disaster_type IN ('flood','drought','storm','other')),
  before_date DATE NOT NULL,
  after_date DATE NOT NULL,
  damaged_area_severe DECIMAL(10,2) NOT NULL,
  damaged_area_moderate DECIMAL(10,2) NOT NULL,
  damaged_area_minor DECIMAL(10,2) NOT NULL,
  total_damaged_area DECIMAL(10,2) NOT NULL,
  damage_percentage DECIMAL(5,2) NOT NULL CHECK (damage_percentage >= 0 AND damage_percentage <= 100),
  yield_loss_kg DECIMAL(10,2) NOT NULL,
  financial_loss DECIMAL(12,2) NOT NULL,
  report_pdf_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (before_date < after_date)
);

CREATE INDEX IF NOT EXISTS idx_disaster_field_created ON disaster_assessments(field_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disaster_type_after ON disaster_assessments(disaster_type, after_date);

-- WEATHER FORECASTS
CREATE TABLE IF NOT EXISTS weather_forecasts (
  forecast_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  temperature_min DECIMAL(5,2) NOT NULL,
  temperature_max DECIMAL(5,2) NOT NULL,
  weather_condition VARCHAR(50) NOT NULL,
  rainfall_probability INTEGER NOT NULL CHECK (rainfall_probability >= 0 AND rainfall_probability <= 100),
  rainfall_amount DECIMAL(6,2) NOT NULL,
  humidity INTEGER NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
  wind_speed DECIMAL(5,2) NOT NULL,
  is_extreme BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_weather_field_date ON weather_forecasts(field_id, forecast_date);

-- SATELLITE PREPROCESS JOBS (optional persistence for Sprint 2)
CREATE TABLE IF NOT EXISTS satellite_preprocess_jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bbox NUMERIC[] NOT NULL, -- [minLon,minLat,maxLon,maxLat]
  date DATE NOT NULL,
  bands TEXT[] NOT NULL,
  cloud_mask BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  idempotency_key_hash VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sat_pre_jobs_status ON satellite_preprocess_jobs(status, created_at DESC);

-- updated_at auto-maintenance for satellite_preprocess_jobs
DROP TRIGGER IF EXISTS trg_sat_pre_jobs_updated_at ON satellite_preprocess_jobs;
CREATE TRIGGER trg_sat_pre_jobs_updated_at
BEFORE UPDATE ON satellite_preprocess_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Sprint 3: Health Snapshots (vegetation indices NDVI/NDWI/TDVI)
-- Non-destructive addition; if table exists, statements are no-ops.
-- For existing deployments: run this block as an additive migration.
-- =====================================================================
CREATE TABLE IF NOT EXISTS health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  "timestamp" TIMESTAMPTZ NOT NULL, -- observation date/time (typically date at 00:00Z)
  source TEXT NOT NULL DEFAULT 'sentinel2',
  ndvi NUMERIC,
  ndwi NUMERIC,
  tdvi NUMERIC,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, "timestamp")
);

-- Composite index for retrieval by field and time (DESC)
CREATE INDEX IF NOT EXISTS idx_health_snapshots_field_ts
  ON health_snapshots(field_id, "timestamp" DESC);

-- Optional partial index for NDVI-present queries
CREATE INDEX IF NOT EXISTS idx_health_snapshots_ndvi_present
  ON health_snapshots("timestamp" DESC)
  WHERE ndvi IS NOT NULL;

-- Maintain updated_at on update
DROP TRIGGER IF EXISTS trg_health_snapshots_updated_at ON health_snapshots;
CREATE TRIGGER trg_health_snapshots_updated_at
BEFORE UPDATE ON health_snapshots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- Sprint 2: Actual Yields (farmer-entered harvest data)
-- Separate from ML predictions in yield_predictions table
-- =====================================================================
CREATE TABLE IF NOT EXISTS actual_yields (
  yield_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Yield data
  actual_yield_per_ha DECIMAL(10,2) NOT NULL CHECK (actual_yield_per_ha >= 0),
  total_yield_kg DECIMAL(10,2) NOT NULL CHECK (total_yield_kg >= 0),
  harvest_date DATE NOT NULL,
  
  -- Optional reference to prediction for accuracy tracking
  prediction_id UUID REFERENCES yield_predictions(prediction_id) ON DELETE SET NULL,
  predicted_yield_per_ha DECIMAL(10,2),
  accuracy_mape DECIMAL(5,2), -- Mean Absolute Percentage Error
  
  -- Additional context
  notes TEXT,
  crop_variety VARCHAR(100),
  season VARCHAR(20) CHECK (season IN ('maha','yala','other')),
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (harvest_date <= CURRENT_DATE), -- Can't harvest in the future
  CHECK (accuracy_mape IS NULL OR (accuracy_mape >= 0 AND accuracy_mape <= 100))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_actual_yields_field_date 
  ON actual_yields(field_id, harvest_date DESC);

CREATE INDEX IF NOT EXISTS idx_actual_yields_user_date 
  ON actual_yields(user_id, harvest_date DESC);

CREATE INDEX IF NOT EXISTS idx_actual_yields_season 
  ON actual_yields(season, harvest_date DESC);

CREATE INDEX IF NOT EXISTS idx_actual_yields_prediction 
  ON actual_yields(prediction_id) 
  WHERE prediction_id IS NOT NULL;

-- Trigger for updated_at maintenance
DROP TRIGGER IF EXISTS trg_actual_yields_updated_at ON actual_yields;
CREATE TRIGGER trg_actual_yields_updated_at
BEFORE UPDATE ON actual_yields
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Trigger to auto-calculate accuracy if prediction exists
CREATE OR REPLACE FUNCTION calculate_yield_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prediction_id IS NOT NULL AND NEW.predicted_yield_per_ha IS NOT NULL AND NEW.predicted_yield_per_ha > 0 THEN
    -- MAPE = |actual - predicted| / actual * 100
    NEW.accuracy_mape := ABS(NEW.actual_yield_per_ha - NEW.predicted_yield_per_ha) / NEW.actual_yield_per_ha * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actual_yields_accuracy ON actual_yields;
CREATE TRIGGER trg_actual_yields_accuracy
BEFORE INSERT OR UPDATE OF actual_yield_per_ha, predicted_yield_per_ha ON actual_yields
FOR EACH ROW
EXECUTE FUNCTION calculate_yield_accuracy();

-- Prevent duplicate entries for same field on same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_actual_yields_field_harvest_unique 
  ON actual_yields(field_id, harvest_date);

-- END OF SCHEMA