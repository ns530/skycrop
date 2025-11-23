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
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Cannot run migrations.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Connection pool settings for resilience
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // Retry connection on failure
    retry: {
      max: 3,
      match: [
        /ECONNRESET/,
        /ECONNREFUSED/,
        /Connection terminated/,
      ],
    },
  });

  try {
    console.log('🔍 Checking database connection...');
    await retryWithBackoff(async () => {
      await pool.query('SELECT NOW()');
    });
    console.log('✅ Database connected');

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

