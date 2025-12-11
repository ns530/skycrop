#!/usr/bin/env node

'use strict';

/**
 * Check PostGIS Service Health
 * Tests if PostGIS is responding and accessible
 */

const { Pool } = require('pg');

const { DATABASEURL, DATABASEPRIVATEURL, NODEENV = 'development' } = process.env;

// Prefer private URL for internal connections (no SSL needed)
const DBCONNECTIONSTRING = DATABASEPRIVATEURL || DATABASEURL;

async function checkPostGISHealth() {
  if (!DBCONNECTIONSTRING) {
    console.error('❌ DATABASEURL or DATABASEPRIVATEURL not set');
    process.exit(1);
  }

  console.log('🔍 Checking PostGIS service health...\n');

  // Railway internal connections don't need SSL (handled at proxy level)
  // Disable SSL to avoid handshake errors
  const sslConfig = false;

  const pool = new Pool({
    connectionString: DBCONNECTIONSTRING,
    ssl: sslConfig,
    connectionTimeoutMillis: 15000, // Increased timeout
  });

  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await pool.query('SELECT NOW() as currenttime, version() as pgversion');
    console.log('   ✅ Connected successfully');
    console.log(`   📅 Server time: ${result.rows[0].currenttime}`);
    console.log(
      `   🗄️  PostgreSQL: ${result.rows[0].pgversion.split(' ')[0]} ${result.rows[0].pgversion.split(' ')[1]}\n`
    );

    // Test PostGIS extension
    console.log('2. Checking PostGIS extension...');
    const postgisCheck = await pool.query(`
      SELECT 
        PostGISversion() as postgisversion,
        PostGISfullversion() as fullversion
    `);
    console.log('   ✅ PostGIS is enabled');
    console.log(`   📍 PostGIS version: ${postgisCheck.rows[0].postgisversion}\n`);

    // Test database trigger
    console.log('3. Checking database trigger...');
    const triggerCheck = await pool.query(`
      SELECT 
        tgname as triggername,
        tgrelid::regclass as tablename,
        proname as functionname
      FROM pgtrigger t
      JOIN pgproc p ON t.tgfoid = p.oid
      WHERE tgname = 'trgfieldscompute'
    `);

    if (triggerCheck.rows.length > 0) {
      console.log('   ✅ computefieldmetrics trigger is active');
      console.log(`   🔧 Trigger: ${triggerCheck.rows[0].triggername}`);
      console.log(`   📊 Table: ${triggerCheck.rows[0].tablename}`);
      console.log(`   ⚙️  Function: ${triggerCheck.rows[0].functionname}\n`);
    } else {
      console.log('   ⚠️  Warning: computefieldmetrics trigger not found\n');
    }

    // Check database size and connections
    console.log('4. Checking database status...');
    const dbStatus = await pool.query(`
      SELECT 
        pgdatabase.datname,
        pgsizepretty(pgdatabasesize(pgdatabase.datname)) AS size,
        (SELECT count(*) FROM pgstatactivity WHERE datname = pgdatabase.datname) as connections
      FROM pgdatabase
      WHERE datname = currentdatabase()
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
  checkPostGISHealth().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { checkPostGISHealth };
