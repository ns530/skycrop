'use strict';

const User = require('../models/user.model');
const Sequelize = require('sequelize');
const { canManageUser } = require('../config/permissions.config');

/**
 * User Management Service
 * Handles admin operations for user management
 */
class UserManagementService {
  /**
   * Get all users (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users list with pagination
   */
  async getAllUsers(options = {}) {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Sequelize.Op.or] = [
        { email: { [Sequelize.Op.iLike]: `%${search}%` } },
        { name: { [Sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    // Query users
    const { count, rows } = await User.scope('allStatuses').findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      attributes: {
        exclude: ['password_hash'], // Never expose password hash
      },
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get user by ID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    const user = await User.scope('allStatuses').findByPk(userId, {
      attributes: {
        exclude: ['password_hash'],
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  /**
   * Update user role
   * @param {string} actorUserId - ID of user performing action
   * @param {string} actorRole - Role of user performing action
   * @param {string} targetUserId - ID of user to update
   * @param {string} newRole - New role
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRole(actorUserId, actorRole, targetUserId, newRole) {
    // Validate role
    const validRoles = ['admin', 'manager', 'farmer', 'viewer'];
    if (!validRoles.includes(newRole)) {
      const error = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      error.statusCode = 400;
      error.code = 'INVALID_ROLE';
      throw error;
    }

    // Get target user
    const targetUser = await this.getUserById(targetUserId);

    // Can't change own role
    if (actorUserId === targetUserId) {
      const error = new Error('You cannot change your own role');
      error.statusCode = 403;
      error.code = 'CANNOT_CHANGE_OWN_ROLE';
      throw error;
    }

    // Check if actor can manage target user
    if (!canManageUser(actorRole, targetUser.role)) {
      const error = new Error('You do not have permission to manage this user');
      error.statusCode = 403;
      error.code = 'INSUFFICIENT_PERMISSIONS';
      throw error;
    }

    // Update role
    await targetUser.update({ role: newRole });

    return targetUser;
  }

  /**
   * Update user status (activate, suspend, delete)
   * @param {string} actorUserId - ID of user performing action
   * @param {string} actorRole - Role of user performing action
   * @param {string} targetUserId - ID of user to update
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Updated user
   */
  async updateUserStatus(actorUserId, actorRole, targetUserId, newStatus) {
    // Validate status
    const validStatuses = ['active', 'suspended', 'deleted'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS';
      throw error;
    }

    // Get target user
    const targetUser = await User.scope('allStatuses').findByPk(targetUserId, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!targetUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Can't change own status
    if (actorUserId === targetUserId) {
      const error = new Error('You cannot change your own status');
      error.statusCode = 403;
      error.code = 'CANNOT_CHANGE_OWN_STATUS';
      throw error;
    }

    // Check if actor can manage target user
    if (!canManageUser(actorRole, targetUser.role)) {
      const error = new Error('You do not have permission to manage this user');
      error.statusCode = 403;
      error.code = 'INSUFFICIENT_PERMISSIONS';
      throw error;
    }

    // Update status
    await targetUser.update({ status: newStatus });

    return targetUser;
  }

  /**
   * Get user statistics (dashboard)
   * @returns {Promise<Object>} User statistics
   */
  async getUserStatistics() {
    const [total, active, suspended, deleted, byRole] = await Promise.all([
      User.scope('allStatuses').count(),
      User.count({ where: { status: 'active' } }),
      User.scope('allStatuses').count({ where: { status: 'suspended' } }),
      User.scope('allStatuses').count({ where: { status: 'deleted' } }),
      User.scope('allStatuses').findAll({
        attributes: [
          'role',
          [User.sequelize.fn('COUNT', User.sequelize.col('user_id')), 'count'],
        ],
        group: ['role'],
        raw: true,
      }),
    ]);

    const roleStats = {};
    byRole.forEach((item) => {
      roleStats[item.role] = parseInt(item.count, 10);
    });

    return {
      total,
      byStatus: {
        active,
        suspended,
        deleted,
      },
      byRole: roleStats,
    };
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Matching users
   */
  async searchUsers(query, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await User.findAll({
      where: {
        [Sequelize.Op.or]: [
          { email: { [Sequelize.Op.iLike]: `%${query}%` } },
          { name: { [Sequelize.Op.iLike]: `%${query}%` } },
        ],
      },
      limit,
      attributes: ['user_id', 'email', 'name', 'role', 'profile_photo_url'],
      order: [['name', 'ASC']],
    });

    return users;
  }
}

// Export singleton
const userManagementService = new UserManagementService();
module.exports = userManagementService;

