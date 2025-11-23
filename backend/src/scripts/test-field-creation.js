#!/usr/bin/env node
'use strict';

/**
 * Test field creation to verify trigger is working
 */

const { Pool } = require('pg');

const {
  DATABASE_URL,
  NODE_ENV = 'development',
} = process.env;

async function testFieldCreation() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🧪 Testing field creation with trigger...\n');

    // Get a test user_id
    const userResult = await pool.query('SELECT user_id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }
    const userId = userResult.rows[0].user_id;
    console.log(`✅ Using test user: ${userId}\n`);

    // Test boundary (small square in Sri Lanka)
    const testBoundary = {
      type: 'Polygon',
      coordinates: [[
        [80.0, 7.0],  // Southwest
        [80.01, 7.0], // Southeast
        [80.01, 7.01], // Northeast
        [80.0, 7.01],  // Northwest
        [80.0, 7.0],   // Close polygon
      ]],
    };

    console.log('📋 Test boundary:', JSON.stringify(testBoundary, null, 2));
    console.log('');

    // Try to insert directly using raw SQL (bypassing Sequelize)
    console.log('🚀 Inserting test field...');
    const insertResult = await pool.query(`
      INSERT INTO fields (user_id, name, boundary, area, status)
      VALUES (
        $1,
        'TEST_FIELD_' || NOW()::text,
        ST_SetSRID(ST_GeomFromGeoJSON($2::text), 4326),
        0.01,
        'active'
      )
      RETURNING field_id, area_sqm, ST_AsGeoJSON(center)::json as center;
    `, [userId, JSON.stringify(testBoundary)]);

    const field = insertResult.rows[0];
    
    console.log('✅ Field created successfully!');
    console.log(`   - Field ID: ${field.field_id}`);
    console.log(`   - Area (sqm): ${field.area_sqm}`);
    console.log(`   - Center: ${JSON.stringify(field.center)}\n`);

    if (!field.area_sqm || field.area_sqm === null) {
      console.error('❌ ERROR: area_sqm is NULL - trigger did not fire!');
      process.exit(1);
    }

    if (!field.center || field.center === null) {
      console.error('❌ ERROR: center is NULL - trigger did not fire!');
      process.exit(1);
    }

    // Clean up test field
    await pool.query('DELETE FROM fields WHERE field_id = $1', [field.field_id]);
    console.log('🧹 Test field cleaned up\n');

    console.log('✅ Trigger is working correctly!');
    console.log('💡 If mobile app still fails, check the boundary format being sent.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('notNull')) {
      console.error('\n🔍 The trigger might not be firing. Check:');
      console.error('   1. Trigger exists: SELECT * FROM pg_trigger WHERE tgname = \'trg_fields_compute\';');
      console.error('   2. Function exists: SELECT * FROM pg_proc WHERE proname = \'compute_field_metrics\';');
    }
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testFieldCreation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testFieldCreation };

