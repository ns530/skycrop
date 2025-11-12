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
process.env.SATELLITE_TILE_TTL_SECONDS = '21600';

const app = require('../../src/app');

describe('GET /api/v1/satellite/tiles/{z}/{x}/{y}', () => {
  const basePath = '/api/v1/satellite/tiles';

  beforeEach(() => {
    redisStore.clear();
  });

  it('returns 200 image with ETag and Cache-Control on first request, then 304 on If-None-Match', async () => {
    const z = 12;
    const x = 3567;
    const y = 2150;
    const date = '2025-10-10';
    const url = `${basePath}/${z}/${x}/${y}?date=${date}&bands=RGB`;

    // First call -> 200 with headers
    const res1 = await request(app)
      .get(url)
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res1.headers).toHaveProperty('etag');
    expect(res1.headers).toHaveProperty('cache-control');
    expect(res1.headers['cache-control']).toMatch(/public/);
    expect(res1.headers).toHaveProperty('content-type');
    expect(res1.headers['content-type']).toMatch(/image\/png|image\/jpeg/);

    const etag = res1.headers.etag;
    expect(typeof etag).toBe('string');

    // Second call with If-None-Match -> 304
    const res2 = await request(app)
      .get(url)
      .set('Authorization', 'Bearer token')
      .set('If-None-Match', etag)
      .expect(304);

    expect(res2.text).toBeDefined();
  });

  it('validates bad z/x/y (negative) -> 400', async () => {
    const res = await request(app)
      .get(`${basePath}/-1/0/0?date=2025-10-10`)
      .set('Authorization', 'Bearer token')
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
  });

  it('validates bad date format -> 400', async () => {
    const res = await request(app)
      .get(`${basePath}/1/1/1?date=20251010`)
      .set('Authorization', 'Bearer token')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('validates bad bands -> 400', async () => {
    const res = await request(app)
      .get(`${basePath}/1/1/1?date=2025-10-10&bands=FOO`)
      .set('Authorization', 'Bearer token')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});