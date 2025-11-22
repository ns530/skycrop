'use strict';

const express = require('express');
const YieldController = require('../controllers/yield.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const Joi = require('joi');

const router = express.Router();

/**
 * Yield Routes
 * Endpoints for managing actual yield data (farmer-entered harvest data)
 * 
 * Routes:
 * - POST   /api/v1/fields/:fieldId/yield          - Create yield entry
 * - GET    /api/v1/fields/:fieldId/yield          - List yield entries for field
 * - GET    /api/v1/fields/:fieldId/yield/statistics - Get yield statistics
 * - GET    /api/v1/yield/:yieldId                 - Get single yield entry
 * - PATCH  /api/v1/yield/:yieldId                 - Update yield entry
 * - DELETE /api/v1/yield/:yieldId                 - Delete yield entry
 */

// ========== Validation Schemas ==========

const uuidParam = Joi.object({
  fieldId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).optional(),
  yieldId: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).optional(),
}).unknown(true); // Allow other params

const validateUuidParams = (req, res, next) => {
  const params = {};
  if (req.params.fieldId) params.fieldId = req.params.fieldId;
  if (req.params.yieldId) params.yieldId = req.params.yieldId;

  const { error } = uuidParam.validate(params);
  if (error) return next(error);
  return next();
};

const createYieldBody = Joi.object({
  actual_yield_per_ha: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Actual yield per hectare must be a number',
      'number.positive': 'Actual yield per hectare must be positive',
      'any.required': 'Actual yield per hectare is required',
    }),
  total_yield_kg: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Total yield must be a number',
      'number.positive': 'Total yield must be positive',
      'any.required': 'Total yield is required',
    }),
  harvest_date: Joi.date().iso().max('now').required()
    .messages({
      'date.base': 'Harvest date must be a valid date',
      'date.max': 'Harvest date cannot be in the future',
      'any.required': 'Harvest date is required',
    }),
  prediction_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).optional()
    .allow(null)
    .messages({
      'string.guid': 'Prediction ID must be a valid UUID',
    }),
  predicted_yield_per_ha: Joi.number().positive().precision(2).optional()
    .allow(null)
    .messages({
      'number.base': 'Predicted yield per hectare must be a number',
      'number.positive': 'Predicted yield per hectare must be positive',
    }),
  notes: Joi.string().max(1000).optional()
    .allow(null, '')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters',
    }),
  crop_variety: Joi.string().max(100).optional()
    .allow(null, '')
    .messages({
      'string.max': 'Crop variety cannot exceed 100 characters',
    }),
  season: Joi.string().valid('maha', 'yala', 'other').optional()
    .allow(null)
    .messages({
      'any.only': 'Season must be one of: maha, yala, other',
    }),
});

const updateYieldBody = Joi.object({
  actual_yield_per_ha: Joi.number().positive().precision(2).optional()
    .messages({
      'number.base': 'Actual yield per hectare must be a number',
      'number.positive': 'Actual yield per hectare must be positive',
    }),
  total_yield_kg: Joi.number().positive().precision(2).optional()
    .messages({
      'number.base': 'Total yield must be a number',
      'number.positive': 'Total yield must be positive',
    }),
  harvest_date: Joi.date().iso().max('now').optional()
    .messages({
      'date.base': 'Harvest date must be a valid date',
      'date.max': 'Harvest date cannot be in the future',
    }),
  predicted_yield_per_ha: Joi.number().positive().precision(2).optional()
    .allow(null)
    .messages({
      'number.base': 'Predicted yield per hectare must be a number',
      'number.positive': 'Predicted yield per hectare must be positive',
    }),
  notes: Joi.string().max(1000).optional()
    .allow(null, '')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters',
    }),
  crop_variety: Joi.string().max(100).optional()
    .allow(null, '')
    .messages({
      'string.max': 'Crop variety cannot exceed 100 characters',
    }),
  season: Joi.string().valid('maha', 'yala', 'other').optional()
    .allow(null)
    .messages({
      'any.only': 'Season must be one of: maha, yala, other',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
  page_size: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Page size must be a number',
      'number.integer': 'Page size must be an integer',
      'number.min': 'Page size must be at least 1',
      'number.max': 'Page size cannot exceed 100',
    }),
  sort: Joi.string().valid('harvest_date', 'actual_yield_per_ha', 'created_at').default('harvest_date')
    .messages({
      'any.only': 'Sort must be one of: harvest_date, actual_yield_per_ha, created_at',
    }),
  order: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'any.only': 'Order must be either asc or desc',
    }),
});

// ========== Validation Schemas for Predictions ==========

const predictYieldBody = Joi.object({
  planting_date: Joi.date().iso().optional()
    .messages({
      'date.base': 'Planting date must be a valid date',
    }),
  crop_variety: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Crop variety cannot exceed 100 characters',
    }),
  soil_type: Joi.string().max(50).optional()
    .messages({
      'string.max': 'Soil type cannot exceed 50 characters',
    }),
  price_per_kg: Joi.number().positive().optional()
    .messages({
      'number.positive': 'Price per kg must be positive',
    }),
  model_version: Joi.string().max(20).optional()
    .messages({
      'string.max': 'Model version cannot exceed 20 characters',
    }),
});

const predictionsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  sort: Joi.string().valid('prediction_date', 'predicted_yield_per_ha', 'created_at').default('prediction_date')
    .messages({
      'any.only': 'Sort must be one of: prediction_date, predicted_yield_per_ha, created_at',
    }),
  order: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'any.only': 'Order must be either asc or desc',
    }),
});

// ========== Routes (All Protected) ==========

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(apiLimiter);

// Yield Prediction routes (must come before /fields/:fieldId/yield routes)
router.post(
  '/fields/:fieldId/yield/predict',
  validateUuidParams,
  validateRequest(predictYieldBody, 'body'),
  YieldController.predictYield
);

router.get(
  '/fields/:fieldId/yield/predictions',
  validateUuidParams,
  validateRequest(predictionsQuery, 'query'),
  YieldController.getPredictions
);

// Field-specific yield routes
router.post(
  '/fields/:fieldId/yield',
  validateUuidParams,
  validateRequest(createYieldBody, 'body'),
  YieldController.create
);

router.get(
  '/fields/:fieldId/yield',
  validateUuidParams,
  validateRequest(listQuery, 'query'),
  YieldController.listByField
);

router.get(
  '/fields/:fieldId/yield/statistics',
  validateUuidParams,
  YieldController.getStatistics
);

// Individual yield entry routes
router.get(
  '/yield/:yieldId',
  validateUuidParams,
  YieldController.getById
);

router.patch(
  '/yield/:yieldId',
  validateUuidParams,
  validateRequest(updateYieldBody, 'body'),
  YieldController.update
);

router.delete(
  '/yield/:yieldId',
  validateUuidParams,
  YieldController.remove
);

module.exports = router;

