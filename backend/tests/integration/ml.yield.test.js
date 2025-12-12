const request = require('supertest');
const axios = require('axios');

// Mock rate limiter to no-op for tests
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
}));

// Mock auth middleware to inject a test user
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { user_id: 'user-1' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  requireAnyRole: () => (req, res, next) => next(),
}));

// In-memory fake Redis
const redisStore = new Map();
const fakeRedisClient = {
  isOpen: true,
  async get(key) {
    return redisStore.has(key) ? redisStore.get(key) : null;
  },
  async setEx(key, ttl, value) {
    redisStore.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
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
process.env.JWTSECRET = 'test-secret';
process.env.MLBASEURL = 'http://ml-service.local:80';
process.env.MLINTERNALTOKEN = 'test-internal-token';
process.env.MLREQUESTTIMEOUTMS = '60000';

const app = require('../../src/app');

describe('POST /api/v1/ml/yield/predict', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('happy path: returns yield prediction with cache miss then hit', async () => {
    const spy = jest.spyOn(axios, 'post').mockImplementation(async (_url, _body) => {
      return {
        status: 200,
        headers: { 'x-model-version': 'rf-1.0.0' },
        data: {
          requestid: 'yield-req-abc',
          model: { name: 'randomforest', version: '1.0.0' },
          predictions: [
            {
              field_id: '11111111-1111-4111-8111-111111111111',
              yieldkgperha: 4500,
              confidencelower: 4050,
              confidenceupper: 4950,
              featuresused: ['ndvi', 'precipitation', 'temperature', 'soilmoisture'],
            },
          ],
          metadata: {
            processingtimems: 150,
            modelversion: 'rf-1.0.0',
          },
        },
      };
    });

    const payload = {
      features: [
        {
          field_id: '11111111-1111-4111-8111-111111111111',
          ndvi: 0.7,
          precipitation: 120,
          temperature: 25,
          soilmoisture: 0.6,
        },
      ],
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
      yieldkgperha: 4500,
      confidencelower: 4050,
      confidenceupper: 4950,
    });
    expect(res1.body.meta).toMatchObject({ cachehit: false, correlationid: 'yield-req-1' });
    expect(spy).toHaveBeenCalledTimes(1);

    const res2 = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'yield-req-2')
      .send(payload)
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cachehit: true, correlationid: 'yield-req-2' });
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
    expect(res.body.error.code).toBe('VALIDATIONERROR');
  });

  it('validation: empty features array -> 400', async () => {
    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .send({ features: [] })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATIONERROR');
  });

  it('downstream error mapping: 400 INVALIDINPUT', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 400,
      headers: {},
      data: {
        error: {
          code: 'INVALIDINPUT',
          message: 'Invalid field features',
          details: { ndvi: 'must be between 0 and 1' },
        },
      },
    });

    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .send({
        features: [
          {
            field_id: '11111111-1111-4111-8111-111111111111',
            ndvi: 1.5, // invalid
            precipitation: 120,
            temperature: 25,
            soilmoisture: 0.6,
          },
        ],
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALIDINPUT');
  });

  it('propagates X-Request-Id into meta.correlationid', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'rf-1.0.0' },
      data: {
        requestid: 'yield-req-xyz',
        model: { name: 'randomforest', version: '1.0.0' },
        predictions: [
          {
            field_id: 'field-123',
            yieldkgperha: 4200,
            confidencelower: 3780,
            confidenceupper: 4620,
            featuresused: ['ndvi', 'precipitation', 'temperature', 'soilmoisture'],
          },
        ],
        metadata: {
          processingtimems: 120,
          modelversion: 'rf-1.0.0',
        },
      },
    });

    const res = await request(app)
      .post('/api/v1/ml/yield/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'yield-corr-xyz')
      .send({
        features: [
          {
            field_id: 'field-123',
            ndvi: 0.65,
            precipitation: 100,
            temperature: 22,
            soilmoisture: 0.55,
          },
        ],
      })
      .expect(200);

    expect(res.body.meta.correlationid).toBe('yield-corr-xyz');
  });
});
