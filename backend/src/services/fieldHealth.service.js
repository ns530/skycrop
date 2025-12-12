const Sequelize = require('sequelize');
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
 * - Uses latest healthrecords metrics if available
 * - Optionally enriches with 7-day weather outlook (if configured)
 * - Caches summary in Redis (TTL 3600s)
 */
class FieldHealthService {
  constructor() {
    this.redis = null;
    this.TTLSECONDS = Number(process.env.FIELDHEALTHTTLSECONDS || 3600);
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  cacheKey(field_id) {
    return `field:health:${field_id}`;
  }

  async assertOwnership(user_id, field_id) {
    if (!user_id) throw new ValidationError('user_id is required');
    if (!field_id) throw new ValidationError('field_id is required');
    const field = await Field.findOne({
      where: { user_id, field_id, status: { [Sequelize.Op.ne]: 'deleted' } },
    });
    if (!field) throw new NotFoundError('Field not found');
    return field;
  }

  statusFromScore(score) {
    if (score >= 70) return 'good';
    if (score >= 40) return 'moderate';
    return 'poor';
  }

  scoreFromRecord(rec) {
    // Base score from healthstatus if present
    const baseByStatus = {
      excellent: 90,
      good: 75,
      fair: 55,
      poor: 35,
    };
    let score =
      typeof baseByStatus[rec.healthstatus] === 'number' ? baseByStatus[rec.healthstatus] : 50;

    // Adjustments using NDVI/NDWI means (simple heuristic)
    if (typeof rec.ndvimean === 'number') {
      // NDVI mean roughly -1..1; map boosts within reasonable band
      score += Math.max(-10, Math.min(10, (rec.ndvimean - 0.3) * 40)); // center around 0.3 threshold
    }
    if (typeof rec.ndwimean === 'number') {
      // Too low water reduces; too high may reduce (waterlogging)
      const waterAdj = (rec.ndwimean - 0.2) * 20;
      score += Math.max(-8, Math.min(6, waterAdj));
    }
    if (typeof rec.cloudcover === 'number') {
      // High cloud cover reduces confidence slightly
      score -= Math.min(5, Math.max(0, (rec.cloudcover - 20) / 5));
    }

    // Clamp 0..100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  signalsFromRecord(rec) {
    const s = [];
    if (typeof rec.ndvimean === 'number') {
      s.push({ key: 'ndvimean', label: 'NDVI Mean', value: rec.ndvimean, weight: 0.4 });
    }
    if (typeof rec.ndwimean === 'number') {
      s.push({ key: 'ndwimean', label: 'NDWI Mean', value: rec.ndwimean, weight: 0.3 });
    }
    if (typeof rec.tdvimean === 'number') {
      s.push({ key: 'tdvimean', label: 'TDVI Mean', value: rec.tdvimean, weight: 0.2 });
    }
    if (typeof rec.cloudcover === 'number') {
      s.push({ key: 'cloud', label: 'Cloud Cover (%)', value: rec.cloudcover, weight: 0.1 });
    }
    return s;
  }

  adviceFromSignals(rec, forecast) {
    const tips = [];

    // NDVI-based advice
    if (typeof rec.ndvimean === 'number') {
      if (rec.ndvimean < 0.25)
        tips.push('Vegetation index is low. Inspect for nutrient deficiencies or pests.');
      else if (rec.ndvimean < 0.35)
        tips.push('Vegetation index is moderate. Monitor growth and consider light fertilization.');
      else tips.push('Vegetation index is healthy. Keep current management practices.');
    }

    // NDWI-based advice
    if (typeof rec.ndwimean === 'number') {
      if (rec.ndwimean < 0.05)
        tips.push('Field moisture appears low. Consider irrigation if feasible.');
      else if (rec.ndwimean > 0.35)
        tips.push('Field moisture is high. Avoid over-irrigation and check drainage.');
    }

    // Weather-based advice (rain coming soon)
    if (forecast && Array.isArray(forecast.daily) && forecast.daily.length > 0) {
      const nextRain = forecast.daily.find(d => (d?.pop || 0) >= 0.6 || (d?.rain || 0) >= 5);
      if (nextRain) {
        tips.push('Significant rain expected soon. Plan irrigation and fertilizer accordingly.');
      }
    }

    return tips;
  }

  async getLatestRecord(field_id) {
    return HealthRecord.findOne({
      where: { field_id },
      order: [['measurementdate', 'DESC']],
    });
  }

  async maybeGetForecast(user_id, field_id) {
    try {
      // If weather service is configured, include a lightweight forecast
      const weatherSvc = getWeatherService();
      const result = await weatherSvc.getForecastByField(user_id, field_id);
      return result?.data || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Compute or fetch cached field health summary.
   */
  async getFieldHealth(field_id, user_id) {
    await this.init();
    const field = await this.assertOwnership(user_id, field_id);

    const cacheKey = this.cacheKey(field.field_id);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      logger.info('cache.hit', { key: 'field:health:field_id' });
      return parsed;
    }

    logger.info('cache.miss', { key: 'field:health:field_id' });

    // Fetch latest record; if none, return neutral summary
    const latest = await this.getLatestRecord(field.field_id);

    if (!latest) {
      const empty = {
        id: field.field_id,
        score: 50,
        status: this.statusFromScore(50),
        signals: [],
        advice: [
          'No satellite-derived health data yet. Schedule a health refresh or try again later.',
        ],
        updatedAt: new Date().toISOString(),
      };
      await this.redis.setEx(cacheKey, this.TTLSECONDS, JSON.stringify(empty));
      return empty;
    }

    const forecast = await this.maybeGetForecast(user_id, field.field_id);
    const score = this.scoreFromRecord(latest);
    const summary = {
      id: field.field_id,
      score,
      status: this.statusFromScore(score),
      signals: this.signalsFromRecord(latest),
      advice: this.adviceFromSignals(latest, forecast),
      updatedAt: new Date().toISOString(),
    };

    await this.redis.setEx(cacheKey, this.TTLSECONDS, JSON.stringify(summary));
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
