'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const RecommendationController = require('../controllers/recommendation.controller');
const RecommendationEngineService = require('../../services/recommendationEngine.service');
const HealthMonitoringService = require('../../services/healthMonitoring.service');
const { getWeatherService } = require('../../services/weather.service');
const RecommendationRepository = require('../../repositories/recommendation.repository');
const HealthRepository = require('../../repositories/health.repository');
const FieldRepository = require('../../repositories/field.repository');
const Field = require('../../models/field.model');
const Recommendation = require('../../models/recommendation.model');
const { getNotificationService } = require('../../services/notification.service');

const router = express.Router();

// Initialize dependencies
const healthRepository = new HealthRepository();
const fieldRepository = new FieldRepository();
const notificationService = getNotificationService();
const recommendationRepository = new RecommendationRepository();

const healthMonitoringService = new HealthMonitoringService(
  healthRepository,
  fieldRepository,
  notificationService
);

const weatherService = getWeatherService();

const recommendationEngineService = new RecommendationEngineService(
  healthMonitoringService,
  weatherService,
  Field,
  Recommendation
);

const recommendationController = new RecommendationController(
  recommendationEngineService,
  recommendationRepository,
  Field
);

// Routes

/**
 * @route POST /api/v1/fields/:field_id/recommendations/generate
 * @desc Generate new recommendations for a field
 * @access Private
 */
router.post(
  '/fields/:field_id/recommendations/generate',
  authMiddleware,
  apiLimiter,
  (req, res, next) => recommendationController.generateRecommendations(req, res, next)
);

/**
 * @route GET /api/v1/fields/:field_id/recommendations
 * @desc Get all recommendations for a specific field
 * @access Private
 */
router.get('/fields/:field_id/recommendations', authMiddleware, apiLimiter, (req, res, next) =>
  recommendationController.getFieldRecommendations(req, res, next)
);

/**
 * @route GET /api/v1/recommendations
 * @desc Get all recommendations for the authenticated user
 * @access Private
 */
router.get('/recommendations', authMiddleware, apiLimiter, (req, res, next) =>
  recommendationController.getUserRecommendations(req, res, next)
);

/**
 * @route PATCH /api/v1/recommendations/:recommendationId/status
 * @desc Update recommendation status
 * @access Private
 */
router.patch(
  '/recommendations/:recommendationId/status',
  authMiddleware,
  apiLimiter,
  (req, res, next) => recommendationController.updateRecommendationStatus(req, res, next)
);

/**
 * @route DELETE /api/v1/recommendations/:recommendationId
 * @desc Delete a recommendation
 * @access Private
 */
router.delete('/recommendations/:recommendationId', authMiddleware, apiLimiter, (req, res, next) =>
  recommendationController.deleteRecommendation(req, res, next)
);

module.exports = router;
