#!/usr/bin/env node
'use strict';

/**
 * Database migration script
 * Runs all SQL migrations in the database/migrations folder
 * Safe to run multiple times (idempotent)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const {
  DATABASE_URL,
  DATABASE_PRIVATE_URL, // Railway internal connection (no SSL needed)
  NODE_ENV = 'development',
} = process.env;

// Prefer private URL for internal connections (no SSL needed)
const DB_CONNECTION_STRING = DATABASE_PRIVATE_URL || DATABASE_URL;

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isConnectionError = error.code === 'ECONNRESET' || 
                                error.code === 'ECONNREFUSED' ||
                                error.message?.includes('Connection terminated') ||
                                error.message?.includes('Connection closed');
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`⚠️  Connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function runMigrations() {
  if (!DB_CONNECTION_STRING) {
    console.error('❌ DATABASE_URL or DATABASE_PRIVATE_URL not set. Cannot run migrations.');
    process.exit(1);
  }

  // Determine SSL requirement based on connection string
  // Railway internal connections (.railway.internal) don't need SSL
  // External connections (rlwy.net, railway.app, gondola.proxy) need SSL with rejectUnauthorized: false
  const isInternal = DB_CONNECTION_STRING.includes('.railway.internal') || DB_CONNECTION_STRING.includes('postgis.railway.internal');
  const isExternal = DB_CONNECTION_STRING.includes('rlwy.net') || DB_CONNECTION_STRING.includes('railway.app') || DB_CONNECTION_STRING.includes('gondola.proxy');

  // Use private URL (internal) - no SSL needed
  // If using external URL, use SSL with rejectUnauthorized: false
  let sslConfig = isExternal ? { rejectUnauthorized: false } : false;

  const pool = new Pool({
    connectionString: DB_CONNECTION_STRING,
    ssl: sslConfig,
    // Connection pool settings for resilience
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Increased timeout for startup
    // Retry connection on failure
    retry: {
      max: 3,
      match: [
        /ECONNRESET/,
        /ECONNREFUSED/,
        /Connection terminated/,
        /SSL connection/,
      ],
    },
  });

  try {
    console.log('🔍 Checking database connection...');
    await retryWithBackoff(async () => {
      await pool.query('SELECT NOW()');
    });
    console.log('✅ Database connected');

    // Check PostGIS availability (critical for spatial operations)
    console.log('🔍 Checking PostGIS availability...');
    try {
      const postgisResult = await retryWithBackoff(async () => {
        return await pool.query('SELECT PostGIS_version()');
      });
      console.log('✅ PostGIS available:', postgisResult.rows[0].postgis_version);
    } catch (postgisErr) {
      console.error('❌ PostGIS not available:', postgisErr.message);
      console.log('⚠️  Attempting to enable PostGIS...');
      try {
        await retryWithBackoff(async () => {
          await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        });
        console.log('✅ PostGIS enabled');
      } catch (enableErr) {
        console.error('❌ Failed to enable PostGIS:', enableErr.message);
        throw new Error('PostGIS is required but not available');
      }
    }

    // Read init.sql first
    const initSqlPath = path.join(__dirname, '../../database/init.sql');
    
    if (!fs.existsSync(initSqlPath)) {
      console.error(`❌ Migration file not found: ${initSqlPath}`);
      process.exit(1);
    }

    console.log('📋 Reading init.sql...');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    console.log('🚀 Running init.sql...');
    await retryWithBackoff(async () => {
      await pool.query(initSql);
    });
    console.log('✅ init.sql completed');

    // Run migration files in order
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Run in alphabetical order

      console.log(`📋 Found ${migrationFiles.length} migration files...`);
      
      for (const file of migrationFiles) {
        const migrationPath = path.join(migrationsDir, file);
        console.log(`🚀 Running migration: ${file}...`);
        
        try {
          const migrationSql = fs.readFileSync(migrationPath, 'utf8');
          await retryWithBackoff(async () => {
            await pool.query(migrationSql);
          });
          console.log(`✅ ${file} completed`);
        } catch (error) {
          // If error is about already existing, that's okay (idempotent)
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          )) {
            console.log(`ℹ️  ${file} - objects already exist (skipping)`);
          } else {
            throw error;
          }
        }
      }
    }

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

    // Verify critical triggers exist
    console.log('');
    console.log('🔍 Verifying critical triggers...');
    try {
      const triggerResult = await pool.query(`
        SELECT
          tgname as trigger_name,
          tgrelid::regclass as table_name,
          proname as function_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE tgname IN ('trg_fields_compute', 'trg_actual_yields_accuracy')
        ORDER BY tgname;
      `);

      if (triggerResult.rows.length >= 2) {
        console.log('✅ Critical triggers verified:');
        triggerResult.rows.forEach((row) => {
          console.log(`   - ${row.trigger_name} on ${row.table_name} -> ${row.function_name}`);
        });
      } else {
        console.warn('⚠️  Some triggers may be missing. Found:', triggerResult.rows.length);
        triggerResult.rows.forEach((row) => {
          console.log(`   - ${row.trigger_name}`);
        });
      }
    } catch (triggerErr) {
      console.warn('⚠️  Could not verify triggers:', triggerErr.message);
    }

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
      // Only exit if called directly (not as a module)
      // When called from server.js, let it handle the error
      if (require.main === module) {
        process.exit(1);
      } else {
        // Re-throw so server.js can handle it gracefully
        throw error;
      }
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

