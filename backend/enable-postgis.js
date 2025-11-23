// Quick script to enable PostGIS extension
const { Client } = require('pg');

async function enablePostGIS() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Enable PostGIS
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ PostGIS extension enabled');
    
    // Enable PostGIS Topology
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis_topology;');
    console.log('✅ PostGIS Topology extension enabled');
    
    // Verify PostGIS
    const result = await client.query('SELECT PostGIS_version();');
    console.log('✅ PostGIS version:', result.rows[0].postgis_version);
    
    console.log('\n🎉 PostGIS successfully enabled!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

enablePostGIS();

