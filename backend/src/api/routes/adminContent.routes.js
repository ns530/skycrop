'use strict';

const express = require('express');

const router = express.Router();
const Joi = require('joi');
const adminContentController = require('../controllers/adminContent.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/permissions.middleware');
const { validateRequest } = require('../middleware/validation.middleware');

/**
 * All routes require authentication and admin role
 */
router.use(authMiddleware);
router.use(requireRole(['admin', 'manager']));

const contentQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(12),
  status: Joi.string().valid('draft', 'published').optional(),
  search: Joi.string().optional(),
});

const contentBody = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  summary: Joi.string().min(1).max(500).required(),
  body: Joi.string().min(1).required(),
  status: Joi.string().valid('draft', 'published').default('draft'),
  publishedat: Joi.date().optional(),
});

/**
 * GET /api/v1/admin/content
 * Get paginated list of content items
 */
router.get('/', validateRequest(contentQuery, 'query'), adminContentController.getContent);

/**
 * POST /api/v1/admin/content
 * Create new content item
 */
router.post('/', validateRequest(contentBody, 'body'), adminContentController.createContent);

/**
 * GET /api/v1/admin/content/:id
 * Get content item by ID
 */
router.get('/:id', adminContentController.getContentById);

/**
 * PUT /api/v1/admin/content/:id
 * Update content item
 */
router.put('/:id', validateRequest(contentBody, 'body'), adminContentController.updateContent);

/**
 * DELETE /api/v1/admin/content/:id
 * Delete content item
 */
router.delete('/:id', adminContentController.deleteContent);

module.exports = router;
