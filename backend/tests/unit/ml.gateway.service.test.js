'use strict';

const axios = require('axios');

// In-memory fake Redis
const redisStore = new Map();
let lastSetExTTL = null;
const fakeRedisClient = {
  isOpen: true,
  async get(key) {
    return redisStore.has(key) ? redisStore.get(key) : null;
  },
  async setEx(key, ttl, value) {
    lastSetExTTL = ttl;
    redisStore.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    // compatibility fallback
    lastSetExTTL = ttl;
    redisStore.set(key, value);
    return 'OK';
  },
};

// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

// Import after mocks
const { MLGatewayService } = require('../../src/services/mlGateway.service');

describe('MLGatewayService Unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    lastSetExTTL = null;
    process.env.ML_PREDICT_CACHE_TTL_SECONDS = '86400';
    process.env.ML_REQUEST_TIMEOUT_MS = '60000';
    process.env.ML_BASE_URL = 'http://ml-service.local:80';
    process.env.ML_INTERNAL_TOKEN = 'test-internal-token';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('normalizePayload + computeRequestHash are stable regardless of key order', () => {
    const svc = new MLGatewayService();

    const a = svc.normalizePayload({
      bbox: [80.1, 7.2, 80.12, 7.22],
      date: '2025-10-15',
      model_version: '1.0.0',
      tiling: { overlap: 64, size: 512 },
      return: 'mask_url',
    });

    const b = svc.normalizePayload({
      date: '2025-10-15',
      tiling: { size: 512, overlap: 64 },
      bbox: [80.1, 7.2, 80.12, 7.22],
      return: 'mask_url',
      model_version: '1.0.0',
    });

    const ha = svc.computeRequestHash(a);
    const hb = svc.computeRequestHash(b);

    expect(ha).toBe(hb);
  });

  test('cache key/TTL logic: caches successful mask_url responses with configured TTL', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'unet-1.0.0' },
      data: {
        request_id: 'req-1',
        model: { name: 'unet', version: '1.0.0' },
        mask_url: 'http://ml.local/masks/req-1.geojson',
        mask_format: 'geojson',
        metrics: { latency_ms: 100, tile_count: 1, cloud_coverage: 0.0 },
        warnings: [],
      },
    });

    const input = {
      bbox: [80.1, 7.2, 80.12, 7.22],
      date: '2025-10-15',
      model_version: '1.0.0',
      return: 'mask_url',
    };

    // First call -> miss, triggers axios + cache set
    const out1 = await svc.predict(input, 'corr-1');
    expect(out1.cacheHit).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(lastSetExTTL).toBe(86400);

    // Second call -> hit, no axios
    const out2 = await svc.predict(input, 'corr-2');
    expect(out2.cacheHit).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('error mapping: INVALID_INPUT -> 400', async () => {
    const svc = new MLGatewayService();
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 400,
      headers: {},
      data: { error: { code: 'INVALID_INPUT', message: 'bbox invalid', details: { bbox: 'min>=max' } } },
    });

    const input = {
      bbox: [80.2, 7.3, 80.1, 7.1], // invalid extents but route-level validation is not applied in unit
      date: '2025-10-15',
      return: 'mask_url',
    };

    await expect(svc.predict(input, 'corr-3')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      statusCode: 400,
    });
  });

  test('init initializes redis client', async () => {
    const svc = new MLGatewayService();
    svc.redis = null;
    await svc.init();
    expect(svc.redis).toBe(fakeRedisClient);
  });

  test('_stableStringify sorts object keys for consistent hashing', () => {
    const svc = new MLGatewayService();
    const obj1 = { b: 2, a: 1 };
    const obj2 = { a: 1, b: 2 };
    expect(svc._stableStringify(obj1)).toBe(svc._stableStringify(obj2));
  });

  test('_sha1 computes SHA1 hash', () => {
    const svc = new MLGatewayService();
    const hash = svc._sha1('test');
    expect(hash).toMatch(/^[a-f0-9]{40}$/);
  });

  test('normalizePayload handles all input variations', () => {
    const svc = new MLGatewayService();
    const input = {
      bbox: ['80.1', '7.2', '80.12', '7.22'],
      field_id: 'field-1',
      date: 20251015,
      model_version: 1.0,
      tiling: { size: '512', overlap: '64' },
      return: 'inline',
    };
    const result = svc.normalizePayload(input);
    expect(result.bbox).toEqual([80.1, 7.2, 80.12, 7.22]);
    expect(result.field_id).toBe('field-1');
    expect(result.date).toBe('20251015');
    expect(result.model_version).toBe('1');
    expect(result.tiling).toEqual({ size: 512, overlap: 64 });
    expect(result.return).toBe('inline');
  });

  test('normalizeYieldPayload normalizes features and rows', () => {
    const svc = new MLGatewayService();
    const input = {
      features: [
        { field_id: 'field-1', ndvi: '0.5', ndwi: '0.2' },
        { field_id: 'field-2', ndvi: '0.6', ndwi: '0.3' },
      ],
      rows: [['1', '2'], ['3', '4']],
      feature_names: ['ndvi', 'ndwi'],
      model_version: 2.0,
    };
    const result = svc.normalizeYieldPayload(input);
    expect(result.features[0]).toEqual({ field_id: 'field-1', ndvi: 0.5, ndwi: 0.2 });
    expect(result.rows).toEqual([[1, 2], [3, 4]]);
    expect(result.feature_names).toEqual(['ndvi', 'ndwi']);
    expect(result.model_version).toBe('2');
  });

  test('computeRequestHash generates consistent hash', () => {
    const svc = new MLGatewayService();
    const payload1 = { a: 1, b: 2 };
    const payload2 = { b: 2, a: 1 };
    expect(svc.computeRequestHash(payload1)).toBe(svc.computeRequestHash(payload2));
  });

  test('_cacheKey and _yieldCacheKey generate correct keys', () => {
    const svc = new MLGatewayService();
    expect(svc._cacheKey('hash')).toBe('ml:segmentation:predict:hash');
    expect(svc._yieldCacheKey('hash')).toBe('ml:yield:predict:hash');
  });

  test('_estimateHarvestDate returns date 4 months from now', () => {
    const svc = new MLGatewayService();
    const date = svc._estimateHarvestDate();
    const now = new Date();
    const expected = new Date(now);
    expected.setMonth(now.getMonth() + 4);
    expect(date).toBe(expected.toISOString().split('T')[0]);
  });

  test('_getPreviousSeasonYield returns fixed value', () => {
    const svc = new MLGatewayService();
    expect(svc._getPreviousSeasonYield('field-1')).toBe(4800);
  });

  test('cacheGet and cacheSet work with JSON', async () => {
    const svc = new MLGatewayService();
    await svc.init();
    const key = 'test:key';
    const value = { test: 'data' };
    await svc.cacheSet(key, value);
    const retrieved = await svc.cacheGet(key);
    expect(retrieved).toEqual(value);
  });

  test('_callML makes correct axios request and handles success', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': '1.0.0' },
      data: { result: 'success' },
    });
    const payload = { bbox: [80, 7, 81, 8] };
    const result = await svc._callML(payload, 'corr-1');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ result: 'success' });
    expect(spy).toHaveBeenCalledWith(
      'http://ml-service.local:80/v1/segmentation/predict',
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Internal-Token': 'test-internal-token',
        }),
        timeout: 60000,
      })
    );
  });

  test('_callML handles axios errors', async () => {
    const svc = new MLGatewayService();
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('Network error'));
    await expect(svc._callML({}, 'corr-1')).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
      statusCode: 502,
    });
  });

  test('_callYieldML makes correct request for yield prediction', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: {},
      data: { predictions: [] },
    });
    const payload = { features: [] };
    const result = await svc._callYieldML(payload, 'corr-1');
    expect(result.ok).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      'http://ml-service.local:80/v1/yield/predict',
      payload,
      expect.any(Object)
    );
  });

  test('_mapDownstreamError maps various error codes', () => {
    const svc = new MLGatewayService();

    // INVALID_INPUT
    let resp = { status: 400, data: { error: { code: 'INVALID_INPUT', message: 'bad input' } } };
    let error = svc._mapDownstreamError(resp);
    expect(error.code).toBe('INVALID_INPUT');
    expect(error.statusCode).toBe(400);

    // MODEL_NOT_FOUND
    resp = { status: 404, data: { error: { code: 'MODEL_NOT_FOUND' } } };
    error = svc._mapDownstreamError(resp);
    expect(error.code).toBe('MODEL_NOT_FOUND');
    expect(error.statusCode).toBe(404);

    // TIMEOUT
    resp = { status: 504, data: { error: { code: 'TIMEOUT' } } };
    error = svc._mapDownstreamError(resp);
    expect(error.code).toBe('TIMEOUT');
    expect(error.statusCode).toBe(504);

    // Default 404
    resp = { status: 404, data: {} };
    error = svc._mapDownstreamError(resp);
    expect(error.code).toBe('MODEL_NOT_FOUND');

    // Default 5xx
    resp = { status: 500, data: {} };
    error = svc._mapDownstreamError(resp);
    expect(error.code).toBe('UPSTREAM_ERROR');
  });

  test('predict caches inline responses but not mask_url', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: {},
      data: { mask_url: 'http://example.com/mask', mask_base64: 'base64data' },
    });

    // Inline should not cache
    const input = { bbox: [80, 7, 81, 8], return: 'inline' };
    await svc.predict(input, 'corr-1');
    expect(lastSetExTTL).toBeNull();

    // mask_url should cache
    input.return = 'mask_url';
    await svc.predict(input, 'corr-2');
    expect(lastSetExTTL).toBe(86400);
  });

  test('detectBoundaries validates bbox and calls predict', async () => {
    const svc = new MLGatewayService();
    const predictSpy = jest.spyOn(svc, 'predict').mockResolvedValue({
      result: {
        data: {
          request_id: 'req-1',
          model: { name: 'unet', version: '1.0.0' },
          mask_url: 'http://example.com/mask',
        },
      },
    });

    const result = await svc.detectBoundaries([80, 7, 81, 8], { correlationId: 'corr-1' });
    expect(result.maskUrl).toBe('http://example.com/mask');
    expect(predictSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: [80, 7, 81, 8],
        model_version: '1.0.0',
        return: 'mask_url',
      }),
      'corr-1'
    );
  });

  test('detectBoundaries rejects invalid bbox', async () => {
    const svc = new MLGatewayService();

    // Not array
    await expect(svc.detectBoundaries('invalid')).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      statusCode: 400,
    });

    // Wrong length
    await expect(svc.detectBoundaries([80, 7, 81])).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });

    // Non-numeric
    await expect(svc.detectBoundaries([80, 'invalid', 81, 8])).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });

    // min >= max
    await expect(svc.detectBoundaries([81, 8, 80, 7])).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });

    // Out of range
    await expect(svc.detectBoundaries([-200, 7, 81, 8])).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  test('getDisasterAssessment returns mock assessment', async () => {
    const svc = new MLGatewayService();
    const result = await svc.getDisasterAssessment('field-1');
    expect(result).toHaveProperty('risk_level', 'low');
    expect(result).toHaveProperty('disaster_types');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('assessed_at');
  });

  test('yieldPredict caches and normalizes response', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'yield-1.0.0' },
      data: {
        predictions: [
          { field_id: 'field-1', optimal_yield: 5000 },
          { field_id: 'field-2' }, // missing values should be filled
        ],
      },
    });

    const input = { features: [{ field_id: 'field-1', ndvi: 0.5 }] };
    const result = await svc.yieldPredict(input, 'corr-1');

    expect(result.cacheHit).toBe(false);
    expect(result.result.success).toBe(true);
    expect(result.result.data.predictions[0].optimal_yield).toBe(5000);
    expect(result.result.data.predictions[1].optimal_yield).toBe(5500); // default
    expect(result.result.data.predictions[1].harvest_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Second call should hit cache
    const cached = await svc.yieldPredict(input, 'corr-2');
    expect(cached.cacheHit).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('getMLGatewayService returns singleton', () => {
    const { getMLGatewayService } = require('../../src/services/mlGateway.service');
    const svc1 = getMLGatewayService();
    const svc2 = getMLGatewayService();
    expect(svc1).toBeInstanceOf(MLGatewayService);
    expect(svc1).toBe(svc2);
  });
});