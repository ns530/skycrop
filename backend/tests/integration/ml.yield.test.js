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
process.env.ML_BASE_URL = 'http://ml-service.local:80';
process.env.ML_INTERNAL_TOKEN = 'test-internal-token';
process.env.ML_REQUEST_TIMEOUT_MS = '60000';

const app = require('../../src/app');

describe('POST /api/v1/ml/yield/predict', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('happy path: returns yield prediction with cache miss then hit', async () => {
    const spy = jest.spyOn(axios, 'post').mockImplementation(async (_url, body) => {
      return {
        status: 200,
        headers: { 'x-model-version': 'rf-1.0.0' },
        data: {
          request_id: 'yield-req-abc',
          model: { name: 'random_forest', version: '1.0.0' },
          predictions: [{
            field_id: '11111111-1111-4111-8111-111111111111',
            yield_kg_per_ha: 4500,
            confidence_lower: 4050,
            confidence_upper: 4950,
            features_used: ['ndvi', 'precipitation', 'temperature', 'soil_moisture']
          }],
          metadata: {
            processing_time_ms: 150,
            model_version: 'rf-1.0.0'
          }
        },
      };
    });

    const payload = {
      features: [{
        field_id: '11111111-1111-4111-8111-111111111111',
        ndvi: 0.7,
        precipitation: 120,
        temperature: 25,
        soil_moisture: 0.6
      }]
    };

    const res1 = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'yield-req-1')
      .send(payload)
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data.predictions).toHaveLength(1);
    expect(res1.body.data.predictions[0]).toMatchObject({
      field_id: '11111111-1111-4111-8111-111111111111',
      yield_kg_per_ha: 4500,
      confidence_lower: 4050,
      confidence_upper: 4950,
    });
    expect(res1.body.meta).toMatchObject({ cache_hit: false, correlation_id: 'yield-req-1' });
    expect(spy).toHaveBeenCalledTimes(1);

    const res2 = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'yield-req-2')
      .send(payload)
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cache_hit: true, correlation_id: 'yield-req-2' });
    // downstream axios not called again due to cache
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('validation: missing features array -> 400', async () => {
    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validation: empty features array -> 400', async () => {
    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .send({ features: [] })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('downstream error mapping: 400 INVALID_INPUT', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 400,
      headers: {},
      data: { error: { code: 'INVALID_INPUT', message: 'Invalid field features', details: { ndvi: 'must be between 0 and 1' } } },
    });

    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .send({
        features: [{
          field_id: '11111111-1111-4111-8111-111111111111',
          ndvi: 1.5, // invalid
          precipitation: 120,
          temperature: 25,
          soil_moisture: 0.6
        }]
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('propagates X-Request-Id into meta.correlation_id', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'rf-1.0.0' },
      data: {
        request_id: 'yield-req-xyz',
        model: { name: 'random_forest', version: '1.0.0' },
        predictions: [{
          field_id: 'field-123',
          yield_kg_per_ha: 4200,
          confidence_lower: 3780,
          confidence_upper: 4620,
          features_used: ['ndvi', 'precipitation', 'temperature', 'soil_moisture']
        }],
        metadata: {
          processing_time_ms: 120,
          model_version: 'rf-1.0.0'
        }
      },
    });

    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'yield-corr-xyz')
      .send({
        features: [{
          field_id: 'field-123',
          ndvi: 0.65,
          precipitation: 100,
          temperature: 22,
          soil_moisture: 0.55
        }]
      })
      .expect(200);

    expect(res.body.meta.correlation_id).toBe('yield-corr-xyz');
  });
});