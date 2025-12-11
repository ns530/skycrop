// Quick script to enable PostGIS extension
require('dotenv').config();
const { Client } = require('pg');

async function enablePostGIS() {
  const client = new Client({
    connectionString: process.env.DATABASEURL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Enable PostGIS
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ PostGIS extension enabled');

    // Enable PostGIS Topology
    await client.query('CREATE EXTENSION IF NOT EXISTS postgistopology;');
    console.log('✅ PostGIS Topology extension enabled');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ UUID extension enabled');

    // Verify PostGIS
    const result = await client.query('SELECT PostGISversion();');
    console.log('✅ PostGIS version:', result.rows[0].postgisversion);

    console.log('\n🎉 PostGIS successfully enabled!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

enablePostGIS();
