'use strict';

const FieldShare = require('../models/fieldShare.model');
const Field = require('../models/field.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');

/**
 * Field Sharing Service
 * Handles field sharing and collaboration
 */
class FieldSharingService {
  /**
   * Share a field with another user
   * @param {string} fieldId - Field UUID
   * @param {string} ownerId - Owner's user ID
   * @param {string} sharedWithEmail - Email of user to share with
   * @param {string} permissionLevel - 'view' or 'edit'
   * @param {Date} expiresAt - Optional expiration date
   * @returns {Promise<Object>} Created share
   */
  async shareField(fieldId, ownerId, sharedWithEmail, permissionLevel = 'view', expiresAt = null) {
    // Verify field exists and user is owner
    const field = await Field.findByPk(fieldId);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      error.code = 'FIELD_NOT_FOUND';
      throw error;
    }

    if (field.user_id !== ownerId) {
      const error = new Error('You do not own this field');
      error.statusCode = 403;
      error.code = 'NOT_FIELD_OWNER';
      throw error;
    }

    // Find user to share with
    const sharedWithUser = await User.findByEmail(sharedWithEmail);
    if (!sharedWithUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Can't share with yourself
    if (sharedWithUser.user_id === ownerId) {
      const error = new Error('Cannot share field with yourself');
      error.statusCode = 400;
      error.code = 'CANNOT_SHARE_WITH_SELF';
      throw error;
    }

    // Check if already shared
    const existingShare = await FieldShare.findOne({
      where: {
        field_id: fieldId,
        shared_with_user_id: sharedWithUser.user_id,
      },
    });

    if (existingShare) {
      // Update existing share
      await existingShare.update({
        permission_level: permissionLevel,
        expires_at: expiresAt,
      });

      return this._formatShare(existingShare, field, sharedWithUser);
    }

    // Create new share
    const share = await FieldShare.create({
      field_id: fieldId,
      owner_id: ownerId,
      shared_with_user_id: sharedWithUser.user_id,
      permission_level: permissionLevel,
      expires_at: expiresAt,
    });

    return this._formatShare(share, field, sharedWithUser);
  }

  /**
   * Revoke field share
   * @param {string} fieldId - Field UUID
   * @param {string} ownerId - Owner's user ID
   * @param {string} sharedWithUserId - User ID to revoke access from
   * @returns {Promise<void>}
   */
  async revokeShare(fieldId, ownerId, sharedWithUserId) {
    // Verify field exists and user is owner
    const field = await Field.findByPk(fieldId);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      error.code = 'FIELD_NOT_FOUND';
      throw error;
    }

    if (field.user_id !== ownerId) {
      const error = new Error('You do not own this field');
      error.statusCode = 403;
      error.code = 'NOT_FIELD_OWNER';
      throw error;
    }

    // Delete share
    const deleted = await FieldShare.destroy({
      where: {
        field_id: fieldId,
        shared_with_user_id: sharedWithUserId,
      },
    });

    if (deleted === 0) {
      const error = new Error('Share not found');
      error.statusCode = 404;
      error.code = 'SHARE_NOT_FOUND';
      throw error;
    }
  }

  /**
   * Get all users a field is shared with
   * @param {string} fieldId - Field UUID
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<Array>} List of shares
   */
  async getFieldShares(fieldId, ownerId) {
    // Verify field exists and user is owner
    const field = await Field.findByPk(fieldId);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      error.code = 'FIELD_NOT_FOUND';
      throw error;
    }

    if (field.user_id !== ownerId) {
      const error = new Error('You do not own this field');
      error.statusCode = 403;
      error.code = 'NOT_FIELD_OWNER';
      throw error;
    }

    // Get all shares
    const shares = await FieldShare.findAll({
      where: { field_id: fieldId },
      include: [
        {
          model: User,
          as: 'sharedWithUser',
          attributes: ['user_id', 'email', 'name', 'profile_photo_url'],
        },
      ],
    });

    return shares.map((share) => ({
      share_id: share.share_id,
      field_id: share.field_id,
      user: {
        user_id: share.sharedWithUser.user_id,
        email: share.sharedWithUser.email,
        name: share.sharedWithUser.name,
        profile_photo_url: share.sharedWithUser.profile_photo_url,
      },
      permission_level: share.permission_level,
      shared_at: share.shared_at,
      expires_at: share.expires_at,
    }));
  }

  /**
   * Get all fields shared with a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of shared fields
   */
  async getSharedWithMe(userId) {
    const shares = await FieldShare.findAll({
      where: {
        shared_with_user_id: userId,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } },
        ],
      },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['field_id', 'name', 'location', 'area', 'crop_type', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['user_id', 'email', 'name', 'profile_photo_url'],
        },
      ],
    });

    return shares.map((share) => ({
      share_id: share.share_id,
      field: share.field,
      owner: share.owner,
      permission_level: share.permission_level,
      shared_at: share.shared_at,
      expires_at: share.expires_at,
    }));
  }

  /**
   * Check if user has access to a field
   * @param {string} fieldId - Field UUID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Access info { hasAccess, isOwner, permissionLevel }
   */
  async checkFieldAccess(fieldId, userId) {
    const field = await Field.findByPk(fieldId);
    if (!field) {
      return { hasAccess: false, isOwner: false, permissionLevel: null };
    }

    // Check if owner
    if (field.user_id === userId) {
      return { hasAccess: true, isOwner: true, permissionLevel: 'edit' };
    }

    // Check if shared
    const share = await FieldShare.findOne({
      where: {
        field_id: fieldId,
        shared_with_user_id: userId,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } },
        ],
      },
    });

    if (share) {
      return {
        hasAccess: true,
        isOwner: false,
        permissionLevel: share.permission_level,
      };
    }

    return { hasAccess: false, isOwner: false, permissionLevel: null };
  }

  /**
   * Format share for response
   * @private
   */
  _formatShare(share, field, sharedWithUser) {
    return {
      share_id: share.share_id,
      field: {
        field_id: field.field_id,
        name: field.name,
      },
      shared_with: {
        user_id: sharedWithUser.user_id,
        email: sharedWithUser.email,
        name: sharedWithUser.name,
      },
      permission_level: share.permission_level,
      shared_at: share.shared_at,
      expires_at: share.expires_at,
    };
  }
}

// Export singleton
const fieldSharingService = new FieldSharingService();
module.exports = fieldSharingService;

