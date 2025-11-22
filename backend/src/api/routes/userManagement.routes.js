'use strict';

const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagement.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole, requirePermission } = require('../middleware/permissions.middleware');

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * GET /api/v1/admin/users
 * Get all users (admin/manager only)
 */
router.get(
  '/',
  requireRole(['admin', 'manager']),
  userManagementController.getAllUsers
);

/**
 * GET /api/v1/admin/users/stats
 * Get user statistics (admin only)
 */
router.get(
  '/stats',
  requireRole('admin'),
  userManagementController.getUserStatistics
);

/**
 * GET /api/v1/admin/users/search
 * Search users (admin/manager only)
 */
router.get(
  '/search',
  requireRole(['admin', 'manager']),
  userManagementController.searchUsers
);

/**
 * GET /api/v1/admin/users/roles
 * Get role hierarchy (all authenticated users)
 */
router.get(
  '/roles',
  userManagementController.getRoles
);

/**
 * GET /api/v1/admin/users/:userId
 * Get user by ID (admin/manager only)
 */
router.get(
  '/:userId',
  requireRole(['admin', 'manager']),
  userManagementController.getUserById
);

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Update user role (admin/manager only)
 */
router.patch(
  '/:userId/role',
  requireRole(['admin', 'manager']),
  userManagementController.updateUserRole
);

/**
 * PATCH /api/v1/admin/users/:userId/status
 * Update user status (admin/manager only)
 */
router.patch(
  '/:userId/status',
  requireRole(['admin', 'manager']),
  userManagementController.updateUserStatus
);

module.exports = router;

