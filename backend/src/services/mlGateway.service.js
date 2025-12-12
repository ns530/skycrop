const axios = require('axios');
const crypto = require('crypto');
const { initRedis } = require('../config/redis.config');
const { logger } = require('../utils/logger');
const { AppError } = require('../errors/custom-errors');

class MLGatewayService {
  constructor() {
    this.redis = null;

    this.MLBASEURL = (process.env.MLBASEURL || 'http://localhost:80').replace(/\/+$/, '');
    this.MLINTERNALTOKEN = process.env.MLINTERNALTOKEN || 'change-me';
    this.CACHETTL = parseInt(process.env.MLPREDICTCACHETTLSECONDS || '86400', 10);
    this.TIMEOUTMS = parseInt(process.env.MLREQUESTTIMEOUTMS || '60000', 10);

    // New: alternate service/env keys used by detectBoundaries()
    this.MLSERVICEURL = (
      process.env.MLSERVICEURL ||
      this.MLBASEURL ||
      'http://localhost:80'
    ).replace(/\/+$/, '');
    this.MLSERVICETOKEN = process.env.MLSERVICETOKEN || this.MLINTERNALTOKEN || 'change-me';
    this.MODELUNETVERSION = process.env.MODELUNETVERSION || '1.0.0';
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  // stable stringify
  stableStringify(obj) {
    const sorter = value => {
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

  sha1(data) {
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
    if (input.modelversion) {
      out.modelversion = String(input.modelversion);
    }
    if (input.tiling && typeof input.tiling === 'object') {
      const size = Number.isInteger(input.tiling.size) ? input.tiling.size : 512;
      const overlap = Number.isInteger(input.tiling.overlap) ? input.tiling.overlap : 64;
      out.tiling = { size, overlap };
    } else {
      out.tiling = { size: 512, overlap: 64 };
    }
    out.return = input.return === 'inline' ? 'inline' : 'maskurl';
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
    if (Array.isArray(input.featurenames)) {
      out.featurenames = input.featurenames;
    }
    if (input.modelversion) {
      out.modelversion = String(input.modelversion);
    }
    return out;
  }

  computeRequestHash(payload) {
    const stable = this.stableStringify(payload);
    return this.sha1(stable);
  }

  cacheKey(hash) {
    return `ml:segmentation:predict:${hash}`;
  }

  yieldCacheKey(hash) {
    return `ml:yield:predict:${hash}`;
  }

  estimateHarvestDate() {
    // Estimate harvest date as 4 months from now (typical for paddy rice)
    const now = new Date();
    now.setMonth(now.getMonth() + 4);
    return now.toISOString().split('T')[0];
  }

  getPreviousSeasonYield(field_id) {
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
      await this.redis.setEx(key, this.CACHETTL, str);
    } else {
      await this.redis.setex(key, this.CACHETTL, str);
    }
  }

  async callML(payload, correlationId) {
    const url = `${this.MLSERVICEURL}/v1/segmentation/predict`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Internal-Token': this.MLINTERNALTOKEN,
    };
    if (this.MLSERVICETOKEN) headers.Authorization = `Bearer ${this.MLSERVICETOKEN}`;
    if (correlationId) headers['X-Request-Id'] = correlationId;
    if (payload.modelversion) headers['X-Model-Version'] = payload.modelversion;

    const started = Date.now();
    let resp;
    try {
      resp = await axios.post(url, payload, {
        headers,
        timeout: this.TIMEOUTMS,
        validateStatus: s => s >= 200 && s < 600, // treat 5xx as handled errors
      });
    } catch (err) {
      const latency = Date.now() - started;
      logger.error('ml.gateway.httperror', {
        route: '/api/v1/ml/segmentation/predict',
        latencyms: latency,
        message: err.message,
      });
      throw new AppError('UPSTREAMERROR', 'ML service request failed', 502, {
        message: err.message,
      });
    }

    const latency = Date.now() - started;
    logger.info('ml.gateway.downstream', {
      route: '/api/v1/ml/segmentation/predict',
      latencyms: latency,
      downstreamstatus: resp.status,
      correlationid: correlationId,
      modelversion: resp.headers?.['x-model-version'] || payload.modelversion || null,
    });

    if (resp.status >= 200 && resp.status < 300) {
      return {
        ok: true,
        status: resp.status,
        headers: resp.headers || {},
        data: resp.data,
        latencyms: latency,
      };
    }

    // Map error
    const e = this.mapDownstreamError(resp);
    throw e;
  }

  async callYieldML(payload, correlationId) {
    const url = `${this.MLSERVICEURL}/v1/yield/predict`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Internal-Token': this.MLINTERNALTOKEN,
    };
    if (this.MLSERVICETOKEN) headers.Authorization = `Bearer ${this.MLSERVICETOKEN}`;
    if (correlationId) headers['X-Request-Id'] = correlationId;
    if (payload.modelversion) headers['X-Model-Version'] = payload.modelversion;

    const started = Date.now();
    let resp;
    try {
      resp = await axios.post(url, payload, {
        headers,
        timeout: this.TIMEOUTMS,
        validateStatus: s => s >= 200 && s < 600, // treat 5xx as handled errors
      });
    } catch (err) {
      const latency = Date.now() - started;
      logger.error('ml.gateway.httperror', {
        route: '/api/v1/ml/yield/predict',
        latencyms: latency,
        message: err.message,
      });
      throw new AppError('UPSTREAMERROR', 'ML service request failed', 502, {
        message: err.message,
      });
    }

    const latency = Date.now() - started;
    logger.info('ml.gateway.downstream', {
      route: '/api/v1/ml/yield/predict',
      latencyms: latency,
      downstreamstatus: resp.status,
      correlationid: correlationId,
      modelversion: resp.headers?.['x-model-version'] || payload.modelversion || null,
    });

    if (resp.status >= 200 && resp.status < 300) {
      return {
        ok: true,
        status: resp.status,
        headers: resp.headers || {},
        data: resp.data,
        latencyms: latency,
      };
    }

    // Map error
    const e = this.mapDownstreamError(resp);
    throw e;
  }

  mapDownstreamError(resp) {
    const status = resp.status || 500;
    const body = resp.data || {};
    const err = body.error || {};
    const code = String(err.code || '').toUpperCase();

    switch (code) {
      case 'INVALIDINPUT':
        return new AppError('INVALIDINPUT', err.message || 'Invalid input', 400, err.details || {});
      case 'MODELNOTFOUND':
        return new AppError(
          'MODELNOTFOUND',
          err.message || 'Model not found',
          404,
          err.details || {}
        );
      case 'TIMEOUT':
        return new AppError('TIMEOUT', err.message || 'Timeout', 504, err.details || {});
      case 'NOTIMPLEMENTED':
        return new AppError(
          'NOTIMPLEMENTED',
          err.message || 'Not implemented',
          501,
          err.details || {}
        );
      case 'UPSTREAMERROR':
        return new AppError(
          'UPSTREAMERROR',
          err.message || 'Upstream error',
          status >= 500 && status < 600 ? status : 502,
          err.details || {}
        );
      case 'AUTHREQUIRED':
        return new AppError('UNAUTHORIZED', err.message || 'Auth required', 401, err.details || {});
      case 'UNAUTHORIZEDINTERNAL':
        return new AppError('FORBIDDEN', err.message || 'Forbidden', 403, err.details || {});
      default:
        if (status === 404) return new AppError('MODELNOTFOUND', 'Model not found', 404, {});
        if (status === 501) return new AppError('NOTIMPLEMENTED', 'Not implemented', 501, {});
        if (status === 504 || status === 408) return new AppError('TIMEOUT', 'Timeout', 504, {});
        if (status >= 400 && status < 500)
          return new AppError('INVALIDINPUT', 'Invalid input', 400, {});
        return new AppError('UPSTREAMERROR', 'ML service error', 502, { status });
    }
  }

  /**
   * Predict with caching (maskurl variant cached only)
   * Returns { result, cacheHit, downstreamStatus, modelVersion, latencyms }
   */
  async predict(input, correlationId) {
    await this.init();

    const payload = this.normalizePayload(input);
    const hash = this.computeRequestHash(payload);
    const key = this.cacheKey(hash);

    const wantUrl = payload.return !== 'inline';

    if (wantUrl) {
      const cached = await this.cacheGet(key);
      if (cached && typeof cached === 'object') {
        return {
          result: { success: true, data: cached },
          cacheHit: true,
          downstreamStatus: 200,
          modelVersion: cached?.model?.version || null,
          latencyms: 0,
        };
      }
    }

    const resp = await this.callML(payload, correlationId);
    const modelVersionHdr = resp.headers?.['x-model-version'] || null;

    // Normalize downstream success payload into backend shape
    const data = resp.data || {};
    const normalized = {
      requestid: data.requestid || correlationId || null,
      model: data.model || null,
      maskurl: data.maskurl,
      maskbase64: data.maskbase64,
      maskformat: data.maskformat,
      metrics: data.metrics,
      warnings: data.warnings || [],
    };

    if (wantUrl && normalized.maskurl) {
      await this.cacheSet(key, normalized);
    }

    return {
      result: { success: true, data: normalized },
      cacheHit: false,
      downstreamStatus: resp.status,
      modelVersion:
        modelVersionHdr || (data.model && data.model.version) || payload.modelversion || null,
      latencyms: resp.latencyms,
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
      throw new AppError('INVALIDINPUT', 'bbox must be [minLon,minLat,maxLon,maxLat]', 400, {
        bbox,
      });
    }
    const nums = bbox.map(Number);
    if (nums.some(n => !Number.isFinite(n))) {
      throw new AppError('INVALIDINPUT', 'bbox coordinates must be finite numbers', 400, { bbox });
    }
    const [minLon, minLat, maxLon, maxLat] = nums;
    if (minLon >= maxLon || minLat >= maxLat) {
      throw new AppError('INVALIDINPUT', 'bbox min must be less than max for lon/lat', 400, {
        bbox,
      });
    }
    if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
      throw new AppError('INVALIDINPUT', 'bbox coordinates out of range', 400, { bbox });
    }

    const effectiveVersion = String(options.modelVersion || this.MODELUNETVERSION || '1.0.0');
    const returnPref = options.returnFormat === 'inline' ? 'inline' : 'maskurl';

    // Reuse predict() to preserve hashing/caching/callML/error mapping patterns
    const input = {
      bbox: [minLon, minLat, maxLon, maxLat],
      modelversion: effectiveVersion,
      return: returnPref,
      // Provide alternate key some services recognize (harmless if ignored)
      return_: returnPref === 'inline' ? 'inline' : 'url',
    };

    const { result } = await this.predict(input, options.correlationId || null);
    const data = (result && result.data) || {};

    return {
      requestId: data.requestid || options.correlationId || null,
      model: data.model || { name: 'unet', version: effectiveVersion },
      maskUrl: data.maskurl || null,
      maskBase64: data.maskbase64 || null,
      metadata: data.metrics ? { metrics: data.metrics, warnings: data.warnings || [] } : undefined,
    };
  }

  /**
   * Get disaster assessment for a field
   */
  async getDisasterAssessment(field_id) {
    // Mock implementation - in real implementation, call ML service disaster analysis
    // For now, return basic assessment based on recent health data
    return {
      risklevel: 'low', // low, medium, high
      disastertypes: ['flood'], // possible disasters
      confidence: 0.85,
      assessedat: new Date().toISOString(),
    };
  }

  /**
   * Predict yield with caching
   * Returns { result, cacheHit, downstreamStatus, modelVersion, latencyms }
   */
  async yieldPredict(input, correlationId) {
    await this.init();

    const payload = this.normalizeYieldPayload(input);
    const hash = this.computeRequestHash(payload);
    const key = this.yieldCacheKey(hash);

    // Check cache
    const cached = await this.cacheGet(key);
    if (cached && typeof cached === 'object') {
      return {
        result: { success: true, data: cached },
        cacheHit: true,
        downstreamStatus: 200,
        modelVersion: cached?.model?.version || null,
        latencyms: 0,
      };
    }

    const resp = await this.callYieldML(payload, correlationId);
    const modelVersionHdr = resp.headers?.['x-model-version'] || null;

    // Normalize downstream success payload into backend shape
    const data = resp.data || {};
    const normalized = {
      requestid: data.requestid || correlationId || null,
      model: data.model || null,
      predictions: (data.predictions || []).map(prediction => ({
        ...prediction,
        harvestdate: prediction.harvestdate || this.estimateHarvestDate(),
        optimalyield: prediction.optimalyield || 5500, // kg/ha, typical optimal for paddy
        previousseasonyield:
          prediction.previousseasonyield || this.getPreviousSeasonYield(prediction.field_id),
      })),
      warnings: data.warnings || [],
    };

    // Cache the result
    await this.cacheSet(key, normalized);

    return {
      result: { success: true, data: normalized },
      cacheHit: false,
      downstreamStatus: resp.status,
      modelVersion:
        modelVersionHdr || (data.model && data.model.version) || payload.modelversion || null,
      latencyms: resp.latencyms,
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
