'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initDatabase } = require('./config/database.config');
const { logger } = require('./utils/logger');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

// Graceful shutdown
function shutdown(signal) {
  logger.warn('[%s] received. Shutting down gracefully...', signal);
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
    await initDatabase();
  } catch (err) {
    logger.error('Database initialization failed: %s', err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    logger.info('SkyCrop API listening on port %d', PORT);
  });
}

start();