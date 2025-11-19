'use strict';

const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// Routes (all protected)
router.use(authMiddleware);
router.use(apiLimiter);

// GET /api/v1/dashboard/metrics
router.get('/metrics', DashboardController.getMetrics);

module.exports = router;