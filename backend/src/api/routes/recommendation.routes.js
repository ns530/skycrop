'use strict';

const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const { validateRequest, schemas } = require('../middleware/validation.middleware');
const RecommendationController = require('../controllers/recommendation.controller');

const router = express.Router();

// Path params schema and reusable validator for :id
const uuidParam = Joi.object({
  id: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).required(),
});
const validateIdParam = (req, _res, next) => {
  const { error } = uuidParam.validate({ id: req.params.id });
  if (error) return next(error);
  return next();
};

// All recommendation endpoints require authentication and rate limit
router.use(authMiddleware);
router.use(apiLimiter);

// GET /api/v1/fields/:id/recommendations
router.get(
  '/:id/recommendations',
  validateIdParam,
  validateRequest(schemas.recommendationList, 'query'),
  RecommendationController.listForField
);

// POST /api/v1/fields/:id/recommendations/compute
router.post(
  '/:id/recommendations/compute',
  validateIdParam,
  validateRequest(schemas.recommendationCompute, 'body'),
  RecommendationController.computeForField
);

module.exports = router;