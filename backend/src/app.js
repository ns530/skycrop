import * as Sentry from '@sentry/node';

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';

import authRoutes from './api/routes/auth.routes';
import fieldRoutes from './api/routes/field.routes';
import fieldSharingRoutes from './api/routes/fieldSharing.routes';
import healthRoutes from './api/routes/health.routes';
import weatherRoutes from './api/routes/weather.routes';
import fieldHealthRoutes from './api/routes/fieldHealth.routes';
import satelliteRoutes from './api/routes/satellite.routes';
import mlRoutes from './api/routes/ml.routes';
import recommendationRoutes from './api/routes/recommendation.routes';
import dashboardRoutes from './api/routes/dashboard.routes';
import yieldRoutes from './api/routes/yield.routes';
import jobsRoutes from './api/routes/jobs.routes';
import notificationRoutes from './api/routes/notification.routes';
import healthMonitoringRoutes from './api/routes/healthMonitoring.routes';
import userManagementRoutes from './api/routes/userManagement.routes'; // User management (admin)
import adminContentRoutes from './api/routes/adminContent.routes'; // Admin content management
import debugRoutes from './api/routes/debug.routes'; // Debug routes for testing

import { apiLimiter } from './api/middleware/rateLimit.middleware';
import { logger, loggerStream } from './utils/logger';

// ========== Sentry Error Tracking (Must be first!) ==========

// Initialize Sentry BEFORE importing anything else
if (process.env.SENTRYDSN && process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: process.env.SENTRYDSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
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

const app = express();

// ========== Sentry Request Handler (Must be first middleware!) ==========
if (process.env.SENTRYDSN && process.env.NODE_ENV !== 'test') {
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
    origin: process.env.CORSORIGIN || '*',
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
app.use('/api/v1/admin/content', adminContentRoutes); // Admin content management
app.use('/debug', debugRoutes); // Debug routes (development/staging only)

// 404 handler
app.use((req, res, _next) => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOTFOUND',
      message: 'Route not found',
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// ========== Sentry Error Handler (Must be before custom error handler!) ==========
if (process.env.SENTRYDSN && process.env.NODE_ENV !== 'test') {
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all errors except 404s
        if (error.statusCode === 404 || error.status === 404) {
          return false;
        }
        return true;
      },
    })
  );
}

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Map payload-too-large errors from body parser to standard schema
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    err.statusCode = 413;
    err.code = 'PAYLOADTOOLARGE';
    err.message = err.message || 'Request entity too large';
  }

  const status = err.statusCode || 500;
  const code = err.code || 'INTERNALERROR';

  // Structured error logging
  if (process.env.NODE_ENV !== 'test') {
    logger.error({
      error: err.message,
      stack: err.stack,
      code,
      status,
      user: req.user?.user_id,
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

export default app;
