'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initDatabase } = require('./config/database.config');
const { logger } = require('./utils/logger');
const { runMigrations } = require('./scripts/migrate');
const { initializeJobs, startJobs, stopJobs } = require('./jobs');
const { initializeWebSocket } = require('./websocket/server');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

// Initialize WebSocket server
const io = initializeWebSocket(server);
logger.info('WebSocket server initialized');

// Graceful shutdown
function shutdown(signal) {
  logger.warn('[%s] received. Shutting down gracefully...', signal);
  
  // Stop scheduled jobs
  stopJobs();
  
  // Close WebSocket connections
  if (io) {
    logger.info('Closing WebSocket connections...');
    io.close(() => {
      logger.info('WebSocket server closed.');
    });
  }
  
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force exit if not closed in time
  setTimeout(() => {
    logger.error('Forcing shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function start() {
  try {
    // Wait a bit for PostGIS to be ready (especially after restart)
    const waitTime = process.env.DB_WAIT_TIME ? parseInt(process.env.DB_WAIT_TIME) : 10000;
    if (process.env.NODE_ENV === 'production') {
      logger.info(`Waiting ${waitTime}ms for database to be ready...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Run migrations BEFORE starting server (critical for Railway)
    logger.info('Running database migrations...');
    try {
      await runMigrations();
      logger.info('Migrations complete.');
    } catch (migrationErr) {
      // In production, migrations are critical - fail deployment if they don't work
      if (process.env.NODE_ENV === 'production') {
        logger.error('Migrations failed in production: %s', migrationErr.message);
        logger.error('Cannot start server without successful migrations');
        process.exit(1);
      } else {
        // In development, log warning but continue
        logger.warn('Migrations failed (non-critical in development): %s', migrationErr.message);
        logger.warn('Server will continue running. Migrations can be run manually later.');
      }
    }

    // Initialize database connection
    logger.info('Initializing database connection...');
    await initDatabase();
    logger.info('Database connection established.');

    // Start server after successful initialization
    server.listen(PORT, () => {
      logger.info('SkyCrop API listening on port %d', PORT);
    });

    // Initialize and start scheduled jobs
    logger.info('Initializing scheduled jobs...');
    initializeJobs();
    startJobs();
    logger.info('Scheduled jobs initialized and started');

  } catch (err) {
    logger.error('Initialization error: %s', err.message);
    // Exit on critical initialization failure
    process.exit(1);
  }
}

start();