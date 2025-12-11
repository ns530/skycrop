'use strict';

const Sequelize = require('sequelize');
const FieldShare = require('../models/fieldShare.model');
const Field = require('../models/field.model');
const User = require('../models/user.model');

/**
 * Field Sharing Service
 * Handles field sharing and collaboration
 */
class FieldSharingService {
  /**
   * Share a field with another user
   * @param {string} field_id - Field UUID
   * @param {string} ownerId - Owner's user ID
   * @param {string} sharedWithEmail - Email of user to share with
   * @param {string} permissionLevel - 'view' or 'edit'
   * @param {Date} expiresAt - Optional expiration date
   * @returns {Promise<Object>} Created share
   */
  async shareField(field_id, ownerId, sharedWithEmail, permissionLevel = 'view', expiresAt = null) {
    // Verify field exists and user is owner
    const field = await Field.findByPk(field_id);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      error.code = 'FIELDNOTFOUND';
      throw error;
    }

    if (field.user_id !== ownerId) {
      const error = new Error('You do not own this field');
      error.statusCode = 403;
      error.code = 'NOTFIELDOWNER';
      throw error;
    }

    // Find user to share with
    const sharedWithUser = await User.findByEmail(sharedWithEmail);
    if (!sharedWithUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USERNOTFOUND';
      throw error;
    }

    // Can't share with yourself
    if (sharedWithUser.user_id === ownerId) {
      const error = new Error('Cannot share field with yourself');
      error.statusCode = 400;
      error.code = 'CANNOTSHAREWITHSELF';
      throw error;
    }

    // Check if already shared
    const existingShare = await FieldShare.findOne({
      where: {
        field_id: field_id,
        sharedwithuser_id: sharedWithUser.user_id,
      },
    });

    if (existingShare) {
      // Update existing share
      await existingShare.update({
        permissionlevel: permissionLevel,
        expiresat: expiresAt,
      });

      return this.formatShare(existingShare, field, sharedWithUser);
    }

    // Create new share
    const share = await FieldShare.create({
      field_id: field_id,
      ownerid: ownerId,
      sharedwithuser_id: sharedWithUser.user_id,
      permissionlevel: permissionLevel,
      expiresat: expiresAt,
    });

    return this.formatShare(share, field, sharedWithUser);
  }

  /**
   * Revoke field share
   * @param {string} field_id - Field UUID
   * @param {string} ownerId - Owner's user ID
   * @param {string} sharedWithuser_id - User ID to revoke access from
   * @returns {Promise<void>}
   */
  async revokeShare(field_id, ownerId, sharedWithuser_id) {
    // Verify field exists and user is owner
    const field = await Field.findByPk(field_id);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      error.code = 'FIELDNOTFOUND';
      throw error;
    }

    if (field.user_id !== ownerId) {
      const error = new Error('You do not own this field');
      error.statusCode = 403;
      error.code = 'NOTFIELDOWNER';
      throw error;
    }

    // Delete share
    const deleted = await FieldShare.destroy({
      where: {
        field_id: field_id,
        sharedwithuser_id: sharedWithuser_id,
      },
    });

    if (deleted === 0) {
      const error = new Error('Share not found');
      error.statusCode = 404;
      error.code = 'SHARENOTFOUND';
      throw error;
    }
  }

  /**
   * Get all users a field is shared with
   * @param {string} field_id - Field UUID
   * @param {string} ownerId - Owner's user ID
   * @returns {Promise<Array>} List of shares
   */
  async getFieldShares(field_id, ownerId) {
    // Verify field exists and user is owner
    const field = await Field.findByPk(field_id);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      error.code = 'FIELDNOTFOUND';
      throw error;
    }

    if (field.user_id !== ownerId) {
      const error = new Error('You do not own this field');
      error.statusCode = 403;
      error.code = 'NOTFIELDOWNER';
      throw error;
    }

    // Get all shares
    const shares = await FieldShare.findAll({
      where: { field_id: field_id },
      include: [
        {
          model: User,
          as: 'sharedWithUser',
          attributes: ['user_id', 'email', 'name', 'profilephotourl'],
        },
      ],
    });

    return shares.map(share => ({
      shareid: share.shareid,
      field_id: share.field_id,
      user: {
        user_id: share.sharedWithUser.user_id,
        email: share.sharedWithUser.email,
        name: share.sharedWithUser.name,
        profilephotourl: share.sharedWithUser.profilephotourl,
      },
      permissionlevel: share.permissionlevel,
      sharedat: share.sharedat,
      expiresat: share.expiresat,
    }));
  }

  /**
   * Get all fields shared with a user
   * @param {string} user_id - User ID
   * @returns {Promise<Array>} List of shared fields
   */
  async getSharedWithMe(user_id) {
    const shares = await FieldShare.findAll({
      where: {
        sharedwithuser_id: user_id,
        [Sequelize.Op.or]: [
          { expiresat: null },
          { expiresat: { [Sequelize.Op.gt]: new Date() } },
        ],
      },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['field_id', 'name', 'location', 'area', 'croptype', 'status'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['user_id', 'email', 'name', 'profilephotourl'],
        },
      ],
    });

    return shares.map(share => ({
      shareid: share.shareid,
      field: share.field,
      owner: share.owner,
      permissionlevel: share.permissionlevel,
      sharedat: share.sharedat,
      expiresat: share.expiresat,
    }));
  }

  /**
   * Check if user has access to a field
   * @param {string} field_id - Field UUID
   * @param {string} user_id - User ID
   * @returns {Promise<Object>} Access info { hasAccess, isOwner, permissionLevel }
   */
  async checkFieldAccess(field_id, user_id) {
    const field = await Field.findByPk(field_id);
    if (!field) {
      return { hasAccess: false, isOwner: false, permissionLevel: null };
    }

    // Check if owner
    if (field.user_id === user_id) {
      return { hasAccess: true, isOwner: true, permissionLevel: 'edit' };
    }

    // Check if shared
    const share = await FieldShare.findOne({
      where: {
        field_id: field_id,
        sharedwithuser_id: user_id,
        [Sequelize.Op.or]: [
          { expiresat: null },
          { expiresat: { [Sequelize.Op.gt]: new Date() } },
        ],
      },
    });

    if (share) {
      return {
        hasAccess: true,
        isOwner: false,
        permissionLevel: share.permissionlevel,
      };
    }

    return { hasAccess: false, isOwner: false, permissionLevel: null };
  }

  /**
   * Format share for response
   * @private
   */
  formatShare(share, field, sharedWithUser) {
    return {
      shareid: share.shareid,
      field: {
        field_id: field.field_id,
        name: field.name,
      },
      sharedwith: {
        user_id: sharedWithUser.user_id,
        email: sharedWithUser.email,
        name: sharedWithUser.name,
      },
      permissionlevel: share.permissionlevel,
      sharedat: share.sharedat,
      expiresat: share.expiresat,
    };
  }
}

// Export singleton
const fieldSharingService = new FieldSharingService();
module.exports = fieldSharingService;
