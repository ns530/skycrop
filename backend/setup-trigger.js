#!/usr/bin/env node
'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const { DATABASE_URL } = process.env;

async function setupTrigger() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Setting up field metrics trigger...');

    // Run the trigger setup SQL
    await pool.query(`
      -- Create or replace the trigger function
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

      -- Create trigger
      DROP TRIGGER IF EXISTS trg_fields_compute ON fields;
      CREATE TRIGGER trg_fields_compute
        BEFORE INSERT OR UPDATE OF boundary ON fields
        FOR EACH ROW
        EXECUTE FUNCTION compute_field_metrics();
    `);

    console.log('✅ Trigger setup completed successfully');
    console.log('🎉 Database trigger is ready!');

  } catch (error) {
    console.error('❌ Error setting up trigger:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  setupTrigger()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { setupTrigger };