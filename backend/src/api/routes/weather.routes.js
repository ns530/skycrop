'use strict';

const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const WeatherController = require('../controllers/weather.controller');

const router = express.Router();

const fieldQuery = Joi.object({
  field_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }).required(),
});

// All weather endpoints require authentication
router.use(authMiddleware);

// GET /api/v1/weather/current?field_id=UUID
router.get('/current', validateRequest(fieldQuery, 'query'), WeatherController.current);

// GET /api/v1/weather/forecast?field_id=UUID
router.get('/forecast', validateRequest(fieldQuery, 'query'), WeatherController.forecast);

module.exports = router;