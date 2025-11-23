'use strict';

const { Sequelize } = require('sequelize');

const {
  DATABASE_URL,
  DATABASE_PRIVATE_URL, // Railway internal connection (no SSL needed)
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

// Prefer private URL for internal connections (no SSL needed)
const DB_CONNECTION_STRING = DATABASE_PRIVATE_URL || DATABASE_URL;

// Create Sequelize instance
// Prefer DATABASE_URL (Railway/Cloud) over individual variables (local dev)
let sequelize;

if (DB_CONNECTION_STRING) {
  // Cloud deployment (Railway, Heroku, etc.) - use connection string
  // Railway internal connections don't need SSL (handled at proxy level)
  // Disable SSL to avoid handshake errors during PostGIS startup
  const sslConfig = false; // No SSL needed for Railway internal connections

  sequelize = new Sequelize(DB_CONNECTION_STRING, {
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