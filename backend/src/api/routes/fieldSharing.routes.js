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
 * POST /api/v1/fields/:fieldId/share
 * Share a field with another user
 */
router.post('/:fieldId/share', fieldSharingController.shareField);

/**
 * DELETE /api/v1/fields/:fieldId/share/:userId
 * Revoke field share
 */
router.delete('/:fieldId/share/:userId', fieldSharingController.revokeShare);

/**
 * GET /api/v1/fields/:fieldId/shares
 * Get all shares for a field
 */
router.get('/:fieldId/shares', fieldSharingController.getFieldShares);

/**
 * GET /api/v1/fields/shared-with-me
 * Get all fields shared with current user
 */
router.get('/shared-with-me', fieldSharingController.getSharedWithMe);

/**
 * GET /api/v1/fields/:fieldId/access
 * Check if user has access to field
 */
router.get('/:fieldId/access', fieldSharingController.checkFieldAccess);

module.exports = router;

