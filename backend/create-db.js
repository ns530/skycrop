const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASEURL,
    ssl: false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to postgres database');

    await client.query('CREATE DATABASE skycropdev;');
    console.log('✅ Database skycropdev created');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
