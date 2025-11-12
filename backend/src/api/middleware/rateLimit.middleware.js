'use strict';

const { initRedis, getRedisClient } = require('../../config/redis.config');

/**
 * Build a Redis-backed rate limiter middleware (token bucket via INCR/EXPIRE).
 *
 * Options:
 * - windowMs: number (milliseconds) - rolling window size
 * - max: number - max requests allowed within the window
 * - keyPrefix: string - prefix for redis keys
 * - keyGenerator: (req) => string - builds the unique identifier (e.g., userId or IP)
 * - onLimitExceeded: (req, res) => void - custom handler (optional)
 */
function createRateLimiter({
  windowMs,
  max,
  keyPrefix,
  keyGenerator,
  onLimitExceeded,
}) {
  const windowSec = Math.ceil(windowMs / 1000);

  return async function rateLimiter(req, res, next) {
    try {
      // Ensure Redis connection (lazy)
      const redis = getRedisClient();
      if (!redis.isOpen) {
        await initRedis();
      }

      const id = keyGenerator(req);
      const key = `${keyPrefix}:${id}`;

      // INCR and set EXPIRE on first increment
      const requests = await redis.incr(key);
      if (requests === 1) {
        await redis.expire(key, windowSec);
      }

      // If over the limit, respond 429
      if (requests > max) {
        if (typeof onLimitExceeded === 'function') {
          return onLimitExceeded(req, res);
        }

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              window_seconds: windowSec,
              limit: max,
            },
          },
          meta: { timestamp: new Date().toISOString() },
        });
      }

      // Continue
      return next();
    } catch (err) {
      // Fail-open on limiter errors
      return next();
    }
  };
}

/**
 * Default key generators
 */
function userOrIp(req) {
  // Prefer authenticated user id if available, else fall back to IP
  const userId = req.user?.userId || req.user?.user_id;
  return userId || req.ip || 'unknown';
}

function ipOnly(req) {
  return req.ip || 'unknown';
}

/**
 * General API limiter (per SRS: 1000 req/hour per user/IP)
 */
const apiLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  keyPrefix: 'rate-limit:api',
  keyGenerator: userOrIp,
});

/**
 * Strict Auth limiter (per SRS: protect auth endpoints)
 * Example: 5 requests / 15 minutes per IP
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyPrefix: 'rate-limit:auth',
  keyGenerator: ipOnly,
  onLimitExceeded: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message:
          'Too many authentication attempts. Please try again in 15 minutes.',
        details: { window_seconds: 15 * 60, limit: 5 },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  },
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
};