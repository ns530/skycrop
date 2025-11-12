'use strict';

const request = require('supertest');
const axios = require('axios');

// Mock rate limiter to no-op for tests
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (_req, _res, next) => next(),
  authLimiter: (_req, _res, next) => next(),
}));

// Mock auth middleware to inject a test user
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requireAnyRole: () => (_req, _res, next) => next(),
}));

// In-memory fake Redis
const redisStore = new Map();
const fakeRedisClient = {
  isOpen: true,
  async get(key) {
    return redisStore.has(key) ? redisStore.get(key) : null;
  },
  async setEx(key, _ttl, value) {
    redisStore.set(key, value);
    return 'OK';
  },
  async setex(key, _ttl, value) {
    redisStore.set(key, value);
    return 'OK';
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.ML_BASE_URL = 'http://ml-service.local:8001';
process.env.ML_INTERNAL_TOKEN = 'test-internal-token';
process.env.ML_PREDICT_CACHE_TTL_SECONDS = '86400';
process.env.ML_REQUEST_TIMEOUT_MS = '60000';

const app = require('../../src/app');

describe('POST /api/v1/ml/segmentation/predict', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('happy path (bbox, mask_url): cache miss then hit', async () => {
    const spy = jest.spyOn(axios, 'post').mockImplementation(async (_url, body) => {
      return {
        status: 200,
        headers: { 'x-model-version': body.model_version ? `unet-${body.model_version}` : 'unet-1.0.0' },
        data: {
          request_id: 'req-abc',
          model: { name: 'unet', version: body.model_version || '1.0.0' },
          mask_url: 'http://ml.local/masks/req-abc.geojson',
          mask_format: 'geojson',
          metrics: { latency_ms: 100, tile_count: 1, cloud_coverage: 0.0 },
          warnings: [],
        },
      };
    });

    const payload = {
      bbox: [80.1, 7.2, 80.12, 7.22],
      date: '2025-10-15',
      model_version: '1.0.0',
      return: 'mask_url',
    };

    const res1 = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'req-1')
      .send(payload)
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toMatchObject({
      mask_url: expect.any(String),
      mask_format: 'geojson',
      model: { name: 'unet', version: '1.0.0' },
    });
    expect(res1.body.meta).toMatchObject({ cache_hit: false, correlation_id: 'req-1' });
    expect(spy).toHaveBeenCalledTimes(1);

    const res2 = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'req-2')
      .send(payload)
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cache_hit: true, correlation_id: 'req-2' });
    // downstream axios not called again due to cache
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('inline return: returns mask_base64 and mask_format=geojson', async () => {
    jest.spyOn(axios, 'post').mockImplementation(async (_url, body) => {
      if (body.return === 'inline') {
        return {
          status: 200,
          headers: { 'x-model-version': 'unet-1.0.0' },
          data: {
            request_id: 'req-inline',
            model: { name: 'unet', version: '1.0.0' },
            mask_base64: Buffer.from(JSON.stringify({ type: 'FeatureCollection', features: [] })).toString('base64'),
            mask_format: 'geojson',
            metrics: { latency_ms: 80, tile_count: 1, cloud_coverage: 0.0 },
            warnings: [],
          },
        };
      }
      return {
        status: 500,
        headers: {},
        data: { error: { code: 'UPSTREAM_ERROR', message: 'unexpected' } },
      };
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'inline-1')
      .send({
        bbox: [80.1, 7.2, 80.11, 7.21],
        date: '2025-10-10',
        return: 'inline',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('mask_base64');
    expect(res.body.data.mask_format).toBe('geojson');
    expect(res.body.meta).toMatchObject({ correlation_id: 'inline-1' });
  });

  it('validation: both bbox and field_id -> 400', async () => {
    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        bbox: [80.1, 7.2, 80.12, 7.22],
        field_id: '11111111-1111-1111-1111-111111111111',
        date: '2025-10-10',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validation: neither bbox nor field_id -> 400', async () => {
    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        date: '2025-10-10',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validation: bad bbox ranges -> 400', async () => {
    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        bbox: [80.2, 7.3, 80.1, 7.1], // min>=max
        date: '2025-10-10',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('downstream error mapping: 400 INVALID_INPUT', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 400,
      headers: {},
      data: { error: { code: 'INVALID_INPUT', message: 'bbox invalid', details: { bbox: 'min>=max' } } },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        bbox: [80.1, 7.2, 80.12, 7.22],
        date: '2025-10-10',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('downstream error mapping: 404 MODEL_NOT_FOUND', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 404,
      headers: {},
      data: { error: { code: 'MODEL_NOT_FOUND', message: 'not available', details: { requested: '9.9.9' } } },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        bbox: [80.1, 7.2, 80.12, 7.22],
        date: '2025-10-10',
        model_version: '9.9.9',
      })
      .expect(404);

    expect(res.body.error.code).toBe('MODEL_NOT_FOUND');
  });

  it('downstream error mapping: 504 TIMEOUT', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 504,
      headers: {},
      data: { error: { code: 'TIMEOUT', message: 'timed out' } },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        bbox: [80.1, 7.2, 80.12, 7.22],
        date: '2025-10-10',
      })
      .expect(504);

    expect(res.body.error.code).toBe('TIMEOUT');
  });

  it('downstream error mapping: 501 NOT_IMPLEMENTED', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 501,
      headers: {},
      data: { error: { code: 'NOT_IMPLEMENTED', message: 'field_id not supported' } },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        field_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2025-10-10',
      })
      .expect(501);

    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });

  it('propagates X-Request-Id into meta.correlation_id', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'unet-1.0.0' },
      data: {
        request_id: 'req-xyz',
        model: { name: 'unet', version: '1.0.0' },
        mask_url: 'http://ml.local/masks/req-xyz.geojson',
        mask_format: 'geojson',
        metrics: { latency_ms: 50, tile_count: 1, cloud_coverage: 0.0 },
        warnings: [],
      },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'corr-xyz')
      .send({
        bbox: [80.1, 7.2, 80.12, 7.22],
        date: '2025-10-10',
      })
      .expect(200);

    expect(res.body.meta.correlation_id).toBe('corr-xyz');
  });
});