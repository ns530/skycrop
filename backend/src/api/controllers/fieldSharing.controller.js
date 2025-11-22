'use strict';

const fieldSharingService = require('../../services/fieldSharing.service');
const { logger } = require('../../utils/logger');

/**
 * Share a field with another user
 */
async function shareField(req, res, next) {
  try {
    const { fieldId } = req.params;
    const { email, permissionLevel = 'view', expiresAt } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const share = await fieldSharingService.shareField(
      fieldId,
      req.user.userId,
      email,
      permissionLevel,
      expiresAt ? new Date(expiresAt) : null
    );

    logger.info('field.share.created', {
      userId: req.user.userId,
      fieldId,
      sharedWith: email,
      permissionLevel,
    });

    res.status(201).json({
      success: true,
      data: share,
      message: 'Field shared successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.share.error', {
      userId: req.user.userId,
      fieldId: req.params.fieldId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Revoke field share
 */
async function revokeShare(req, res, next) {
  try {
    const { fieldId, userId } = req.params;

    await fieldSharingService.revokeShare(fieldId, req.user.userId, userId);

    logger.info('field.share.revoked', {
      ownerId: req.user.userId,
      fieldId,
      revokedUserId: userId,
    });

    res.json({
      success: true,
      message: 'Field share revoked successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.share.revoke.error', {
      ownerId: req.user.userId,
      fieldId: req.params.fieldId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get all shares for a field
 */
async function getFieldShares(req, res, next) {
  try {
    const { fieldId } = req.params;

    const shares = await fieldSharingService.getFieldShares(fieldId, req.user.userId);

    logger.info('field.shares.list', {
      userId: req.user.userId,
      fieldId,
      count: shares.length,
    });

    res.json({
      success: true,
      data: shares,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.shares.list.error', {
      userId: req.user.userId,
      fieldId: req.params.fieldId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get all fields shared with me
 */
async function getSharedWithMe(req, res, next) {
  try {
    const shares = await fieldSharingService.getSharedWithMe(req.user.userId);

    logger.info('field.shared.list', {
      userId: req.user.userId,
      count: shares.length,
    });

    res.json({
      success: true,
      data: shares,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.shared.list.error', {
      userId: req.user.userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Check field access
 */
async function checkFieldAccess(req, res, next) {
  try {
    const { fieldId } = req.params;

    const access = await fieldSharingService.checkFieldAccess(fieldId, req.user.userId);

    res.json({
      success: true,
      data: access,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.access.check.error', {
      userId: req.user.userId,
      fieldId: req.params.fieldId,
      error: error.message,
    });
    next(error);
  }
}

module.exports = {
  shareField,
  revokeShare,
  getFieldShares,
  getSharedWithMe,
  checkFieldAccess,
};

