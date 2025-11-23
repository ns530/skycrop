#!/usr/bin/env node
'use strict';

/**
 * Check PostGIS Service Health
 * Tests if PostGIS is responding and accessible
 */

const { Pool } = require('pg');

const { DATABASE_URL, NODE_ENV = 'development' } = process.env;

async function checkPostGISHealth() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  console.log('🔍 Checking PostGIS service health...\n');

  // Determine SSL requirement: external Railway URLs need SSL, internal don't
  const isInternal = DATABASE_URL.includes('.railway.internal') || DATABASE_URL.includes('postgis.railway.internal');
  const isExternal = DATABASE_URL.includes('rlwy.net') || DATABASE_URL.includes('railway.app') || DATABASE_URL.includes('gondola.proxy');
  
  // Only use SSL for external connections, not internal
  const sslConfig = (NODE_ENV === 'production' && isExternal && !isInternal)
    ? { rejectUnauthorized: false }
    : false;

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
    connectionTimeoutMillis: 10000, // Increased timeout
  });

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('   ✅ Connected successfully');
    console.log(`   📅 Server time: ${result.rows[0].current_time}`);
    console.log(`   🗄️  PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}\n`);

    // Test PostGIS extension
    console.log('2. Checking PostGIS extension...');
    const postgisCheck = await pool.query(`
      SELECT 
        PostGIS_version() as postgis_version,
        PostGIS_full_version() as full_version
    `);
    console.log('   ✅ PostGIS is enabled');
    console.log(`   📍 PostGIS version: ${postgisCheck.rows[0].postgis_version}\n`);

    // Test database trigger
    console.log('3. Checking database trigger...');
    const triggerCheck = await pool.query(`
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgname = 'trg_fields_compute'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('   ✅ compute_field_metrics trigger is active');
      console.log(`   🔧 Trigger: ${triggerCheck.rows[0].trigger_name}`);
      console.log(`   📊 Table: ${triggerCheck.rows[0].table_name}`);
      console.log(`   ⚙️  Function: ${triggerCheck.rows[0].function_name}\n`);
    } else {
      console.log('   ⚠️  Warning: compute_field_metrics trigger not found\n');
    }

    // Check database size and connections
    console.log('4. Checking database status...');
    const dbStatus = await pool.query(`
      SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) as connections
      FROM pg_database
      WHERE datname = current_database()
    `);
    console.log(`   💾 Database: ${dbStatus.rows[0].datname}`);
    console.log(`   📦 Size: ${dbStatus.rows[0].size}`);
    console.log(`   🔌 Active connections: ${dbStatus.rows[0].connections}\n`);

    console.log('✅ PostGIS service is healthy and operational!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ PostGIS health check failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}\n`);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('💡 PostGIS service appears to be down or unreachable.');
      console.error('   Action: Restart PostGIS service via Railway Dashboard\n');
    } else if (error.code === 'ECONNRESET') {
      console.error('💡 Connection was reset. PostGIS may be restarting.');
      console.error('   Action: Wait a few minutes and try again\n');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkPostGISHealth()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkPostGISHealth };

