'use strict';

const jwt = require('jsonwebtoken');
const { getRedisClient, initRedis } = require('../../config/redis.config');
const { UnauthorizedError, ForbiddenError } = require('../../errors/custom-errors');

/**
 * Extract Bearer token from Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Auth middleware:
 * - Validates JWT
 * - Checks Redis blacklist
 * - Attaches req.user = { user_id, email, role }
 */
async function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('No authorization token provided');
    }

    // Ensure Redis connection (lazy)
    const redis = getRedisClient();
    if (!redis.isOpen) {
      await initRedis();
    }

    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token invalidated');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWTSECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role || 'farmer',
      token,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Require a specific role (e.g., 'admin').
 * Usage: app.get('/admin', authMiddleware, requireRole('admin'), handler)
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    if (req.user.role !== role) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    return next();
  };
}

/**
 * Allow any of provided roles.
 */
function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    return next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  requireAnyRole,
};
