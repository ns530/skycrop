-- Migration: Update area_sqm check constraint to allow smaller test fields
-- This allows areas >= 1 square meter instead of >= 1000

-- Drop the existing check constraint
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_area_sqm_check;

-- Add the updated check constraint
ALTER TABLE fields ADD CONSTRAINT fields_area_sqm_check CHECK (area_sqm >= 1 AND area_sqm <= 500000);