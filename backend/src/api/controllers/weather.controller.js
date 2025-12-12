import { getWeatherService } from '../../services/weather.service';
import { ValidationError } from '../../errors/custom-errors';

const weatherService = getWeatherService();

/**
 * Weather Controller
 * - current: GET /api/v1/weather/current?field_id=UUID
 * - forecast: GET /api/v1/weather/forecast?field_id=UUID
 */
export default {
  async current(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const { field_id: fieldId } = req.query;
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
      const { user_id: userId } = req.user;
      const { field_id: fieldId, lat, lon } = req.query;

      let result;
      if (fieldId) {
        // Use existing field-based method
        result = await weatherService.getForecastByField(userId, fieldId);
      } else if (lat && lon) {
        // Use new coordinates-based method
        result = await weatherService.getForecastByCoords(Number(lat), Number(lon));
      } else {
        throw new ValidationError('Either field_id or lat/lon query parameters are required', {
          field: 'query',
        });
      }

      return res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      return next(err);
    }
  },

  async alerts(req, res, next) {
    try {
      const { user_id: userId } = req.user;
      const result = await weatherService.getWeatherAlerts(userId);
      return res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
      return next(err);
    }
  },
};
