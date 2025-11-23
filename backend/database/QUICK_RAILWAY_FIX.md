# Quick Fix: Railway Database Trigger Setup

## 🚨 Problem
Field creation fails with: `notNull Violation: Field.area_sqm cannot be null, Field.center cannot be null`

## ✅ Solution: Run This SQL on Railway

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Select your **SkyCrop project**
3. Click on your **PostgreSQL** service

### Step 2: Open Query Tab
1. Click on **"Query"** or **"Data"** tab
2. You'll see a SQL editor

### Step 3: Copy & Paste This SQL

```sql
-- Ensure compute_field_metrics trigger exists
CREATE OR REPLACE FUNCTION compute_field_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize to SRID 4326 and MultiPolygon, force 2D
  NEW.boundary := ST_Multi(ST_Force2D(ST_SetSRID(NEW.boundary, 4326)));
  
  -- Calculate center point from boundary centroid
  NEW.center := ST_SetSRID(ST_Centroid(NEW.boundary), 4326);
  
  -- Calculate area in square meters using geography (accurate for Earth)
  NEW.area_sqm := ST_Area(NEW.boundary::geography);
  
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
```

### Step 4: Click "Run" or "Execute"

### Step 5: Verify It Worked
Run this query to check:

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trg_fields_compute';
```

You should see:
```
trigger_name        | table_name | function_name
--------------------+------------+------------------
trg_fields_compute  | fields     | compute_field_metrics
```

## ✅ Done!
Now try creating a field in your mobile app - it should work!

