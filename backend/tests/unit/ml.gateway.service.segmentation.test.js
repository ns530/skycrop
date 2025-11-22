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

describe('MLGatewayService.detectBoundaries Unit', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    redisStore.clear();
    lastSetExTTL = null;

    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      // New ML-Service envs
      ML_SERVICE_URL: 'http://ml-service.local:8001',
      ML_SERVICE_TOKEN: 'unet-token',
      MODEL_UNET_VERSION: '1.0.0',
      // Existing gateway envs (fallbacks still supported)
      ML_BASE_URL: 'http://ml-service.local:8001',
      ML_INTERNAL_TOKEN: 'test-internal-token',
      ML_PREDICT_CACHE_TTL_SECONDS: '86400',
      ML_REQUEST_TIMEOUT_MS: '60000',
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  test('happy path: returns normalized structure (maskUrl) and propagates Authorization + X-Model-Version header from options', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockImplementation(async (url, body, config) => {
      // URL formation
      expect(url).toMatch(/\/v1\/segmentation\/predict$/);
      // Header propagation
      expect(config && config.headers).toBeTruthy();
      expect(config.headers.Authorization).toBe('Bearer unet-token');
      expect(config.headers['X-Model-Version']).toBe('2.0.0');

      // Body composition
      expect(body).toMatchObject({
        bbox: [80.1, 7.2, 80.12, 7.22],
        model_version: '2.0.0',
      });

      return {
        status: 200,
        headers: { 'x-model-version': 'unet-2.0.0' },
        data: {
          request_id: 'req-abc',
          model: { name: 'unet', version: '2.0.0' },
          mask_url: 'http://ml.local/masks/req-abc.geojson',
          mask_format: 'geojson',
          metrics: { latency_ms: 42 },
          warnings: [],
        },
      };
    });

    const svc = new MLGatewayService();
    const out = await svc.detectBoundaries([80.1, 7.2, 80.12, 7.22], { modelVersion: '2.0.0', returnFormat: 'url' });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(out).toEqual(
      expect.objectContaining({
        requestId: 'req-abc',
        model: { name: 'unet', version: '2.0.0' },
        maskUrl: expect.stringContaining('http://ml.local/masks/req-abc.geojson'),
        maskBase64: null,
        metadata: expect.objectContaining({ metrics: { latency_ms: 42 } }),
      }),
    );
  });

  test('header propagation: uses env MODEL_UNET_VERSION when options.modelVersion not provided', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockImplementation(async (_url, _body, config) => {
      expect(config.headers['X-Model-Version']).toBe('1.0.0'); // from env fallback
      return {
        status: 200,
        headers: { 'x-model-version': 'unet-1.0.0' },
        data: {
          request_id: 'req-env',
          model: { name: 'unet', version: '1.0.0' },
          mask_url: 'http://ml.local/masks/req-env.geojson',
          mask_format: 'geojson',
          metrics: { latency_ms: 10 },
          warnings: [],
        },
      };
    });

    const svc = new MLGatewayService();
    const out = await svc.detectBoundaries([80, 7, 80.1, 7.1], {});

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(out.model.version).toBe('1.0.0');
    expect(out.maskUrl).toContain('req-env.geojson');
  });

  test('error mapping: downstream 404 MODEL_NOT_FOUND is normalized and thrown', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 404,
      headers: {},
      data: { error: { code: 'MODEL_NOT_FOUND', message: 'not available', details: { requested: '9.9.9' } } },
    });

    const svc = new MLGatewayService();
    await expect(svc.detectBoundaries([80, 7, 80.1, 7.1], { modelVersion: '9.9.9' })).rejects.toMatchObject({
      code: 'MODEL_NOT_FOUND',
      statusCode: 404,
    });
  });

  test('input validation: bad bbox arrays reject fast and do not call downstream', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValue({ status: 500, data: {} });

    const svc = new MLGatewayService();

    // wrong length
    await expect(svc.detectBoundaries([80, 7, 80.1], {})).rejects.toMatchObject({ code: 'INVALID_INPUT', statusCode: 400 });

    // non-finite
    await expect(svc.detectBoundaries([NaN, 7, 80.1, 7.1], {})).rejects.toMatchObject({ code: 'INVALID_INPUT', statusCode: 400 });

    // min >= max
    await expect(svc.detectBoundaries([80.2, 7.2, 80.1, 7.1], {})).rejects.toMatchObject({ code: 'INVALID_INPUT', statusCode: 400 });

    // out of range
    await expect(svc.detectBoundaries([-181, 7, -180, 7.1], {})).rejects.toMatchObject({ code: 'INVALID_INPUT', statusCode: 400 });

    expect(postSpy).not.toHaveBeenCalled();
  });

  test('inline return: returns maskBase64 and preserves model/version', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'unet-1.0.0' },
      data: {
        request_id: 'req-inline',
        model: { name: 'unet', version: '1.0.0' },
        mask_base64: Buffer.from(JSON.stringify({ type: 'FeatureCollection', features: [] })).toString('base64'),
        mask_format: 'geojson',
        metrics: { latency_ms: 80 },
        warnings: [],
      },
    });

    const svc = new MLGatewayService();
    const out = await svc.detectBoundaries([80, 7, 80.1, 7.1], { returnFormat: 'inline' });

    expect(out.maskBase64).toEqual(expect.any(String));
    expect(out.maskUrl).toBeNull();
    expect(out.model.version).toBe('1.0.0');
  });
});