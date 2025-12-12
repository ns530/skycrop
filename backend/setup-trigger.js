#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const { DATABASEURL } = process.env;

async function setupTrigger() {
  if (!DATABASEURL) {
    console.error('❌ DATABASEURL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASEURL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Setting up field metrics trigger...');

    // Run the trigger setup SQL
    await pool.query(`
      -- Create or replace the trigger function
      CREATE OR REPLACE FUNCTION computefieldmetrics()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Ensure geometry is valid, make valid if possible
        IF NOT STIsValid(NEW.boundary) THEN
          NEW.boundary := STMakeValid(NEW.boundary);
        END IF;

        -- Normalize to SRID 4326 and MultiPolygon, force 2D
        NEW.boundary := STMulti(STForce2D(STSetSRID(NEW.boundary, 4326)));

        -- Ensure the geometry is still valid after normalization
        IF NOT STIsValid(NEW.boundary) THEN
          RAISE EXCEPTION 'Geometry is invalid after normalization';
        END IF;

        -- Calculate center point from boundary centroid
        NEW.center := STSetSRID(STCentroid(NEW.boundary), 4326);

        -- Calculate area in square meters using geography (accurate for Earth)
        NEW.areasqm := STArea(NEW.boundary::geography);

        -- Ensure areasqm is reasonable (not zero or negative)
        IF NEW.areasqm <= 0 THEN
          RAISE EXCEPTION 'Calculated area is invalid: %', NEW.areasqm;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger
      DROP TRIGGER IF EXISTS trgfieldscompute ON fields;
      CREATE TRIGGER trgfieldscompute
        BEFORE INSERT OR UPDATE OF boundary ON fields
        FOR EACH ROW
        EXECUTE FUNCTION computefieldmetrics();
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
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { setupTrigger };
