'use strict';

const { getWeatherService } = require('../../services/weather.service');
const { ValidationError } = require('../../errors/custom-errors');

const weatherService = getWeatherService();

/**
 * Weather Controller
 * - current: GET /api/v1/weather/current?field_id=UUID
 * - forecast: GET /api/v1/weather/forecast?field_id=UUID
 */
module.exports = {
  async current(req, res, next) {
    try {
      const userId = req.user.userId;
      const fieldId = req.query.field_id;
      if (!fieldId) {
        throw new ValidationError('field_id query parameter is required', { field: 'field_id' });
      }
      const result = await weatherService.getCurrentByField(userId, fieldId);
      return res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      return next(err);
    }
  },

  async forecast(req, res, next) {
    try {
      const userId = req.user.userId;
      const fieldId = req.query.field_id;
      if (!fieldId) {
        throw new ValidationError('field_id query parameter is required', { field: 'field_id' });
      }
      const result = await weatherService.getForecastByField(userId, fieldId);
      return res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      return next(err);
    }
  },
};