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
    process.env.MLPREDICTCACHETTLSECONDS = '86400';
    process.env.MLREQUESTTIMEOUTMS = '60000';
    process.env.MLBASEURL = 'http://ml-service.local:80';
    process.env.MLINTERNALTOKEN = 'test-internal-token';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('normalizePayload + computeRequestHash are stable regardless of key order', () => {
    const svc = new MLGatewayService();

    const a = svc.normalizePayload({
      bbox: [80.1, 7.2, 80.12, 7.22],
      date: '2025-10-15',
      modelversion: '1.0.0',
      tiling: { overlap: 64, size: 512 },
      return: 'maskurl',
    });

    const b = svc.normalizePayload({
      date: '2025-10-15',
      tiling: { size: 512, overlap: 64 },
      bbox: [80.1, 7.2, 80.12, 7.22],
      return: 'maskurl',
      modelversion: '1.0.0',
    });

    const ha = svc.computeRequestHash(a);
    const hb = svc.computeRequestHash(b);

    expect(ha).toBe(hb);
  });

  test('cache key/TTL logic: caches successful maskurl responses with configured TTL', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'unet-1.0.0' },
      data: {
        requestid: 'req-1',
        model: { name: 'unet', version: '1.0.0' },
        maskurl: 'http://ml.local/masks/req-1.geojson',
        maskformat: 'geojson',
        metrics: { latencyms: 100, tilecount: 1, cloudcoverage: 0.0 },
        warnings: [],
      },
    });

    const input = {
      bbox: [80.1, 7.2, 80.12, 7.22],
      date: '2025-10-15',
      modelversion: '1.0.0',
      return: 'maskurl',
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

  test('error mapping: INVALIDINPUT -> 400', async () => {
    const svc = new MLGatewayService();
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 400,
      headers: {},
      data: {
        error: { code: 'INVALIDINPUT', message: 'bbox invalid', details: { bbox: 'min>=max' } },
      },
    });

    const input = {
      bbox: [80.2, 7.3, 80.1, 7.1], // invalid extents but route-level validation is not applied in unit
      date: '2025-10-15',
      return: 'maskurl',
    };

    await expect(svc.predict(input, 'corr-3')).rejects.toMatchObject({
      code: 'INVALIDINPUT',
      statusCode: 400,
    });
  });

  test('init initializes redis client', async () => {
    const svc = new MLGatewayService();
    svc.redis = null;
    await svc.init();
    expect(svc.redis).toBe(fakeRedisClient);
  });

  test('stableStringify sorts object keys for consistent hashing', () => {
    const svc = new MLGatewayService();
    const obj1 = { b: 2, a: 1 };
    const obj2 = { a: 1, b: 2 };
    expect(svc.stableStringify(obj1)).toBe(svc.stableStringify(obj2));
  });

  test('sha1 computes SHA1 hash', () => {
    const svc = new MLGatewayService();
    const hash = svc.sha1('test');
    expect(hash).toMatch(/^[a-f0-9]{40}$/);
  });

  test('normalizePayload handles all input variations', () => {
    const svc = new MLGatewayService();
    const input = {
      bbox: ['80.1', '7.2', '80.12', '7.22'],
      field_id: 'field-1',
      date: 20251015,
      modelversion: 1.0,
      tiling: { size: '512', overlap: '64' },
      return: 'inline',
    };
    const result = svc.normalizePayload(input);
    expect(result.bbox).toEqual([80.1, 7.2, 80.12, 7.22]);
    expect(result.field_id).toBe('field-1');
    expect(result.date).toBe('20251015');
    expect(result.modelversion).toBe('1');
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
      rows: [
        ['1', '2'],
        ['3', '4'],
      ],
      featurenames: ['ndvi', 'ndwi'],
      modelversion: 2.0,
    };
    const result = svc.normalizeYieldPayload(input);
    expect(result.features[0]).toEqual({ field_id: 'field-1', ndvi: 0.5, ndwi: 0.2 });
    expect(result.rows).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(result.featurenames).toEqual(['ndvi', 'ndwi']);
    expect(result.modelversion).toBe('2');
  });

  test('computeRequestHash generates consistent hash', () => {
    const svc = new MLGatewayService();
    const payload1 = { a: 1, b: 2 };
    const payload2 = { b: 2, a: 1 };
    expect(svc.computeRequestHash(payload1)).toBe(svc.computeRequestHash(payload2));
  });

  test('cacheKey and yieldCacheKey generate correct keys', () => {
    const svc = new MLGatewayService();
    expect(svc.cacheKey('hash')).toBe('ml:segmentation:predict:hash');
    expect(svc.yieldCacheKey('hash')).toBe('ml:yield:predict:hash');
  });

  test('estimateHarvestDate returns date 4 months from now', () => {
    const svc = new MLGatewayService();
    const date = svc.estimateHarvestDate();
    const now = new Date();
    const expected = new Date(now);
    expected.setMonth(now.getMonth() + 4);
    expect(date).toBe(expected.toISOString().split('T')[0]);
  });

  test('getPreviousSeasonYield returns fixed value', () => {
    const svc = new MLGatewayService();
    expect(svc.getPreviousSeasonYield('field-1')).toBe(4800);
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

  test('callML makes correct axios request and handles success', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': '1.0.0' },
      data: { result: 'success' },
    });
    const payload = { bbox: [80, 7, 81, 8] };
    const result = await svc.callML(payload, 'corr-1');
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

  test('callML handles axios errors', async () => {
    const svc = new MLGatewayService();
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('Network error'));
    await expect(svc.callML({}, 'corr-1')).rejects.toMatchObject({
      code: 'UPSTREAMERROR',
      statusCode: 502,
    });
  });

  test('callYieldML makes correct request for yield prediction', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: {},
      data: { predictions: [] },
    });
    const payload = { features: [] };
    const result = await svc.callYieldML(payload, 'corr-1');
    expect(result.ok).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      'http://ml-service.local:80/v1/yield/predict',
      payload,
      expect.any(Object)
    );
  });

  test('mapDownstreamError maps various error codes', () => {
    const svc = new MLGatewayService();

    // INVALIDINPUT
    let resp = { status: 400, data: { error: { code: 'INVALIDINPUT', message: 'bad input' } } };
    let error = svc.mapDownstreamError(resp);
    expect(error.code).toBe('INVALIDINPUT');
    expect(error.statusCode).toBe(400);

    // MODELNOTFOUND
    resp = { status: 404, data: { error: { code: 'MODELNOTFOUND' } } };
    error = svc.mapDownstreamError(resp);
    expect(error.code).toBe('MODELNOTFOUND');
    expect(error.statusCode).toBe(404);

    // TIMEOUT
    resp = { status: 504, data: { error: { code: 'TIMEOUT' } } };
    error = svc.mapDownstreamError(resp);
    expect(error.code).toBe('TIMEOUT');
    expect(error.statusCode).toBe(504);

    // Default 404
    resp = { status: 404, data: {} };
    error = svc.mapDownstreamError(resp);
    expect(error.code).toBe('MODELNOTFOUND');

    // Default 5xx
    resp = { status: 500, data: {} };
    error = svc.mapDownstreamError(resp);
    expect(error.code).toBe('UPSTREAMERROR');
  });

  test('predict caches inline responses but not maskurl', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: {},
      data: { maskurl: 'http://example.com/mask', maskbase64: 'base64data' },
    });

    // Inline should not cache
    const input = { bbox: [80, 7, 81, 8], return: 'inline' };
    await svc.predict(input, 'corr-1');
    expect(lastSetExTTL).toBeNull();

    // maskurl should cache
    input.return = 'maskurl';
    await svc.predict(input, 'corr-2');
    expect(lastSetExTTL).toBe(86400);
  });

  test('detectBoundaries validates bbox and calls predict', async () => {
    const svc = new MLGatewayService();
    const predictSpy = jest.spyOn(svc, 'predict').mockResolvedValue({
      result: {
        data: {
          requestid: 'req-1',
          model: { name: 'unet', version: '1.0.0' },
          maskurl: 'http://example.com/mask',
        },
      },
    });

    const result = await svc.detectBoundaries([80, 7, 81, 8], { correlationId: 'corr-1' });
    expect(result.maskUrl).toBe('http://example.com/mask');
    expect(predictSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: [80, 7, 81, 8],
        modelversion: '1.0.0',
        return: 'maskurl',
      }),
      'corr-1'
    );
  });

  test('detectBoundaries rejects invalid bbox', async () => {
    const svc = new MLGatewayService();

    // Not array
    await expect(svc.detectBoundaries('invalid')).rejects.toMatchObject({
      code: 'INVALIDINPUT',
      statusCode: 400,
    });

    // Wrong length
    await expect(svc.detectBoundaries([80, 7, 81])).rejects.toMatchObject({
      code: 'INVALIDINPUT',
    });

    // Non-numeric
    await expect(svc.detectBoundaries([80, 'invalid', 81, 8])).rejects.toMatchObject({
      code: 'INVALIDINPUT',
    });

    // min >= max
    await expect(svc.detectBoundaries([81, 8, 80, 7])).rejects.toMatchObject({
      code: 'INVALIDINPUT',
    });

    // Out of range
    await expect(svc.detectBoundaries([-200, 7, 81, 8])).rejects.toMatchObject({
      code: 'INVALIDINPUT',
    });
  });

  test('getDisasterAssessment returns mock assessment', async () => {
    const svc = new MLGatewayService();
    const result = await svc.getDisasterAssessment('field-1');
    expect(result).toHaveProperty('risklevel', 'low');
    expect(result).toHaveProperty('disastertypes');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('assessedat');
  });

  test('yieldPredict caches and normalizes response', async () => {
    const svc = new MLGatewayService();
    const spy = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'yield-1.0.0' },
      data: {
        predictions: [
          { field_id: 'field-1', optimalyield: 5000 },
          { field_id: 'field-2' }, // missing values should be filled
        ],
      },
    });

    const input = { features: [{ field_id: 'field-1', ndvi: 0.5 }] };
    const result = await svc.yieldPredict(input, 'corr-1');

    expect(result.cacheHit).toBe(false);
    expect(result.result.success).toBe(true);
    expect(result.result.data.predictions[0].optimalyield).toBe(5000);
    expect(result.result.data.predictions[1].optimalyield).toBe(5500); // default
    expect(result.result.data.predictions[1].harvestdate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

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
