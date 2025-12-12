#!/usr/bin/env node

const { Pool } = require('pg');

const { DATABASEURL, NODE_ENV = 'development' } = process.env;

async function verifyTrigger() {
  if (!DATABASEURL) {
    console.error('❌ DATABASEURL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASEURL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const result = await pool.query(`
      SELECT 
        tgname as triggername,
        tgrelid::regclass as tablename,
        proname as functionname
      FROM pgtrigger t
      JOIN pgproc p ON t.tgfoid = p.oid
      WHERE tgname = 'trgfieldscompute';
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
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifyTrigger };
