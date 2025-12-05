'use strict';

const axios = require('axios');
const { ValidationError, NotFoundError } = require('../errors/custom-errors');
const Field = require('../models/field.model');
const { initRedis } = require('../config/redis.config');
const { logger } = require('../utils/logger');

/**
 * WeatherService
 * - Retrieves weather data from OpenWeather One Call API
 * - Caches responses in Redis (TTL default: 6 hours)
 * - Retries transient failures (max 2) with capped exponential backoff
 * - Falls back to cached data (if available) when provider fails
 */
class WeatherService {
  constructor() {
    this.redis = null;

    // Config (env-overridable)
    this.BASE_URL = 'https://api.openweathermap.org/data/2.5/onecall';
    this.TTL_SECONDS = Number(process.env.WEATHER_TTL_SECONDS || 21600); // 6 hours default
    this.TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS || 10000); // overall axios timeout
    this.RETRIES = Number(process.env.WEATHER_RETRIES || 2);
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  _requireApiKey() {
    // Prefer OPENWEATHER_API_KEY; fallback to legacy WEATHER_API_KEY if present
    const key = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;
    if (!key) {
      throw new ValidationError('OPENWEATHER_API_KEY is not configured in environment');
    }
    return key;
  }

  _fieldCenterToLatLon(field) {
    if (!field?.center?.coordinates || !Array.isArray(field.center.coordinates)) {
      throw new ValidationError('Field center point is missing or invalid');
    }
    const [lon, lat] = field.center.coordinates;
    return { lat, lon };
  }

  _cacheKey(type, fieldId) {
    return `weather:${type}:${fieldId}`;
  }

  async _getFieldOrThrow(userId, fieldId) {
    if (!userId) throw new ValidationError('userId is required');
    if (!fieldId) throw new ValidationError('fieldId is required');

    const field = await Field.findOne({
      where: { user_id: userId, field_id: fieldId, status: 'active' },
    });
    if (!field) {
      throw new NotFoundError('Field not found');
    }
    return field;
  }

  async _requestWithRetry(url, label) {
    let attempt = 0;
    let lastErr = null;

    const start = Date.now();
    while (attempt <= this.RETRIES) {
      try {
        const resp = await axios.get(url, {
          timeout: this.TIMEOUT_MS,
          maxRedirects: 0,
          // Avoid following redirects for SSRF safety
          validateStatus: (s) => s >= 200 && s < 600, // treat all errors as responses
        });

        if (resp.status >= 200 && resp.status < 300) {
          const duration = Date.now() - start;
          logger.info('%s.response', label, { status: resp.status, duration_ms: duration });
          return { json: resp.data, duration };
        }

        // 4xx: non-retryable error (bad request, unauthorized API key, etc.)
        if (resp.status >= 400 && resp.status < 500) {
          const duration = Date.now() - start;
          logger.error('%s.error', label, {
            status: resp.status,
            duration_ms: duration,
            message: 'Client error from weather provider',
          });
          const err = new ValidationError(`Weather API error (${resp.status}): ${resp.statusText}`);
          err.statusCode = resp.status;
          throw err; // This will exit the method immediately
        }

        // 5xx falls through to retry
        lastErr = new Error(`Weather API server error (${resp.status})`);
      } catch (err) {
        // Only network errors or ValidationError from 4xx
        if (err.name === 'ValidationError') {
          throw err; // Re-throw ValidationError without retry
        }
        lastErr = err;
      }

      // Retry with capped exponential backoff
      if (attempt < this.RETRIES) {
        const backoff = Math.min(500 * (2 ** attempt), 1000); // 500ms, 1000ms
        await new Promise((r) => setTimeout(r, backoff));
        attempt += 1;
        continue;
      }
      break;
    }

    const duration = Date.now() - start;
    logger.error('%s.error', label, {
      duration_ms: duration,
      message: lastErr?.message || 'Unknown weather error',
    });

    const e = new Error('Weather provider unavailable');
    e.code = 'SERVICE_UNAVAILABLE';
    e.statusCode = 503;
    throw e;
  }

  /**
   * Get current weather by field center.
   * Returns { data, meta } where meta includes cache hit/miss and source.
   */
  async getCurrentByField(userId, fieldId) {
    await this.init();
    const apiKey = this._requireApiKey();
    const field = await this._getFieldOrThrow(userId, fieldId);
    const { lat, lon } = this._fieldCenterToLatLon(field);

    const cacheKey = this._cacheKey('current', fieldId);
    const cachedStr = await this.redis.get(cacheKey);
    if (cachedStr) {
      const payload = JSON.parse(cachedStr);
      return {
        data: payload,
        meta: { cache: 'hit', source: 'cache' },
      };
    }

    const label = 'weather.current';
    const url = `${this.BASE_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts,daily&units=metric&appid=${encodeURIComponent(
      apiKey
    )}`;

    try {
      const { json, duration } = await this._requestWithRetry(url, label);
      const payload = {
        field_id: fieldId,
        coord: { lat, lon },
        current: json.current || null,
        source: 'openweathermap_onecall',
        fetched_at: new Date().toISOString(),
      };

      await this.redis.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(payload));
      logger.info('cache.set', { key: 'weather:current:FIELD_ID', ttl: this.TTL_SECONDS });
      return {
        data: payload,
        meta: { cache: 'miss', source: 'provider', duration_ms: duration },
      };
    } catch (err) {
      // Provider failed; if any older cache exists (unlikely since we missed), try again for fallback
      const fallbackStr = await this.redis.get(cacheKey);
      if (fallbackStr) {
        const payload = JSON.parse(fallbackStr);
        return {
          data: payload,
          meta: { cache: 'hit', source: 'cache' },
        };
      }
      throw err;
    }
  }

  /**
   * Get 7-day forecast by field center.
   * Returns { data, meta } where meta includes cache hit/miss and source.
   */
  async getForecastByField(userId, fieldId) {
    await this.init();
    const apiKey = this._requireApiKey();
    const field = await this._getFieldOrThrow(userId, fieldId);
    const { lat, lon } = this._fieldCenterToLatLon(field);

    const cacheKey = this._cacheKey('forecast', fieldId);
    const cachedStr = await this.redis.get(cacheKey);
    if (cachedStr) {
      const payload = JSON.parse(cachedStr);
      return {
        data: payload,
        meta: { cache: 'hit', source: 'cache' },
      };
    }

    const label = 'weather.forecast';
    const url = `${this.BASE_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts,current&units=metric&appid=${encodeURIComponent(
      apiKey
    )}`;

    try {
      const { json, duration } = await this._requestWithRetry(url, label);
      const payload = {
        field_id: fieldId,
        coord: { lat, lon },
        daily: Array.isArray(json.daily) ? json.daily.slice(0, 7) : [],
        source: 'openweathermap_onecall',
        fetched_at: new Date().toISOString(),
      };

      await this.redis.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(payload));
      logger.info('cache.set', { key: 'weather:forecast:FIELD_ID', ttl: this.TTL_SECONDS });
      return {
        data: payload,
        meta: { cache: 'miss', source: 'provider', duration_ms: duration },
      };
    } catch (err) {
      const fallbackStr = await this.redis.get(cacheKey);
      if (fallbackStr) {
        const payload = JSON.parse(fallbackStr);
        return {
          data: payload,
          meta: { cache: 'hit', source: 'cache' },
        };
      }
      throw err;
    }
  }
  /**
   * Normalize provider-specific daily forecasts into provider-agnostic shape.
   * Input: OpenWeather OneCall "daily" array
   * Output: [{ date, rain_mm, tmin, tmax, wind }]
   */
  _normalizeDaily(daily) {
    const arr = Array.isArray(daily) ? daily.slice(0, 7) : [];
    const days = arr.map((d) => {
      const tsMs = typeof d.dt === 'number' ? d.dt * 1000 : Date.now();
      const isoDate = new Date(tsMs).toISOString().slice(0, 10);
      const rain = Number(d.rain || 0);
      const tmin = d.temp && typeof d.temp.min !== 'undefined' ? Number(d.temp.min) : null;
      const tmax = d.temp && typeof d.temp.max !== 'undefined' ? Number(d.temp.max) : null;
      const wind = typeof d.wind_speed !== 'undefined' ? Number(d.wind_speed) : null;
      return { date: isoDate, rain_mm: rain, tmin, tmax, wind };
    });
    const sum = (arr2, n) => arr2.slice(0, n).reduce((acc, x) => acc + (Number(x.rain_mm) || 0), 0);
    const rain_3d_mm = Number(sum(days, 3).toFixed(2));
    const rain_7d_mm = Number(sum(days, 7).toFixed(2));
    return { days, totals: { rain_3d_mm, rain_7d_mm } };
  }

  _forecastCacheKeyByCoords(lat, lon) {
    const latKey = Number(lat).toFixed(4);
    const lonKey = Number(lon).toFixed(4);
    return `weather:forecast:${latKey}:${lonKey}`;
  }

  /**
   * Provider-agnostic normalized 7-day forecast by field center.
   * Returns { data: { field_id, coord, days[], totals }, meta }
   * Cache key: weather:forecast:{lat}:{lon}
   */
  async getForecast(userId, fieldId) {
    await this.init();
    const apiKey = this._requireApiKey();
    const field = await this._getFieldOrThrow(userId, fieldId);
    const { lat, lon } = this._fieldCenterToLatLon(field);

    const cacheKey = this._forecastCacheKeyByCoords(lat, lon);
    const cachedStr = await this.redis.get(cacheKey);
    if (cachedStr) {
      const payload = JSON.parse(cachedStr);
      return { data: payload, meta: { cache: 'hit', source: 'cache' } };
    }

    const label = 'weather.forecast.normalized';
    const url = `${this.BASE_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts,current&units=metric&appid=${encodeURIComponent(apiKey)}`;

    const { json, duration } = await this._requestWithRetry(url, label);
    const { days, totals } = this._normalizeDaily(json.daily || []);

    const payload = {
      field_id: fieldId,
      coord: { lat, lon },
      days,
      totals,
      source: 'openweathermap_onecall',
      fetched_at: new Date().toISOString(),
    };

    await this.redis.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(payload));
    logger.info('cache.set', { key: 'weather:forecast:LAT:LON', ttl: this.TTL_SECONDS });

    return { data: payload, meta: { cache: 'miss', source: 'provider', duration_ms: duration } };
  }

  /**
   * Provider-agnostic normalized 7-day forecast by coordinates.
   * Returns { data: { coord, days[], totals }, meta }
   */
  async getForecastByCoords(lat, lon) {
    await this.init();
    const apiKey = this._requireApiKey();

    const cacheKey = this._forecastCacheKeyByCoords(lat, lon);
    const cachedStr = await this.redis.get(cacheKey);
    if (cachedStr) {
      const payload = JSON.parse(cachedStr);
      return { data: payload, meta: { cache: 'hit', source: 'cache' } };
    }

    const label = 'weather.forecast.normalized.coords';
    const url = `${this.BASE_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts,current&units=metric&appid=${encodeURIComponent(apiKey)}`;

    const { json, duration } = await this._requestWithRetry(url, label);
    const { days, totals } = this._normalizeDaily(json.daily || []);

    const payload = {
      coord: { lat, lon },
      days,
      totals,
      source: 'openweathermap_onecall',
      fetched_at: new Date().toISOString(),
    };

    await this.redis.setEx(cacheKey, this.TTL_SECONDS, JSON.stringify(payload));
    logger.info('cache.set', { key: 'weather:forecast:LAT:LON', ttl: this.TTL_SECONDS });

    return { data: payload, meta: { cache: 'miss', source: 'provider', duration_ms: duration } };
  }
}

let weatherServiceSingleton;

/**
 * Provide singleton instance.
 */
function getWeatherService() {
  if (!weatherServiceSingleton) {
    weatherServiceSingleton = new WeatherService();
  }
  return weatherServiceSingleton;
}

module.exports = {
  WeatherService,
  getWeatherService,
};