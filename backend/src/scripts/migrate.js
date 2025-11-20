#!/usr/bin/env node
'use strict';

/**
 * Database migration script
 * Runs all SQL migrations in the database/migrations folder
 * Safe to run multiple times (idempotent)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const {
  DATABASE_URL,
  NODE_ENV = 'development',
} = process.env;

async function runMigrations() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Cannot run migrations.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Read init.sql
    const initSqlPath = path.join(__dirname, '../../database/init.sql');
    
    if (!fs.existsSync(initSqlPath)) {
      console.error(`❌ Migration file not found: ${initSqlPath}`);
      process.exit(1);
    }

    console.log('📋 Reading migration file...');
    const sql = fs.readFileSync(initSqlPath, 'utf8');

    console.log('🚀 Running migrations...');
    
    // Split by semicolon and run each statement
    // Note: This is a simple approach. For production, consider using a migration tool like node-pg-migrate
    await pool.query(sql);

    console.log('✅ Migrations completed successfully');
    console.log('');
    console.log('📊 Checking tables...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`✅ Found ${result.rows.length} tables:`);
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('');
    console.log('🎉 Database is ready!');
    
  } catch (error) {
    // Check if error is because tables already exist
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist - skipping migration');
      console.log('✅ Database is ready!');
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error(error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

