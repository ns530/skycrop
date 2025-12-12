'use strict';

const express = require('express');
const MLController = require('../controllers/ml.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const { validateRequest, schemas } = require('../middleware/validation.middleware');

const router = express.Router();

// Protect all ML routes
router.use(authMiddleware);
router.use(apiLimiter);

// Increase JSON body size limit to 10 MB for ML payloads
router.use(express.json({ limit: '10mb' }));

// Map payload-too-large to API error schema via global handler
// Express will pass errors from body parser to this error handler
// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    err.statusCode = 413;
    err.code = 'PAYLOADTOOLARGE';
    err.message = 'Request entity too large';
  }
  return next(err);
});

// POST /api/v1/ml/segmentation/predict
router.post('/segmentation/predict', validateRequest(schemas.mlPredict), MLController.predict);

// POST /api/v1/ml/yield/predict
router.post('/yield/predict', validateRequest(schemas.yieldPredict), MLController.yieldPredict);

module.exports = router;
