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
router.get('/', requireRole(['admin', 'manager']), userManagementController.getAllUsers);

/**
 * GET /api/v1/admin/users/stats
 * Get user statistics (admin only)
 */
router.get('/stats', requireRole('admin'), userManagementController.getUserStatistics);

/**
 * GET /api/v1/admin/users/search
 * Search users (admin/manager only)
 */
router.get('/search', requireRole(['admin', 'manager']), userManagementController.searchUsers);

/**
 * GET /api/v1/admin/users/roles
 * Get role hierarchy (all authenticated users)
 */
router.get('/roles', userManagementController.getRoles);

/**
 * GET /api/v1/admin/users/:user_id
 * Get user by ID (admin/manager only)
 */
router.get('/:user_id', requireRole(['admin', 'manager']), userManagementController.getUserById);

/**
 * PATCH /api/v1/admin/users/:user_id/role
 * Update user role (admin/manager only)
 */
router.patch(
  '/:user_id/role',
  requireRole(['admin', 'manager']),
  userManagementController.updateUserRole
);

/**
 * PATCH /api/v1/admin/users/:user_id/status
 * Update user status (admin/manager only)
 */
router.patch(
  '/:user_id/status',
  requireRole(['admin', 'manager']),
  userManagementController.updateUserStatus
);

module.exports = router;
