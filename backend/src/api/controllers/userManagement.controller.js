'use strict';

const userManagementService = require('../../services/userManagement.service');
const { getRoleHierarchy } = require('../../config/permissions.config');
const { logger } = require('../../utils/logger');

/**
 * Get all users (admin/manager only)
 */
async function getAllUsers(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const result = await userManagementService.getAllUsers({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      role,
      status,
      search,
      sortBy,
      sortOrder,
    });

    logger.info('users.list.success', {
      userId: req.user.userId,
      count: result.users.length,
      total: result.pagination.total,
    });

    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('users.list.error', {
      userId: req.user.userId,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
}

/**
 * Get user by ID
 */
async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;

    const user = await userManagementService.getUserById(userId);

    logger.info('users.get.success', {
      actorId: req.user.userId,
      targetId: userId,
    });

    res.json({
      success: true,
      data: user,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('users.get.error', {
      actorId: req.user.userId,
      targetId: req.params.userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Update user role
 */
async function updateUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role is required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const updatedUser = await userManagementService.updateUserRole(
      req.user.userId,
      req.user.role,
      userId,
      role
    );

    logger.info('users.role.updated', {
      actorId: req.user.userId,
      targetId: userId,
      newRole: role,
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('users.role.error', {
      actorId: req.user.userId,
      targetId: req.params.userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Update user status
 */
async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const updatedUser = await userManagementService.updateUserStatus(
      req.user.userId,
      req.user.role,
      userId,
      status
    );

    logger.info('users.status.updated', {
      actorId: req.user.userId,
      targetId: userId,
      newStatus: status,
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User status updated successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('users.status.error', {
      actorId: req.user.userId,
      targetId: req.params.userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get user statistics
 */
async function getUserStatistics(req, res, next) {
  try {
    const stats = await userManagementService.getUserStatistics();

    logger.info('users.stats.success', {
      userId: req.user.userId,
    });

    res.json({
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('users.stats.error', {
      userId: req.user.userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Search users
 */
async function searchUsers(req, res, next) {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.json({
        success: true,
        data: [],
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const users = await userManagementService.searchUsers(q, parseInt(limit, 10));

    logger.info('users.search.success', {
      userId: req.user.userId,
      query: q,
      results: users.length,
    });

    res.json({
      success: true,
      data: users,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('users.search.error', {
      userId: req.user.userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get role hierarchy (for UI display)
 */
function getRoles(req, res) {
  const roles = getRoleHierarchy();

  logger.info('users.roles.success', {
    userId: req.user.userId,
  });

  res.json({
    success: true,
    data: roles,
    meta: { timestamp: new Date().toISOString() },
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  getUserStatistics,
  searchUsers,
  getRoles,
};

