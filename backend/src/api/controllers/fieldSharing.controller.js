const fieldSharingService = require('../../services/fieldSharing.service');
const { logger } = require('../../utils/logger');

/**
 * Share a field with another user
 */
async function shareField(req, res, next) {
  try {
    const { field_id } = req.params;
    const { email, permissionLevel = 'view', expiresAt } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATIONERROR',
          message: 'Email is required',
        },
        meta: { timestamp: new Date().toISOString() },
      });
    }

    const share = await fieldSharingService.shareField(
      field_id,
      req.user.user_id,
      email,
      permissionLevel,
      expiresAt ? new Date(expiresAt) : null
    );

    logger.info('field.share.created', {
      user_id: req.user.user_id,
      field_id,
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
      user_id: req.user.user_id,
      field_id: req.params.field_id,
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
    const { field_id, user_id } = req.params;

    await fieldSharingService.revokeShare(field_id, req.user.user_id, user_id);

    logger.info('field.share.revoked', {
      ownerId: req.user.user_id,
      field_id,
      revokeduser_id: user_id,
    });

    res.json({
      success: true,
      message: 'Field share revoked successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.share.revoke.error', {
      ownerId: req.user.user_id,
      field_id: req.params.field_id,
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
    const { field_id } = req.params;

    const shares = await fieldSharingService.getFieldShares(field_id, req.user.user_id);

    logger.info('field.shares.list', {
      user_id: req.user.user_id,
      field_id,
      count: shares.length,
    });

    res.json({
      success: true,
      data: shares,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.shares.list.error', {
      user_id: req.user.user_id,
      field_id: req.params.field_id,
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
    const shares = await fieldSharingService.getSharedWithMe(req.user.user_id);

    logger.info('field.shared.list', {
      user_id: req.user.user_id,
      count: shares.length,
    });

    res.json({
      success: true,
      data: shares,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.shared.list.error', {
      user_id: req.user.user_id,
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
    const { field_id } = req.params;

    const access = await fieldSharingService.checkFieldAccess(field_id, req.user.user_id);

    res.json({
      success: true,
      data: access,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.access.check.error', {
      user_id: req.user.user_id,
      field_id: req.params.field_id,
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
