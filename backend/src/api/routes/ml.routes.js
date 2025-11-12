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
router.use((err, _req, _res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    err.statusCode = 413;
    err.code = 'PAYLOAD_TOO_LARGE';
    err.message = 'Request entity too large';
  }
  return next(err);
});

// POST /api/v1/ml/segmentation/predict
router.post('/segmentation/predict', validateRequest(schemas.mlPredict), MLController.predict);

module.exports = router;