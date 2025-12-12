const { Sequelize } = require('sequelize');

const {
  DATABASEURL,
  DATABASEPRIVATEURL, // Railway internal connection (no SSL needed)
  DBHOST = 'localhost',
  DBPORT = '5432',
  DBNAME = 'skycropdev',
  DBUSER = 'skycropuser',
  DBPASSWORD = 'skycroppass',
  DBSSL = 'false',
  DBPOOLMAX = '20',
  DBPOOLMIN = '2',
  DBPOOLIDLE = '10000',
  DBPOOLACQUIRE = '30000',
  NODE_ENV = 'development',
} = process.env;

// Prefer private URL for internal connections (no SSL needed)
const DBCONNECTIONSTRING = DATABASEPRIVATEURL || DATABASEURL;

// Create Sequelize instance
// Prefer DATABASEURL (Railway/Cloud) over individual variables (local dev)
let sequelize;

if (DBCONNECTIONSTRING) {
  // Cloud deployment (Railway, Heroku, etc.) - use connection string
  // Railway internal connections don't need SSL (handled at proxy level)
  // Disable SSL to avoid handshake errors during PostGIS startup
  const sslConfig = false; // No SSL needed for Railway internal connections

  sequelize = new Sequelize(DBCONNECTIONSTRING, {
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: Number(DBPOOLMAX),
      min: Number(DBPOOLMIN),
      idle: Number(DBPOOLIDLE),
      acquire: Number(DBPOOLACQUIRE),
    },
    dialectOptions: {
      ssl: sslConfig,
    },
    define: {
      // Align timestamps with our schema (createdat, updatedat)
      underscored: true,
      freezeTableName: true,
    },
  });
} else {
  // Local development - use individual variables
  const dialectOptions = {};
  if (DBSSL === 'true') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false,
    };
  }

  sequelize = new Sequelize(DBNAME, DBUSER, DBPASSWORD, {
    host: DBHOST,
    port: Number(DBPORT),
    dialect: 'postgres',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: Number(DBPOOLMAX),
      min: Number(DBPOOLMIN),
      idle: Number(DBPOOLIDLE),
      acquire: Number(DBPOOLACQUIRE),
    },
    dialectOptions,
    define: {
      // Align timestamps with our schema (createdat, updatedat)
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
