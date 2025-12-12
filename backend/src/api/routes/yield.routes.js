const express = require('express');
const Joi = require('joi');
const YieldController = require('../controllers/yield.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * Yield Routes
 * Endpoints for managing actual yield data (farmer-entered harvest data)
 *
 * Routes:
 * - POST   /api/v1/fields/:field_id/yield          - Create yield entry
 * - GET    /api/v1/fields/:field_id/yield          - List yield entries for field
 * - GET    /api/v1/fields/:field_id/yield/statistics - Get yield statistics
 * - GET    /api/v1/yield/:yieldId                 - Get single yield entry
 * - PATCH  /api/v1/yield/:yieldId                 - Update yield entry
 * - DELETE /api/v1/yield/:yieldId                 - Delete yield entry
 */

// ========== Validation Schemas ==========

const uuidParam = Joi.object({
  field_id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .optional(),
  yieldId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .optional(),
}).unknown(true); // Allow other params

const validateUuidParams = (req, res, next) => {
  const params = {};
  if (req.params.field_id) params.field_id = req.params.field_id;
  if (req.params.yieldId) params.yieldId = req.params.yieldId;

  const { error } = uuidParam.validate(params);
  if (error) return next(error);
  return next();
};

const createYieldBody = Joi.object({
  actualyieldperha: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Actual yield per hectare must be a number',
    'number.positive': 'Actual yield per hectare must be positive',
    'any.required': 'Actual yield per hectare is required',
  }),
  totalyieldkg: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Total yield must be a number',
    'number.positive': 'Total yield must be positive',
    'any.required': 'Total yield is required',
  }),
  harvestdate: Joi.date().iso().max('now').required().messages({
    'date.base': 'Harvest date must be a valid date',
    'date.max': 'Harvest date cannot be in the future',
    'any.required': 'Harvest date is required',
  }),
  predictionid: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Prediction ID must be a valid UUID',
    }),
  predictedyieldperha: Joi.number().positive().precision(2).optional().allow(null).messages({
    'number.base': 'Predicted yield per hectare must be a number',
    'number.positive': 'Predicted yield per hectare must be positive',
  }),
  notes: Joi.string().max(1000).optional().allow(null, '').messages({
    'string.max': 'Notes cannot exceed 1000 characters',
  }),
  cropvariety: Joi.string().max(100).optional().allow(null, '').messages({
    'string.max': 'Crop variety cannot exceed 100 characters',
  }),
  season: Joi.string().valid('maha', 'yala', 'other').optional().allow(null).messages({
    'any.only': 'Season must be one of: maha, yala, other',
  }),
});

const updateYieldBody = Joi.object({
  actualyieldperha: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Actual yield per hectare must be a number',
    'number.positive': 'Actual yield per hectare must be positive',
  }),
  totalyieldkg: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Total yield must be a number',
    'number.positive': 'Total yield must be positive',
  }),
  harvestdate: Joi.date().iso().max('now').optional().messages({
    'date.base': 'Harvest date must be a valid date',
    'date.max': 'Harvest date cannot be in the future',
  }),
  predictedyieldperha: Joi.number().positive().precision(2).optional().allow(null).messages({
    'number.base': 'Predicted yield per hectare must be a number',
    'number.positive': 'Predicted yield per hectare must be positive',
  }),
  notes: Joi.string().max(1000).optional().allow(null, '').messages({
    'string.max': 'Notes cannot exceed 1000 characters',
  }),
  cropvariety: Joi.string().max(100).optional().allow(null, '').messages({
    'string.max': 'Crop variety cannot exceed 100 characters',
  }),
  season: Joi.string().valid('maha', 'yala', 'other').optional().allow(null).messages({
    'any.only': 'Season must be one of: maha, yala, other',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  pagesize: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Page size must be a number',
    'number.integer': 'Page size must be an integer',
    'number.min': 'Page size must be at least 1',
    'number.max': 'Page size cannot exceed 100',
  }),
  sort: Joi.string()
    .valid('harvestdate', 'actualyieldperha', 'createdat')
    .default('harvestdate')
    .messages({
      'any.only': 'Sort must be one of: harvestdate, actualyieldperha, createdat',
    }),
  order: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Order must be either asc or desc',
  }),
});

// ========== Validation Schemas for Predictions ==========

const predictYieldBody = Joi.object({
  plantingdate: Joi.date().iso().optional().messages({
    'date.base': 'Planting date must be a valid date',
  }),
  cropvariety: Joi.string().max(100).optional().messages({
    'string.max': 'Crop variety cannot exceed 100 characters',
  }),
  soiltype: Joi.string().max(50).optional().messages({
    'string.max': 'Soil type cannot exceed 50 characters',
  }),
  priceperkg: Joi.number().positive().optional().messages({
    'number.positive': 'Price per kg must be positive',
  }),
  modelversion: Joi.string().max(20).optional().messages({
    'string.max': 'Model version cannot exceed 20 characters',
  }),
});

const predictionsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100',
  }),
  sort: Joi.string()
    .valid('predictiondate', 'predictedyieldperha', 'createdat')
    .default('predictiondate')
    .messages({
      'any.only': 'Sort must be one of: predictiondate, predictedyieldperha, createdat',
    }),
  order: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Order must be either asc or desc',
  }),
});

// ========== Routes (All Protected) ==========

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(apiLimiter);

// Yield Prediction routes (must come before /fields/:field_id/yield routes)
router.post(
  '/fields/:field_id/yield/predict',
  validateUuidParams,
  validateRequest(predictYieldBody, 'body'),
  YieldController.predictYield
);

router.get(
  '/fields/:field_id/yield/predictions',
  validateUuidParams,
  validateRequest(predictionsQuery, 'query'),
  YieldController.getPredictions
);

// Field-specific yield routes
router.post(
  '/fields/:field_id/yield',
  validateUuidParams,
  validateRequest(createYieldBody, 'body'),
  YieldController.create
);

router.get(
  '/fields/:field_id/yield',
  validateUuidParams,
  validateRequest(listQuery, 'query'),
  YieldController.listByField
);

router.get('/fields/:field_id/yield/statistics', validateUuidParams, YieldController.getStatistics);

// Individual yield entry routes
router.get('/yield/:yieldId', validateUuidParams, YieldController.getById);

router.patch(
  '/yield/:yieldId',
  validateUuidParams,
  validateRequest(updateYieldBody, 'body'),
  YieldController.update
);

router.delete('/yield/:yieldId', validateUuidParams, YieldController.remove);

module.exports = router;
