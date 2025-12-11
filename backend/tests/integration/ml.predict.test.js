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
process.env.MLPREDICTCACHETTLSECONDS = '86400';
process.env.MLREQUESTTIMEOUTMS = '60000';

const app = require('../../src/app');

describe('POST /api/v1/ml/segmentation/predict', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('happy path (bbox, maskurl): cache miss then hit', async () => {
    const spy = jest.spyOn(axios, 'post').mockImplementation(async (url, body) => {
      return {
        status: 200,
        headers: {
          'x-model-version': body.modelversion ? `unet-${body.modelversion}` : 'unet-1.0.0',
        },
        data: {
          requestid: 'req-abc',
          model: { name: 'unet', version: body.modelversion || '1.0.0' },
          maskurl: 'http://ml.local/masks/req-abc.geojson',
          maskformat: 'geojson',
          metrics: { latencyms: 100, tilecount: 1, cloudcoverage: 0.0 },
          warnings: [],
        },
      };
    });

    const payload = {
      bbox: [80.1, 7.2, 80.12, 7.22],
      date: '2025-10-15',
      modelversion: '1.0.0',
      return: 'maskurl',
    };

    const res1 = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'req-1')
      .send(payload)
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toMatchObject({
      maskurl: expect.any(String),
      maskformat: 'geojson',
      model: { name: 'unet', version: '1.0.0' },
    });
    expect(res1.body.meta).toMatchObject({ cachehit: false, correlationid: 'req-1' });
    expect(spy).toHaveBeenCalledTimes(1);

    const res2 = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'req-2')
      .send(payload)
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cachehit: true, correlationid: 'req-2' });
    // downstream axios not called again due to cache
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('inline return: returns maskbase64 and maskformat=geojson', async () => {
    jest.spyOn(axios, 'post').mockImplementation(async (url, body) => {
      if (body.return === 'inline') {
        return {
          status: 200,
          headers: { 'x-model-version': 'unet-1.0.0' },
          data: {
            requestid: 'req-inline',
            model: { name: 'unet', version: '1.0.0' },
            maskbase64: Buffer.from(
              JSON.stringify({ type: 'FeatureCollection', features: [] })
            ).toString('base64'),
            maskformat: 'geojson',
            metrics: { latencyms: 80, tilecount: 1, cloudcoverage: 0.0 },
            warnings: [],
          },
        };
      }
      return {
        status: 500,
        headers: {},
        data: { error: { code: 'UPSTREAMERROR', message: 'unexpected' } },
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
    expect(res.body.data).toHaveProperty('maskbase64');
    expect(res.body.data.maskformat).toBe('geojson');
    expect(res.body.meta).toMatchObject({ correlationid: 'inline-1' });
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
    expect(res.body.error.code).toBe('VALIDATIONERROR');
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
    expect(res.body.error.code).toBe('VALIDATIONERROR');
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
    expect(res.body.error.code).toBe('VALIDATIONERROR');
  });

  it('downstream error mapping: 400 INVALIDINPUT', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 400,
      headers: {},
      data: {
        error: { code: 'INVALIDINPUT', message: 'bbox invalid', details: { bbox: 'min>=max' } },
      },
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
    expect(res.body.error.code).toBe('INVALIDINPUT');
  });

  it('downstream error mapping: 404 MODELNOTFOUND', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 404,
      headers: {},
      data: {
        error: {
          code: 'MODELNOTFOUND',
          message: 'not available',
          details: { requested: '9.9.9' },
        },
      },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        bbox: [80.1, 7.2, 80.12, 7.22],
        date: '2025-10-10',
        modelversion: '9.9.9',
      })
      .expect(404);

    expect(res.body.error.code).toBe('MODELNOTFOUND');
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

  it('downstream error mapping: 501 NOTIMPLEMENTED', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 501,
      headers: {},
      data: { error: { code: 'NOTIMPLEMENTED', message: 'field_id not supported' } },
    });

    const res = await request(app)
      .post('/api/v1/ml/segmentation/predict')
      .set('Authorization', 'Bearer token')
      .send({
        field_id: '123e4567-e89b-12d3-a456-426614174000',
        date: '2025-10-10',
      })
      .expect(501);

    expect(res.body.error.code).toBe('NOTIMPLEMENTED');
  });

  it('propagates X-Request-Id into meta.correlationid', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'x-model-version': 'unet-1.0.0' },
      data: {
        requestid: 'req-xyz',
        model: { name: 'unet', version: '1.0.0' },
        maskurl: 'http://ml.local/masks/req-xyz.geojson',
        maskformat: 'geojson',
        metrics: { latencyms: 50, tilecount: 1, cloudcoverage: 0.0 },
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

    expect(res.body.meta.correlationid).toBe('corr-xyz');
  });
});
