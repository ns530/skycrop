'use strict';

const { hasPermission, canAccessResource } = require('../../config/permissions.config');
const { logger } = require('../../utils/logger');

/**
 * Middleware to check if user has required permission
 * Usage: requirePermission('fields.create')
 * @param {string} permission - Required permission string
 * @returns {Function} Express middleware
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('permissions.nouser', { permission, path: req.path });
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const userRole = req.user.role || 'viewer';

    if (!hasPermission(userRole, permission)) {
      logger.warn('permissions.denied', {
        user_id: req.user.user_id,
        role: userRole,
        permission,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
          details: { required: permission, userRole },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    logger.debug('permissions.granted', {
      user_id: req.user.user_id,
      role: userRole,
      permission,
      path: req.path,
    });

    next();
  };
}

/**
 * Middleware to check if user can access a specific resource
 * Checks both role permissions and resource ownership
 * Usage: requireResourceAccess('fields', 'read', (req) => req.field.user_id === req.user.user_id)
 * @param {string} resource - Resource type (fields, health, etc.)
 * @param {string} action - Action (read, create, update, delete)
 * @param {Function} isOwnerFn - Function to determine if user owns resource
 * @returns {Function} Express middleware
 */
function requireResourceAccess(resource, action, isOwnerFn) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const userRole = req.user.role || 'viewer';
    const isOwner = isOwnerFn ? isOwnerFn(req) : false;

    if (!canAccessResource(userRole, resource, action, isOwner)) {
      logger.warn('permissions.resourcedenied', {
        user_id: req.user.user_id,
        role: userRole,
        resource,
        action,
        isOwner,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          details: { resource, action, userRole },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    logger.debug('permissions.resourcegranted', {
      user_id: req.user.user_id,
      role: userRole,
      resource,
      action,
      isOwner,
      path: req.path,
    });

    next();
  };
}

/**
 * Middleware to require specific role(s)
 * Usage: requireRole('admin') or requireRole(['admin', 'manager'])
 * @param {string|string[]} allowedRoles - Role or array of roles
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const userRole = req.user.role || 'viewer';

    if (!roles.includes(userRole)) {
      logger.warn('permissions.roledenied', {
        user_id: req.user.user_id,
        role: userRole,
        required: roles,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role privileges',
          details: { required: roles, userRole },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    next();
  };
}

/**
 * Middleware to require any of the specified roles
 * Usage: requireAnyRole(['admin', 'manager'])
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
function requireAnyRole(roles) {
  return requireRole(roles);
}

/**
 * Middleware to attach user role to request
 * Should be used after authentication middleware
 */
function attachUserRole(req, res, next) {
  if (req.user && !req.user.role) {
    req.user.role = 'viewer'; // Default role
  }
  next();
}

module.exports = {
  requirePermission,
  requireResourceAccess,
  requireRole,
  requireAnyRole,
  attachUserRole,
};
