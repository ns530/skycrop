const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to postgres database');

    await client.query('CREATE DATABASE skycrop_dev;');
    console.log('✅ Database skycrop_dev created');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();