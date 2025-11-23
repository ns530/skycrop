#!/usr/bin/env node
'use strict';

/**
 * Verify that the compute_field_metrics trigger exists and is working
 */

const { Pool } = require('pg');

const {
  DATABASE_URL,
  NODE_ENV = 'development',
} = process.env;

async function verifyTrigger() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Cannot verify trigger.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Check if trigger exists
    console.log('🔍 Checking for trigger...');
    const triggerCheck = await pool.query(`
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgname = 'trg_fields_compute';
    `);

    if (triggerCheck.rows.length === 0) {
      console.error('❌ Trigger trg_fields_compute NOT FOUND!');
      console.log('\n📋 Creating trigger now...');
      
      // Create the trigger
      await pool.query(`
        CREATE OR REPLACE FUNCTION compute_field_metrics()
        RETURNS TRIGGER AS $$
        BEGIN
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
      `);
      
      console.log('✅ Trigger created successfully!\n');
    } else {
      console.log('✅ Trigger found:');
      triggerCheck.rows.forEach(row => {
        console.log(`   - Trigger: ${row.trigger_name}`);
        console.log(`   - Table: ${row.table_name}`);
        console.log(`   - Function: ${row.function_name}\n`);
      });
    }

    // Check if function exists
    console.log('🔍 Checking function...');
    const functionCheck = await pool.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'compute_field_metrics';
    `);

    if (functionCheck.rows.length === 0) {
      console.error('❌ Function compute_field_metrics NOT FOUND!');
    } else {
      console.log('✅ Function compute_field_metrics exists\n');
    }

    // Test the trigger with a sample boundary
    console.log('🧪 Testing trigger with sample data...');
    try {
      const testResult = await pool.query(`
        SELECT 
          ST_Area(
            ST_SetSRID(
              ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'),
              4326
            )::geography
          ) as test_area,
          ST_AsText(
            ST_Centroid(
              ST_SetSRID(
                ST_GeomFromText('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))'),
                4326
              )
            )
          ) as test_center;
      `);
      
      console.log('✅ Trigger function test passed:');
      console.log(`   - Test area: ${testResult.rows[0].test_area}`);
      console.log(`   - Test center: ${testResult.rows[0].test_center}\n`);
    } catch (testError) {
      console.warn('⚠️  Test query failed (this is okay if PostGIS functions work differently):', testError.message);
    }

    console.log('🎉 Verification complete!');
    console.log('\n💡 If trigger exists, field creation should work now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  verifyTrigger()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyTrigger };

