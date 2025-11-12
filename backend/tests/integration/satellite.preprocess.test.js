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
  async setex(key, ttl, value) {
    return this.setEx(key, ttl, value);
  },
  async del(keys) {
    if (Array.isArray(keys)) {
      let count = 0;
      for (const k of keys) {
        if (redisStore.delete(k)) count += 1;
      }
      return count;
    }
    return redisStore.delete(keys) ? 1 : 0;
  },
  async incr(key) {
    const current = Number(redisStore.get(key) || 0);
    const next = current + 1;
    redisStore.set(key, String(next));
    return next;
  },
  async expire(_key, _ttl) {
    return 1;
  },
  async scan(_cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(redisStore.keys()).filter((k) => (!MATCH ? true : new RegExp(String(MATCH)).test(k)));
    return ['0', keys];
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

// Mock axios.post for Sentinel Hub OAuth and Process API
jest.spyOn(axios, 'post').mockImplementation(async (url, data, config) => {
  if (url.includes('/oauth/token')) {
    return {
      status: 200,
      data: { access_token: 'test-access-token', expires_in: 3600 },
    };
  }
  if (url.includes('/api/v1/process')) {
    // Return a small fake PNG-like payload
    const buf = Buffer.from('89504e470d0a1a0aFAKEPNG', 'utf8'); // not a real PNG, sufficient for test transport
    return {
      status: 200,
      data: buf,
      headers: { 'content-type': 'image/png' },
    };
  }
  return { status: 500, data: {} };
});

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SENTINELHUB_BASE_URL = 'https://services.sentinel-hub.com';
process.env.SENTINELHUB_TOKEN_URL = 'https://services.sentinel-hub.com/oauth/token';
process.env.SENTINELHUB_CLIENT_ID = 'client-id';
process.env.SENTINELHUB_CLIENT_SECRET = 'client-secret';
process.env.SATELLITE_TILE_TTL_SECONDS = '1'; // keep short in tests

const app = require('../../src/app');

describe('POST /api/v1/satellite/preprocess', () => {
  const path = '/api/v1/satellite/preprocess';

  beforeEach(() => {
    redisStore.clear();
  });

  it('happy path preprocess -> 202 with {job_id,status}', async () => {
    const payload = {
      bbox: [80.10, 7.20, 80.50, 7.80],
      date: '2025-10-10',
      bands: ['RGB'],
      cloud_mask: false,
    };

    const res = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .send(payload)
      .expect(202);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('job_id');
    expect(res.body.data).toHaveProperty('status');
    expect(typeof res.body.data.job_id).toBe('string');
  });

  it('Idempotency-Key with same payload returns same job_id', async () => {
    const payload = {
      bbox: [80.10, 7.20, 80.50, 7.80],
      date: '2025-10-10',
      bands: ['RGB', 'NIR'],
      cloud_mask: true,
    };
    const idemKey = 'req-123';

    const r1 = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .set('Idempotency-Key', idemKey)
      .send(payload)
      .expect(202);

    const r2 = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .set('Idempotency-Key', idemKey)
      .send(payload)
      .expect(202);

    expect(r1.body.data.job_id).toBe(r2.body.data.job_id);
  });

  it('GET /api/v1/satellite/preprocess/{job_id} returns status for existing job', async () => {
    const payload = {
      bbox: [80.10, 7.20, 80.50, 7.80],
      date: '2025-10-10',
      bands: ['RGB'],
    };
    const r = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .send(payload)
      .expect(202);

    const jobId = r.body.data.job_id;
    const rStatus = await request(app)
      .get(`/api/v1/satellite/preprocess/${jobId}`)
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(rStatus.body.success).toBe(true);
    expect(rStatus.body.data).toHaveProperty('job_id', jobId);
    expect(['queued', 'processing', 'completed', 'failed']).toContain(rStatus.body.data.status);
  });

  it('validation: bad bbox -> 400', async () => {
    const res = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .send({ bbox: [1, 2, 1, 3], date: '2025-10-10', bands: ['RGB'] }) // minLon >= maxLon
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});