'use strict';

const express = require('express');
const Joi = require('joi');
const HealthController = require('../controllers/health.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const { validateRequest, schemas } = require('../middleware/validation.middleware');

const router = express.Router();

// Path params schema and reusable validator for :id
const uuidParam = Joi.object({
  id: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).required(),
});

const validateIdParam = (req, res, next) => {
  const { error } = uuidParam.validate({ id: req.params.id });
  if (error) return next(error);
  return next();
};

// History query schema: either days OR from/to range
const historyQuery = Joi.object({
  days: Joi.number().integer().min(1).max(365).optional(),
  from: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .message('from must be YYYY-MM-DD')
    .optional(),
  to: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .message('to must be YYYY-MM-DD')
    .optional(),
}).custom((value, helpers) => {
  // If from or to provided, accept range; else allow days
  const hasRange = !!(value.from || value.to);
  const hasDays = typeof value.days !== 'undefined';
  if (hasRange && hasDays) {
    return helpers.error('any.invalid', { message: 'Provide either days or from/to range, not both' });
  }
  return value;
}, 'mutual exclusivity validation');

// All health endpoints require authentication
router.use(authMiddleware);
// Apply API rate limiter similar to other modules
router.use(apiLimiter);

// GET /api/v1/fields/:id/health (Sprint 3: paginated list of snapshots)
router.get(
  '/:id/health',
  validateIdParam,
  validateRequest(schemas.healthList, 'query'),
  HealthController.listForField
);

// GET /api/v1/fields/:id/health/history
router.get(
  '/:id/health/history',
  validateIdParam,
  validateRequest(historyQuery, 'query'),
  HealthController.getHistory
);

// POST /api/v1/fields/:id/health/compute
router.post(
  '/:id/health/compute',
  validateIdParam,
  validateRequest(schemas.healthCompute),
  HealthController.computeForField
);

// POST /api/v1/fields/:id/health/refresh
router.post('/:id/health/refresh', validateIdParam, HealthController.refresh);

module.exports = router;