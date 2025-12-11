'use strict';

/**
 * Debug Routes for Testing Error Tracking
 *
 * ⚠️ ONLY ENABLE IN DEVELOPMENT/STAGING
 */

const express = require('express');
const Sentry = require('@sentry/node');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Only enable debug routes in non-production environments
if (process.env.NODE_ENV !== 'production') {
  /**
   * GET /debug/sentry
   * Test Sentry error tracking by throwing an intentional error
   */
  router.get('/sentry', (req, res) => {
    logger.warn('Triggering test Sentry error via /debug/sentry');
    throw new Error('Test Sentry Error Tracking - This is intentional!');
  });

  /**
   * GET /debug/sentry-message
   * Test Sentry message capture
   */
  router.get('/sentry-message', (req, res) => {
    Sentry.captureMessage('Test Sentry Message - This is intentional!', 'info');
    res.status(200)on({
      success: true,
      message: 'Sentry message captured. Check your Sentry dashboard.',
    });
  });

  /**
   * GET /debug/sentry-exception
   * Test Sentry exception capture with context
   */
  router.get('/sentry-exception', (req, res) => {
    try {
      // Simulate a database error
      const error = new Error('Simulated Database Connection Error');
      error.code = 'DBCONNECTIONERROR';
      error.statusCode = 503;

      Sentry.captureException(error, {
        tags: {
          component: 'database',
          severity: 'high',
        },
        extra: {
          user_id: req.user?.user_id || 'anonymous',
          endpoint: req.originalUrl,
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    } catch (err) {
      res.status(503)on({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    }
  });

  /**
   * GET /debug/async-error
   * Test async error handling
   */
  router.get('/async-error', async (req, res, next) => {
    try {
      logger.warn('Triggering async error via /debug/async-error');
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Async Error - Simulated timeout'));
        }, 100);
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /debug/unhandled-rejection
   * Test unhandled promise rejection (should be caught by global handlers)
   */
  router.get('/unhandled-rejection', (req, res) => {
    logger.warn('Triggering unhandled rejection via /debug/unhandled-rejection');

    // This will be caught by process.on('unhandledRejection')
    Promise.reject(new Error('Unhandled Promise Rejection - Test'));

    res.status(200)on({
      success: true,
      message: 'Unhandled rejection triggered. Check logs and Sentry.',
    });
  });
} else {
  // In production, return 404 for all debug routes
  router.use((req, res) => {
    res.status(404)on({
      success: false,
      error: {
        code: 'NOTFOUND',
        message: 'Debug routes are disabled in production',
      },
    });
  });
}

module.exports = router;
