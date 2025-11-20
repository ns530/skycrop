-- SkyCrop - Actual Yields Table Migration
-- Creates table for farmer-entered actual yield data (separate from ML predictions)
-- Sprint 2: Yield Data Entry Feature

-- ACTUAL YIELDS (farmer-entered data)
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

COMMENT ON TABLE actual_yields IS 'Farmer-entered actual yield data for harvest tracking and ML validation';
COMMENT ON COLUMN actual_yields.accuracy_mape IS 'Mean Absolute Percentage Error between predicted and actual yield';
COMMENT ON COLUMN actual_yields.season IS 'Sri Lankan paddy seasons: Maha (Oct-Mar), Yala (Apr-Sep)';

