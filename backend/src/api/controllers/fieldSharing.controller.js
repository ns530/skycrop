const fieldSharingService = require('../../services/fieldSharing.service');
const { logger } = require('../../utils/logger');

/**
 * Share a field with another user
 */
async function shareField(req, res, next) {
  const { user_id: userId } = req.user;
  const { field_id: fieldId } = req.params;
  try {
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
      fieldId,
      userId,
      email,
      permissionLevel,
      expiresAt ? new Date(expiresAt) : null
    );

    logger.info('field.share.created', {
      userId,
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
      userId,
      fieldId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Revoke field share
 */
async function revokeShare(req, res, next) {
  const { user_id: userId } = req.user;
  const { field_id: fieldId, user_id: userIdParam } = req.params;
  try {
    await fieldSharingService.revokeShare(fieldId, userId, userIdParam);

    logger.info('field.share.revoked', {
      ownerId: userId,
      fieldId,
      revokedUserId: userIdParam,
    });

    res.json({
      success: true,
      message: 'Field share revoked successfully',
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.share.revoke.error', {
      ownerId: userId,
      fieldId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get all shares for a field
 */
async function getFieldShares(req, res, next) {
  const { user_id: userId } = req.user;
  const { field_id: fieldId } = req.params;
  try {
    const shares = await fieldSharingService.getFieldShares(fieldId, userId);

    logger.info('field.shares.list', {
      userId,
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
      userId,
      fieldId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Get all fields shared with me
 */
async function getSharedWithMe(req, res, next) {
  const { user_id: userId } = req.user;
  try {
    const shares = await fieldSharingService.getSharedWithMe(userId);

    logger.info('field.shared.list', {
      userId,
      count: shares.length,
    });

    res.json({
      success: true,
      data: shares,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.shared.list.error', {
      userId,
      error: error.message,
    });
    next(error);
  }
}

/**
 * Check field access
 */
async function checkFieldAccess(req, res, next) {
  const { user_id: userId } = req.user;
  const { field_id: fieldId } = req.params;
  try {
    const access = await fieldSharingService.checkFieldAccess(fieldId, userId);

    res.json({
      success: true,
      data: access,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('field.access.check.error', {
      userId,
      fieldId,
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
