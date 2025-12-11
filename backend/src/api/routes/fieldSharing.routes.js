'use strict';

const express = require('express');

const router = express.Router();
const fieldSharingController = require('../controllers/fieldSharing.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/v1/fields/:field_id/share
 * Share a field with another user
 */
router.post('/:field_id/share', fieldSharingController.shareField);

/**
 * DELETE /api/v1/fields/:field_id/share/:user_id
 * Revoke field share
 */
router.delete('/:field_id/share/:user_id', fieldSharingController.revokeShare);

/**
 * GET /api/v1/fields/:field_id/shares
 * Get all shares for a field
 */
router.get('/:field_id/shares', fieldSharingController.getFieldShares);

/**
 * GET /api/v1/fields/shared-with-me
 * Get all fields shared with current user
 */
router.get('/shared-with-me', fieldSharingController.getSharedWithMe);

/**
 * GET /api/v1/fields/:field_id/access
 * Check if user has access to field
 */
router.get('/:field_id/access', fieldSharingController.checkFieldAccess);

module.exports = router;
