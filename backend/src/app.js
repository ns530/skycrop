'use strict';

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const authRoutes = require('./api/routes/auth.routes');
const fieldRoutes = require('./api/routes/field.routes');
const healthRoutes = require('./api/routes/health.routes');
const weatherRoutes = require('./api/routes/weather.routes');
const fieldHealthRoutes = require('./api/routes/fieldHealth.routes');
const satelliteRoutes = require('./api/routes/satellite.routes');
const mlRoutes = require('./api/routes/ml.routes');
const recommendationRoutes = require('./api/routes/recommendation.routes');
const dashboardRoutes = require('./api/routes/dashboard.routes');
const { apiLimiter } = require('./api/middleware/rateLimit.middleware');
const { logger, loggerStream } = require('./utils/logger');

const app = express();

// Trust first proxy (if behind load balancer in production)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Response compression
app.use(compression());

// HTTP request logging (disabled in tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: loggerStream }));
}

// Root
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SkyCrop API v1' });
});

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'skycrop-backend',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API routes
// General API rate limiting (applies to all /api/* routes)
app.use('/api', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/fields', fieldRoutes);
app.use('/api/v1/fields', healthRoutes);
app.use('/api/v1/fields', fieldHealthRoutes);
app.use('/api/v1/fields', recommendationRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/satellite', satelliteRoutes);
app.use('/api/v1/ml', mlRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Map payload-too-large errors from body parser to standard schema
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    err.statusCode = 413;
    err.code = 'PAYLOAD_TOO_LARGE';
    err.message = err.message || 'Request entity too large';
  }

  const status = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Structured error logging
  if (process.env.NODE_ENV !== 'test') {
    logger.error({
      error: err.message,
      stack: err.stack,
      code,
      status,
      user: req.user?.userId,
      endpoint: req.path,
      method: req.method,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      details: err.details || {},
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

module.exports = app;