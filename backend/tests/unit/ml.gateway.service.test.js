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
    process.env.ML_BASE_URL = 'http://ml-service.local:8001';
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
});