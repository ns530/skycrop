'use strict';

const { Op } = require('sequelize');
const { initRedis } = require('../config/redis.config');
const Field = require('../models/field.model');
const HealthRecord = require('../models/health.model');
const { getWeatherService } = require('./weather.service');
const { ValidationError, NotFoundError } = require('../errors/custom-errors');
const { logger } = require('../utils/logger');

/**
 * FieldHealthService
 * Provides a computed health summary for a field:
 * {
 *   id, score: 0-100,
 *   status: "good"|"moderate"|"poor",
 *   signals: [{ key, label, value, weight }],
 *   advice: [string],
 *   updatedAt: ISOString
 * }
 *
 * - Uses latest health_records metrics if available
 * - Optionally enriches with 7-day weather outlook (if configured)
 * - Caches summary in Redis (TTL 3600s)
 */
class FieldHealthService {
  constructor() {
    this.redis = null;
    this.TTL_SECONDS = Number(process.env.FIELD_HEALTH_TTL_SECONDS || 3600);
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  _cacheKey(fieldId) {
    return `field:health:${fieldId}`;
  }

  async _assertOwnership(userId, fieldId) {
    if (!userId) throw new ValidationError('userId is required');
    if (!fieldId) throw new ValidationError('fieldId is required');
    const field = await Field.findOne({
      where: { user_id: userId, field_id: fieldId, status: { [Op.ne]: 'deleted' } },
    });
    if (!field) throw new NotFoundError('Field not found');
    return field;
  }

  _statusFromScore(score) {
    if (score >= 70) return 'good';
    if (score >= 40) return 'moderate';
    return 'poor';
  }

  _scoreFromRecord(rec) {
    // Base score from health_status if present
    const baseByStatus = {
      excellent: 90,
      good: 75,
      fair: 55,
      poor: 35,
    };
    let score = typeof baseByStatus[rec.health_status] === 'number' ? baseByStatus[rec.health_status] : 50;

    // Adjustments using NDVI/NDWI means (simple heuristic)
    if (typeof rec.ndvi_mean === 'number') {
      // NDVI mean roughly -1..1; map boosts within reasonable band
      score += Math.max(-10, Math.min(10, (rec.ndvi_mean - 0.3) * 40)); // center around 0.3 threshold
    }
    if (typeof rec.ndwi_mean === 'number') {
      // Too low water reduces; too high may reduce (waterlogging)
      const waterAdj = (rec.ndwi_mean - 0.2) * 20;
      score += Math.max(-8, Math.min(6, waterAdj));
    }
    if (typeof rec.cloud_cover === 'number') {
      // High cloud cover reduces confidence slightly
      score -= Math.min(5, Math.max(0, (rec.cloud_cover - 20) / 5));
    }

    // Clamp 0..100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  _signalsFromRecord(rec) {
    const s = [];
    if (typeof rec.ndvi_mean === 'number') {
      s.push({ key: 'ndvi_mean', label: 'NDVI Mean', value: rec.ndvi_mean, weight: 0.4 });
    }
    if (typeof rec.ndwi_mean === 'number') {
      s.push({ key: 'ndwi_mean', label: 'NDWI Mean', value: rec.ndwi_mean, weight: 0.3 });
    }
    if (typeof rec.tdvi_mean === 'number') {
      s.push({ key: 'tdvi_mean', label: 'TDVI Mean', value: rec.tdvi_mean, weight: 0.2 });
    }
    if (typeof rec.cloud_cover === 'number') {
      s.push({ key: 'cloud', label: 'Cloud Cover (%)', value: rec.cloud_cover, weight: 0.1 });
    }
    return s;
  }

  _adviceFromSignals(rec, forecast) {
    const tips = [];

    // NDVI-based advice
    if (typeof rec.ndvi_mean === 'number') {
      if (rec.ndvi_mean < 0.25) tips.push('Vegetation index is low. Inspect for nutrient deficiencies or pests.');
      else if (rec.ndvi_mean < 0.35) tips.push('Vegetation index is moderate. Monitor growth and consider light fertilization.');
      else tips.push('Vegetation index is healthy. Keep current management practices.');
    }

    // NDWI-based advice
    if (typeof rec.ndwi_mean === 'number') {
      if (rec.ndwi_mean < 0.05) tips.push('Field moisture appears low. Consider irrigation if feasible.');
      else if (rec.ndwi_mean > 0.35) tips.push('Field moisture is high. Avoid over-irrigation and check drainage.');
    }

    // Weather-based advice (rain coming soon)
    if (forecast && Array.isArray(forecast.daily) && forecast.daily.length > 0) {
      const nextRain = forecast.daily.find((d) => (d?.pop || 0) >= 0.6 || (d?.rain || 0) >= 5);
      if (nextRain) {
        tips.push('Significant rain expected soon. Plan irrigation and fertilizer accordingly.');
      }
    }

    return tips;
  }

  async _getLatestRecord(fieldId) {
    return HealthRecord.findOne({
      where: { field_id: fieldId },
      order: [['measurement_date', 'DESC']],
    });
  }

  async _maybeGetForecast(userId, fieldId) {
    try {
      // If weather service is configured, include a lightweight forecast
      const weatherSvc = getWeatherService();
      const result = await weatherSvc.getForecastByField(userId, fieldId);
      return result?.data || null;
    } catch (_e) {
      return null;
    }
  }

  /**
   * Compute or fetch cached field health summary.
   */
  async getFieldHealth(fieldId, userId) {
    await this.init();
    const field = await this._assertOwnership(userId, fieldId);

    const cacheKey = this._cacheKey(field.field_id);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      logger.info('cache.hit', { key: 'field:health:FIELD_ID' });
      return parsed;
    }

    logger.info('cache.miss', { key: 'field:health:FIELD_ID' });

    // Fetch latest record; if none, return neutral summary
    const latest = await this._getLatestRecord(field.field_id);

    if (!latest) {
      const empty = {
        id: field.field_id,
        score: 50,
        status: this._statusFromScore(50),
        signals: [],
        advice: ['No satellite-derived health data yet. Schedule a health refresh or try again later.'],
        updatedAt: new Date().toISOString(),
      };
      await this.redis.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(empty));
      return empty;
    }

    const forecast = await this._maybeGetForecast(userId, field.field_id);
    const score = this._scoreFromRecord(latest);
    const summary = {
      id: field.field_id,
      score,
      status: this._statusFromScore(score),
      signals: this._signalsFromRecord(latest),
      advice: this._adviceFromSignals(latest, forecast),
      updatedAt: new Date().toISOString(),
    };

    await this.redis.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(summary));
    return summary;
  }
}

let singleton;
function getFieldHealthService() {
  if (!singleton) singleton = new FieldHealthService();
  return singleton;
}

module.exports = {
  FieldHealthService,
  getFieldHealthService,
};