-- Migration: Ensure compute_field_metrics trigger exists
-- This ensures the database trigger is set up to calculate area_sqm and center
-- from the boundary geometry automatically

-- Function to compute field metrics (area_sqm and center from boundary)
CREATE OR REPLACE FUNCTION compute_field_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure geometry is valid, make valid if possible
  IF NOT ST_IsValid(NEW.boundary) THEN
    NEW.boundary := ST_MakeValid(NEW.boundary);
  END IF;

  -- Normalize to SRID 4326 and MultiPolygon, force 2D
  NEW.boundary := ST_Multi(ST_Force2D(ST_SetSRID(NEW.boundary, 4326)));

  -- Ensure the geometry is still valid after normalization
  IF NOT ST_IsValid(NEW.boundary) THEN
    RAISE EXCEPTION 'Geometry is invalid after normalization';
  END IF;

  -- Calculate center point from boundary centroid
  NEW.center := ST_SetSRID(ST_Centroid(NEW.boundary), 4326);

  -- Calculate area in square meters using geography (accurate for Earth)
  NEW.area_sqm := ST_Area(NEW.boundary::geography);

  -- Ensure area_sqm is reasonable (not zero or negative)
  IF NEW.area_sqm <= 0 THEN
    RAISE EXCEPTION 'Calculated area is invalid: %', NEW.area_sqm;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (idempotent)
DROP TRIGGER IF EXISTS trg_fields_compute ON fields;

-- Create trigger to run BEFORE INSERT or UPDATE of boundary
CREATE TRIGGER trg_fields_compute
BEFORE INSERT OR UPDATE OF boundary ON fields
FOR EACH ROW
EXECUTE FUNCTION compute_field_metrics();

-- Verify trigger was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_fields_compute' 
    AND tgrelid = 'fields'::regclass
  ) THEN
    RAISE NOTICE 'Trigger trg_fields_compute created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create trigger trg_fields_compute';
  END IF;
END$$;

