'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const HealthMonitoringController = require('../controllers/healthMonitoring.controller');
const HealthMonitoringService = require('../../services/healthMonitoring.service');

// Import models
const HealthRecord = require('../../models/health.model');
const Field = require('../../models/field.model');

const router = express.Router();

// Dependency injection
const healthMonitoringService = new HealthMonitoringService(HealthRecord, Field);
const healthMonitoringController = new HealthMonitoringController(healthMonitoringService, Field);

/**
 * @route GET /api/v1/fields/:field_id/health/history
 * @desc Get field health history with time-series analysis
 * @access Private
 */
router.get('/fields/:field_id/health/history', authMiddleware, (req, res, next) =>
  healthMonitoringController.getFieldHealthHistory(req, res, next)
);

module.exports = router;
