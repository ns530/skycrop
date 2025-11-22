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
    // Run migrations first
    logger.info('Running database migrations...');
    await runMigrations();
    logger.info('Migrations complete. Initializing database connection...');
    
    await initDatabase();

    // Initialize and start scheduled jobs
    logger.info('Initializing scheduled jobs...');
    initializeJobs();
    startJobs();
    logger.info('Scheduled jobs initialized and started');
  } catch (err) {
    logger.error('Initialization failed: %s', err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    logger.info('SkyCrop API listening on port %d', PORT);
  });
}

start();