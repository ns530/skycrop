'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { initRedis } = require('../config/redis.config');
const { logger } = require('../utils/logger');
const { AppError } = require('../errors/custom-errors');

class MLGatewayService {
  constructor() {
    this.redis = null;

    this.ML_BASE_URL = (process.env.ML_BASE_URL || 'http://localhost:8001').replace(/\/+$/,'');
    this.ML_INTERNAL_TOKEN = process.env.ML_INTERNAL_TOKEN || 'change-me';
    this.CACHE_TTL = parseInt(process.env.ML_PREDICT_CACHE_TTL_SECONDS || '86400', 10);
    this.TIMEOUT_MS = parseInt(process.env.ML_REQUEST_TIMEOUT_MS || '60000', 10);

    // New: alternate service/env keys used by detectBoundaries()
    this.ML_SERVICE_URL = (process.env.ML_SERVICE_URL || this.ML_BASE_URL || 'http://localhost:8001').replace(/\/+$/,'');
    this.ML_SERVICE_TOKEN = process.env.ML_SERVICE_TOKEN || this.ML_INTERNAL_TOKEN || 'change-me';
    this.MODEL_UNET_VERSION = process.env.MODEL_UNET_VERSION || '1.0.0';
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  // stable stringify
  _stableStringify(obj) {
    const sorter = (value) => {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.map(sorter);
        }
        const keys = Object.keys(value).sort();
        const result = {};
        for (const k of keys) {
          result[k] = sorter(value[k]);
        }
        return result;
      }
      return value;
    };
    return JSON.stringify(sorter(obj));
  }

  _sha1(data) {
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  normalizePayload(input) {
    const out = {};
    if (Array.isArray(input.bbox)) {
      const [minLon, minLat, maxLon, maxLat] = input.bbox.map(Number);
      out.bbox = [minLon, minLat, maxLon, maxLat];
    }
    if (typeof input.field_id === 'string') {
      out.field_id = input.field_id;
    }
    if (input.date) {
      out.date = String(input.date);
    }
    if (input.model_version) {
      out.model_version = String(input.model_version);
    }
    if (input.tiling && typeof input.tiling === 'object') {
      const size = Number.isInteger(input.tiling.size) ? input.tiling.size : 512;
      const overlap = Number.isInteger(input.tiling.overlap) ? input.tiling.overlap : 64;
      out.tiling = { size, overlap };
    } else {
      out.tiling = { size: 512, overlap: 64 };
    }
    out.return = input.return === 'inline' ? 'inline' : 'mask_url';
    return out;
  }

  normalizeYieldPayload(input) {
    const out = {};
    if (Array.isArray(input.features)) {
      out.features = input.features.map(feature => {
        const normalized = { field_id: feature.field_id };
        for (const [key, value] of Object.entries(feature)) {
          if (key !== 'field_id') {
            normalized[key] = Number(value);
          }
        }
        return normalized;
      });
    }
    if (Array.isArray(input.rows)) {
      out.rows = input.rows.map(row => row.map(Number));
    }
    if (Array.isArray(input.feature_names)) {
      out.feature_names = input.feature_names;
    }
    if (input.model_version) {
      out.model_version = String(input.model_version);
    }
    return out;
  }

  computeRequestHash(payload) {
    const stable = this._stableStringify(payload);
    return this._sha1(stable);
  }

  _cacheKey(hash) {
    return `ml:segmentation:predict:${hash}`;
  }

  _yieldCacheKey(hash) {
    return `ml:yield:predict:${hash}`;
  }

  _estimateHarvestDate() {
    // Estimate harvest date as 4 months from now (typical for paddy rice)
    const now = new Date();
    now.setMonth(now.getMonth() + 4);
    return now.toISOString().split('T')[0];
  }

  _getPreviousSeasonYield(fieldId) {
    // Mock previous season yield - in real implementation, query database
    // Return a value slightly lower than current optimal
    return 4800; // kg/ha
  }

  async cacheGet(key) {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async cacheSet(key, value) {
    const str = JSON.stringify(value);
    if (typeof this.redis.setEx === 'function') {
      await this.redis.setEx(key, this.CACHE_TTL, str);
    } else {
      await this.redis.setex(key, this.CACHE_TTL, str);
    }
  }

  async _callML(payload, correlationId) {
    const url = `${this.ML_SERVICE_URL}/v1/segmentation/predict`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Internal-Token': this.ML_INTERNAL_TOKEN,
    };
    if (this.ML_SERVICE_TOKEN) headers['Authorization'] = `Bearer ${this.ML_SERVICE_TOKEN}`;
    if (correlationId) headers['X-Request-Id'] = correlationId;
    if (payload.model_version) headers['X-Model-Version'] = payload.model_version;

    const started = Date.now();
    let resp;
    try {
      resp = await axios.post(url, payload, { headers,
        timeout: this.TIMEOUT_MS,
        validateStatus: (s) => s >= 200 && s < 600, // treat 5xx as handled errors
      });
    } catch (err) {
      const latency = Date.now() - started;
      logger.error('ml.gateway.http_error', {
        route: '/api/v1/ml/segmentation/predict',
        latency_ms: latency,
        message: err.message,
      });
      throw new AppError('UPSTREAM_ERROR', 'ML service request failed', 502, { message: err.message });
    }

    const latency = Date.now() - started;
    logger.info('ml.gateway.downstream', {
      route: '/api/v1/ml/segmentation/predict',
      latency_ms: latency,
      downstream_status: resp.status,
      correlation_id: correlationId,
      model_version: resp.headers?.['x-model-version'] || payload.model_version || null,
    });

    if (resp.status >= 200 && resp.status < 300) {
      return {
        ok: true,
        status: resp.status,
        headers: resp.headers || {},
        data: resp.data,
        latency_ms: latency,
      };
    }

    // Map error
    const e = this._mapDownstreamError(resp);
    throw e;
  }

  async _callYieldML(payload, correlationId) {
    const url = `${this.ML_SERVICE_URL}/v1/yield/predict`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Internal-Token': this.ML_INTERNAL_TOKEN,
    };
    if (this.ML_SERVICE_TOKEN) headers['Authorization'] = `Bearer ${this.ML_SERVICE_TOKEN}`;
    if (correlationId) headers['X-Request-Id'] = correlationId;
    if (payload.model_version) headers['X-Model-Version'] = payload.model_version;

    const started = Date.now();
    let resp;
    try {
      resp = await axios.post(url, payload, { headers,
        timeout: this.TIMEOUT_MS,
        validateStatus: (s) => s >= 200 && s < 600, // treat 5xx as handled errors
      });
    } catch (err) {
      const latency = Date.now() - started;
      logger.error('ml.gateway.http_error', {
        route: '/api/v1/ml/yield/predict',
        latency_ms: latency,
        message: err.message,
      });
      throw new AppError('UPSTREAM_ERROR', 'ML service request failed', 502, { message: err.message });
    }

    const latency = Date.now() - started;
    logger.info('ml.gateway.downstream', {
      route: '/api/v1/ml/yield/predict',
      latency_ms: latency,
      downstream_status: resp.status,
      correlation_id: correlationId,
      model_version: resp.headers?.['x-model-version'] || payload.model_version || null,
    });

    if (resp.status >= 200 && resp.status < 300) {
      return {
        ok: true,
        status: resp.status,
        headers: resp.headers || {},
        data: resp.data,
        latency_ms: latency,
      };
    }

    // Map error
    const e = this._mapDownstreamError(resp);
    throw e;
  }

  _mapDownstreamError(resp) {
    const status = resp.status || 500;
    const body = resp.data || {};
    const err = body.error || {};
    const code = String(err.code || '').toUpperCase();

    switch (code) {
      case 'INVALID_INPUT':
        return new AppError('INVALID_INPUT', err.message || 'Invalid input', 400, err.details || {});
      case 'MODEL_NOT_FOUND':
        return new AppError('MODEL_NOT_FOUND', err.message || 'Model not found', 404, err.details || {});
      case 'TIMEOUT':
        return new AppError('TIMEOUT', err.message || 'Timeout', 504, err.details || {});
      case 'NOT_IMPLEMENTED':
        return new AppError('NOT_IMPLEMENTED', err.message || 'Not implemented', 501, err.details || {});
      case 'UPSTREAM_ERROR':
        return new AppError('UPSTREAM_ERROR', err.message || 'Upstream error', status >= 500 && status < 600 ? status : 502, err.details || {});
      case 'AUTH_REQUIRED':
        return new AppError('UNAUTHORIZED', err.message || 'Auth required', 401, err.details || {});
      case 'UNAUTHORIZED_INTERNAL':
        return new AppError('FORBIDDEN', err.message || 'Forbidden', 403, err.details || {});
      default:
        if (status === 404) return new AppError('MODEL_NOT_FOUND', 'Model not found', 404, {});
        if (status === 501) return new AppError('NOT_IMPLEMENTED', 'Not implemented', 501, {});
        if (status === 504 || status === 408) return new AppError('TIMEOUT', 'Timeout', 504, {});
        if (status >= 400 && status < 500) return new AppError('INVALID_INPUT', 'Invalid input', 400, {});
        return new AppError('UPSTREAM_ERROR', 'ML service error', 502, { status });
    }
  }

  /**
   * Predict with caching (mask_url variant cached only)
   * Returns { result, cacheHit, downstreamStatus, modelVersion, latency_ms }
   */
  async predict(input, correlationId) {
    await this.init();

    const payload = this.normalizePayload(input);
    const hash = this.computeRequestHash(payload);
    const key = this._cacheKey(hash);

    const wantUrl = payload.return !== 'inline';

    if (wantUrl) {
      const cached = await this.cacheGet(key);
      if (cached && typeof cached === 'object') {
        return {
          result: { success: true, data: cached },
          cacheHit: true,
          downstreamStatus: 200,
          modelVersion: cached?.model?.version || null,
          latency_ms: 0,
        };
      }
    }

    const resp = await this._callML(payload, correlationId);
    const modelVersionHdr = resp.headers?.['x-model-version'] || null;

    // Normalize downstream success payload into backend shape
    const data = resp.data || {};
    const normalized = {
      request_id: data.request_id || correlationId || null,
      model: data.model || null,
      mask_url: data.mask_url,
      mask_base64: data.mask_base64,
      mask_format: data.mask_format,
      metrics: data.metrics,
      warnings: data.warnings || [],
    };

    if (wantUrl && normalized.mask_url) {
      await this.cacheSet(key, normalized);
    }

    return {
      result: { success: true, data: normalized },
      cacheHit: false,
      downstreamStatus: resp.status,
      modelVersion: modelVersionHdr || (data.model && data.model.version) || payload.model_version || null,
      latency_ms: resp.latency_ms,
    };
  }

  /**
   * Detect field boundaries via ML-Service U-Net segmentation.
   * Returns a normalized result:
   *   { requestId, model: { name, version }, maskUrl?, maskBase64?, metadata? }
   */
  async detectBoundaries(bbox, options = {}) {
    await this.init();

    // Basic bbox validation: [minLon, minLat, maxLon, maxLat]
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      throw new AppError('INVALID_INPUT', 'bbox must be [minLon,minLat,maxLon,maxLat]', 400, { bbox });
    }
    const nums = bbox.map(Number);
    if (nums.some((n) => !Number.isFinite(n))) {
      throw new AppError('INVALID_INPUT', 'bbox coordinates must be finite numbers', 400, { bbox });
    }
    const [minLon, minLat, maxLon, maxLat] = nums;
    if (minLon >= maxLon || minLat >= maxLat) {
      throw new AppError('INVALID_INPUT', 'bbox min must be less than max for lon/lat', 400, { bbox });
    }
    if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
      throw new AppError('INVALID_INPUT', 'bbox coordinates out of range', 400, { bbox });
    }

    const effectiveVersion = String(options.modelVersion || this.MODEL_UNET_VERSION || '1.0.0');
    const returnPref = options.returnFormat === 'inline' ? 'inline' : 'mask_url';

    // Reuse predict() to preserve hashing/caching/_callML/error mapping patterns
    const input = {
      bbox: [minLon, minLat, maxLon, maxLat],
      model_version: effectiveVersion,
      return: returnPref,
      // Provide alternate key some services recognize (harmless if ignored)
      return_: returnPref === 'inline' ? 'inline' : 'url',
    };

    const { result } = await this.predict(input, options.correlationId || null);
    const data = (result && result.data) || {};

    return {
      requestId: data.request_id || options.correlationId || null,
      model: data.model || { name: 'unet', version: effectiveVersion },
      maskUrl: data.mask_url || null,
      maskBase64: data.mask_base64 || null,
      metadata: data.metrics ? { metrics: data.metrics, warnings: data.warnings || [] } : undefined,
    };
  }

  /**
   * Get disaster assessment for a field
   */
  async getDisasterAssessment(fieldId) {
    // Mock implementation - in real implementation, call ML service disaster analysis
    // For now, return basic assessment based on recent health data
    return {
      risk_level: 'low', // low, medium, high
      disaster_types: ['flood'], // possible disasters
      confidence: 0.85,
      assessed_at: new Date().toISOString()
    };
  }

  /**
   * Predict yield with caching
   * Returns { result, cacheHit, downstreamStatus, modelVersion, latency_ms }
   */
  async yieldPredict(input, correlationId) {
    await this.init();

    const payload = this.normalizeYieldPayload(input);
    const hash = this.computeRequestHash(payload);
    const key = this._yieldCacheKey(hash);

    // Check cache
    const cached = await this.cacheGet(key);
    if (cached && typeof cached === 'object') {
      return {
        result: { success: true, data: cached },
        cacheHit: true,
        downstreamStatus: 200,
        modelVersion: cached?.model?.version || null,
        latency_ms: 0,
      };
    }

    const resp = await this._callYieldML(payload, correlationId);
    const modelVersionHdr = resp.headers?.['x-model-version'] || null;

    // Normalize downstream success payload into backend shape
    const data = resp.data || {};
    const normalized = {
      request_id: data.request_id || correlationId || null,
      model: data.model || null,
      predictions: (data.predictions || []).map(prediction => ({
        ...prediction,
        harvest_date: prediction.harvest_date || this._estimateHarvestDate(),
        optimal_yield: prediction.optimal_yield || 5500, // kg/ha, typical optimal for paddy
        previous_season_yield: prediction.previous_season_yield || this._getPreviousSeasonYield(prediction.field_id),
      })),
      warnings: data.warnings || [],
    };

    // Cache the result
    await this.cacheSet(key, normalized);

    return {
      result: { success: true, data: normalized },
      cacheHit: false,
      downstreamStatus: resp.status,
      modelVersion: modelVersionHdr || (data.model && data.model.version) || payload.model_version || null,
      latency_ms: resp.latency_ms,
    };
  }
}

let mlGatewaySingleton;

function getMLGatewayService() {
  if (!mlGatewaySingleton) {
    mlGatewaySingleton = new MLGatewayService();
  }
  return mlGatewaySingleton;
}

module.exports = {
  MLGatewayService,
  getMLGatewayService,
};