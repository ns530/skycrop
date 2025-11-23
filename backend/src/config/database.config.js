'use strict';

const { Sequelize } = require('sequelize');

const {
  DATABASE_URL,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'skycrop_dev',
  DB_USER = 'skycrop_user',
  DB_PASSWORD = 'skycrop_pass',
  DB_SSL = 'false',
  DB_POOL_MAX = '20',
  DB_POOL_MIN = '2',
  DB_POOL_IDLE = '10000',
  DB_POOL_ACQUIRE = '30000',
  NODE_ENV = 'development',
} = process.env;

// Create Sequelize instance
// Prefer DATABASE_URL (Railway/Cloud) over individual variables (local dev)
let sequelize;

if (DATABASE_URL) {
  // Cloud deployment (Railway, Heroku, etc.) - use DATABASE_URL
  // Determine SSL requirement: external Railway URLs need SSL, internal don't
  const needsSSL = DATABASE_URL.includes('rlwy.net') || DATABASE_URL.includes('railway.app');
  const sslConfig = NODE_ENV === 'production' && needsSSL
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false;

  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: Number(DB_POOL_MAX),
      min: Number(DB_POOL_MIN),
      idle: Number(DB_POOL_IDLE),
      acquire: Number(DB_POOL_ACQUIRE),
    },
    dialectOptions: {
      ssl: sslConfig,
    },
    define: {
      // Align timestamps with our schema (created_at, updated_at)
      underscored: true,
      freezeTableName: true,
    },
  });
} else {
  // Local development - use individual variables
  const dialectOptions = {};
  if (DB_SSL === 'true') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false,
    };
  }

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: Number(DB_POOL_MAX),
      min: Number(DB_POOL_MIN),
      idle: Number(DB_POOL_IDLE),
      acquire: Number(DB_POOL_ACQUIRE),
    },
    dialectOptions,
    define: {
      // Align timestamps with our schema (created_at, updated_at)
      underscored: true,
      freezeTableName: true,
    },
  });
}

/**
 * Initialize and verify DB connection.
 * Does not sync models; migrations or explicit sync should be triggered elsewhere.
 */
async function initDatabase() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log('Database connection established successfully.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unable to connect to the database:', err.message);
    throw err;
  }
}

module.exports = {
  sequelize,
  initDatabase,
};