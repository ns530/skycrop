const express = require('express');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const WeatherController = require('../controllers/weather.controller');

const router = express.Router();

const fieldQuery = Joi.object({
  field_id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] })
    .required(),
});

const coordsQuery = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
});

const forecastQuery = Joi.object({
  field_id: Joi.string().guid({ version: ['uuidv4', 'uuidv5', 'uuidv1'] }),
  lat: Joi.number().min(-90).max(90),
  lon: Joi.number().min(-180).max(180),
})
  .or('field_id', 'lat')
  .with('lat', 'lon');

// All weather endpoints require authentication
router.use(authMiddleware);

// GET /api/v1/weather/current?field_id=UUID
router.get('/current', validateRequest(fieldQuery, 'query'), WeatherController.current);

// GET /api/v1/weather/forecast?field_id=UUID or ?lat=LAT&lon=LON
router.get('/forecast', validateRequest(forecastQuery, 'query'), WeatherController.forecast);

// GET /api/v1/weather/alerts
router.get('/alerts', WeatherController.alerts);

module.exports = router;
