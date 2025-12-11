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
  async expire(key, ttl) {
    return 1;
  },
  async scan(cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(redisStore.keys()).filter(k =>
      !MATCH ? true : new RegExp(String(MATCH)).test(k)
    );
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
      data: { accesstoken: 'test-access-token', expiresin: 3600 },
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
process.env.JWTSECRET = 'test-secret';
process.env.SENTINELHUBBASEURL = 'https://services.sentinel-hub.com';
process.env.SENTINELHUBTOKENURL = 'https://services.sentinel-hub.com/oauth/token';
process.env.SENTINELHUBCLIENTID = 'client-id';
process.env.SENTINELHUBCLIENTSECRET = 'client-secret';
process.env.SATELLITETILETTLSECONDS = '1'; // keep short in tests

const app = require('../../src/app');

describe('POST /api/v1/satellite/preprocess', () => {
  const path = '/api/v1/satellite/preprocess';

  beforeEach(() => {
    redisStore.clear();
  });

  it('happy path preprocess -> 202 with {jobid,status}', async () => {
    const payload = {
      bbox: [80.1, 7.2, 80.5, 7.8],
      date: '2025-10-10',
      bands: ['RGB'],
      cloudmask: false,
    };

    const res = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .send(payload)
      .expect(202);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('jobid');
    expect(res.body.data).toHaveProperty('status');
    expect(typeof res.body.data.jobid).toBe('string');
  });

  it('Idempotency-Key with same payload returns same jobid', async () => {
    const payload = {
      bbox: [80.1, 7.2, 80.5, 7.8],
      date: '2025-10-10',
      bands: ['RGB', 'NIR'],
      cloudmask: true,
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

    expect(r1.body.data.jobid).toBe(r2.body.data.jobid);
  });

  it('GET /api/v1/satellite/preprocess/{jobid} returns status for existing job', async () => {
    const payload = {
      bbox: [80.1, 7.2, 80.5, 7.8],
      date: '2025-10-10',
      bands: ['RGB'],
    };
    const r = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .send(payload)
      .expect(202);

    const jobId = r.body.data.jobid;
    const rStatus = await request(app)
      .get(`/api/v1/satellite/preprocess/${jobId}`)
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(rStatus.body.success).toBe(true);
    expect(rStatus.body.data).toHaveProperty('jobid', jobId);
    expect(['queued', 'processing', 'completed', 'failed']).toContain(rStatus.body.data.status);
  });

  it('validation: bad bbox -> 400', async () => {
    const res = await request(app)
      .post(path)
      .set('Authorization', 'Bearer token')
      .send({ bbox: [1, 2, 1, 3], date: '2025-10-10', bands: ['RGB'] }) // minLon >= maxLon
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATIONERROR');
  });
});
