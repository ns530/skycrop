#!/usr/bin/env node
'use strict';

const { Pool } = require('pg');

const { DATABASE_URL, NODE_ENV = 'development' } = process.env;

async function verifyTrigger() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const result = await pool.query(`
      SELECT 
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        proname as function_name
      FROM pg_trigger t
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE tgname = 'trg_fields_compute';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Trigger verified successfully!');
      console.log('');
      console.log('Trigger Details:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('');
      console.log('🎉 Database trigger is active and ready!');
    } else {
      console.error('❌ Trigger not found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error verifying trigger:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  verifyTrigger()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyTrigger };

