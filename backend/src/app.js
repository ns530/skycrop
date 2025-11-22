'use strict';

// ========== Sentry Error Tracking (Must be first!) ==========
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Initialize Sentry BEFORE importing anything else
if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new ProfilingIntegration(),
    ],
    beforeSend(event, hint) {
      // Don't send test errors to Sentry
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      // Filter out 404 errors (not really errors)
      if (event.exception && hint.originalException) {
        const error = hint.originalException;
        if (error.statusCode === 404 || error.status === 404) {
          return null;
        }
      }
      return event;
    },
  });
}

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const authRoutes = require('./api/routes/auth.routes');
const fieldRoutes = require('./api/routes/field.routes');
const fieldSharingRoutes = require('./api/routes/fieldSharing.routes');
const healthRoutes = require('./api/routes/health.routes');
const weatherRoutes = require('./api/routes/weather.routes');
const fieldHealthRoutes = require('./api/routes/fieldHealth.routes');
const satelliteRoutes = require('./api/routes/satellite.routes');
const mlRoutes = require('./api/routes/ml.routes');
const recommendationRoutes = require('./api/routes/recommendation.routes');
const dashboardRoutes = require('./api/routes/dashboard.routes');
const yieldRoutes = require('./api/routes/yield.routes');
const jobsRoutes = require('./api/routes/jobs.routes');
const notificationRoutes = require('./api/routes/notification.routes');
const healthMonitoringRoutes = require('./api/routes/healthMonitoring.routes');
const userManagementRoutes = require('./api/routes/userManagement.routes'); // User management (admin)
const debugRoutes = require('./api/routes/debug.routes'); // Debug routes for testing
const { apiLimiter } = require('./api/middleware/rateLimit.middleware');
const { logger, loggerStream } = require('./utils/logger');

const app = express();

// ========== Sentry Request Handler (Must be first middleware!) ==========
if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

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
app.use('/api/v1/fields', fieldSharingRoutes); // Field sharing & collaboration
app.use('/api/v1/fields', healthRoutes);
app.use('/api/v1/fields', fieldHealthRoutes);
app.use('/api/v1', healthMonitoringRoutes); // Health monitoring time-series analysis
app.use('/api/v1', recommendationRoutes); // Recommendation engine (includes field-specific and general routes)
app.use('/api/v1/notifications', notificationRoutes); // Notification management
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/satellite', satelliteRoutes);
app.use('/api/v1/ml', mlRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1', yieldRoutes); // Yield routes (both /fields/:id/yield and /yield/:id)
app.use('/api/v1/admin/jobs', jobsRoutes); // Admin jobs management
app.use('/api/v1/admin/users', userManagementRoutes); // Admin user management
app.use('/debug', debugRoutes); // Debug routes (development/staging only)

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

// ========== Sentry Error Handler (Must be before custom error handler!) ==========
if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
  app.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors except 404s
      if (error.statusCode === 404 || error.status === 404) {
        return false;
      }
      return true;
    },
  }));
}

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