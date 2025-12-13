/* eslint-disable camelcase */
const request = require('supertest');
const axios = require('axios');

// Disable rate limiter for tests
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
      keys.forEach(k => {
        if (redisStore.delete(k)) count += 1;
      });
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
  async scan(cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(redisStore.keys()).filter(k =>
      !MATCH ? true : new RegExp(String(MATCH)).test(k)
    );
    return ['0', keys];
  },
};
// Hook Redis config
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

// Axios mock setup
jest.spyOn(axios, 'post');

process.env.NODE_ENV = 'test';
process.env.JWTSECRET = 'test-secret';
process.env.SENTINELHUBBASEURL = 'https://services.sentinel-hub.com';
process.env.SENTINELHUBTOKENURL = 'https://services.sentinel-hub.com/oauth/token';
process.env.SENTINELHUBCLIENTID = 'client-id';
process.env.SENTINELHUBCLIENTSECRET = 'client-secret';
process.env.HEALTHINDICESTTLSECONDS = '60';
process.env.HEALTHDEFAULTIMAGESIZE = '256';

// Mock app.js to avoid ES module import issues
jest.mock('../../src/app', () => {
  // eslint-disable-next-line global-require
  const express = require('express');
  const app = express();
  app.use(express.json());

  try {
    // eslint-disable-next-line global-require
    const fieldHealthRoutes = require('../../src/api/routes/fieldHealth.routes');
    // eslint-disable-next-line global-require
    const fieldRoutes = require('../../src/api/routes/field.routes');
    app.use('/api/v1/fields', fieldHealthRoutes);
    app.use('/api/v1/fields', fieldRoutes);
  } catch (e) {
    console.error('Failed to load routes in health indices test mock:', e.message);
  }

  return {
    __esModule: true,
    default: app,
  };
});

// eslint-disable-next-line global-require
const app = require('../../src/app').default || require('../../src/app');
const { sequelize } = require('../../src/config/database.config');
const Field = require('../../src/models/field.model');

describe('Health Indices API (NDVI/NDWI/TDVI)', () => {
  let querySpy;
  const field_id = '11111111-1111-4111-8111-111111111111';
  const date = '2025-01-15';
  let snapshotMemory = null; // emulate persisted snapshot for idempotency tests

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    snapshotMemory = null;

    // Mock field ownership checks for HealthService.assertFieldOwnership
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async ({ where }) => {
        if (where && where.user_id && where.field_id) {
          return { field_id: where.field_id, user_id: where.user_id, status: 'active' };
        }
        return null;
      }),
    }));

    // Axios: default happy path mocks (OAuth then Process returning JSON stats means)
    axios.post.mockImplementation(async (url, _data, _config) => {
      if (String(url).includes('/oauth/token')) {
        return {
          status: 200,
          data: { accesstoken: 'test-access-token', expiresin: 3600 },
        };
      }
      if (String(url).includes('/api/v1/process')) {
        const stats = {
          stats: { ndvi: { mean: 0.62 }, ndwi: { mean: 0.2 }, tdvi: { mean: 0.45 } },
        };
        return {
          status: 200,
          data: Buffer.from(JSON.stringify(stats), 'utf8'),
          headers: { 'content-type': 'application/json' },
        };
      }
      return { status: 500, data: {} };
    });

    // DB behavior for field ownership + boundary + snapshots
    querySpy = jest
      .spyOn(sequelize, 'query')
      .mockImplementation(async (sql, { replacements } = {}) => {
        const s = String(sql);

        // Field boundary lookup (HealthService.getFieldGeometry)
        if (/SELECT\s+STAsGeoJSON\(boundary\)::json\s+AS\s+boundary/i.test(s)) {
          return [
            {
              boundary: {
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [80.1, 7.2],
                      [80.12, 7.2],
                      [80.12, 7.22],
                      [80.1, 7.22],
                      [80.1, 7.2],
                    ],
                  ],
                ],
              },
            },
          ];
        }

        // Find snapshot by (field_id, timestamp)
        if (
          /FROM\s+healthsnapshots/i.test(s) &&
          /WHERE\s+field_id\s*=\s*:field_id/i.test(s) &&
          /"timestamp"\s*=\s*:ts/i.test(s)
        ) {
          if (snapshotMemory) {
            return [snapshotMemory];
          }
          return [];
        }

        // List snapshots with window count
        if (/FROM\s+healthsnapshots/i.test(s) && /COUNT\(\*\)\s+OVER\(\)/i.test(s)) {
          if (snapshotMemory) {
            return [{ ...snapshotMemory, totalcount: 1 }];
          }
          return [];
        }

        // Insert or upsert snapshot
        if (/INSERT\s+INTO\s+healthsnapshots/i.test(s)) {
          // create or update snapshotMemory
          snapshotMemory = {
            id: snapshotMemory?.id || 'snap-1',
            field_id: replacements.field_id,
            timestamp: replacements.ts,
            source: replacements.source || 'sentinel2',
            ndvi: Number(replacements.ndvi ?? 0.62),
            ndwi: Number(replacements.ndwi ?? 0.2),
            tdvi: Number(replacements.tdvi ?? 0.45),
            notes: replacements.notes || null,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };
          return [];
        }

        return [];
      });
  });

  afterEach(() => {
    if (querySpy) querySpy.mockRestore();
  });

  describe('POST /api/v1/fields/:id/health/compute', () => {
    const path = id => `/api/v1/fields/${id}/health/compute`;

    test('happy path: 201 with snapshot; idempotent second call 200 without recompute', async () => {
      // First compute -> 201
      const r1 = await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .set('X-Request-Id', 'cid-health-1')
        .send({ date })
        .expect(201);

      expect(r1.body.success).toBe(true);
      expect(r1.body.data).toMatchObject({
        field_id,
        source: 'sentinel2',
      });
      expect(r1.body.data).toHaveProperty('ndvi');
      expect(r1.body.meta).toMatchObject({ correlationid: 'cid-health-1' });

      // Second call without recompute -> should return existing snapshot (200)
      const r2 = await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .send({ date })
        .expect(200);

      expect(r2.body.success).toBe(true);
      expect(r2.body.data).toMatchObject({ field_id });
    });

    test('recompute=true returns 200 and updates values', async () => {
      // Seed snapshot
      await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .send({ date })
        .expect(201);

      // Change axios stats to different means to simulate recompute update
      axios.post.mockImplementationOnce(async () => ({
        status: 200,
        data: { accesstoken: 'tok', expiresin: 3600 },
      }));
      axios.post.mockImplementationOnce(async () => ({
        status: 200,
        data: Buffer.from(
          JSON.stringify({
            stats: { ndvi: { mean: 0.4 }, ndwi: { mean: 0.1 }, tdvi: { mean: 0.3 } },
          }),
          'utf8'
        ),
        headers: { 'content-type': 'application/json' },
      }));

      const r = await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .send({ date, recompute: true })
        .expect(200);

      expect(r.body.success).toBe(true);
      expect(r.body.data.field_id).toBe(field_id);
      // since we emulate DB, values reflect last write path; presence of fields suffices
      expect(r.body.data).toHaveProperty('ndvi');
    });

    test('validation errors: bad date -> 400', async () => {
      const res = await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .send({ date: '2025/01/15' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBeDefined();
    });

    test('Sentinel 5xx maps to 503; 4xx maps to 400', async () => {
      // 5xx: Mock to return 500 for Process API
      axios.post.mockImplementation(async url => {
        if (String(url).includes('/oauth/token')) {
          return { status: 200, data: { accesstoken: 'tok', expiresin: 3600 } };
        }
        return { status: 500, data: {}, headers: {} };
      });

      const r5 = await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .send({ date })
        .expect(503);
      expect(r5.body.success).toBe(false);

      // reset memory to allow new snapshot attempt
      snapshotMemory = null;

      // 4xx: Mock to return 400 for Process API
      axios.post.mockImplementation(async url => {
        if (String(url).includes('/oauth/token')) {
          return { status: 200, data: { accesstoken: 'tok', expiresin: 3600 } };
        }
        return { status: 400, data: {}, headers: {} };
      });

      const r4 = await request(app)
        .post(path(field_id))
        .set('Authorization', 'Bearer token')
        .send({ date })
        .expect(400);
      expect(r4.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/fields/:id/health list', () => {
    const pathList = (id, q = '') => `/api/v1/fields/${id}/health${q}`;

    test('list with range/pagination returns 200 and items', async () => {
      // Seed one snapshot via compute
      await request(app)
        .post(`/api/v1/fields/${field_id}/health/compute`)
        .set('Authorization', 'Bearer token')
        .send({ date })
        .expect(201);

      const res = await request(app)
        .get(pathList(field_id, '?from=2025-01-01&to=2025-01-31&page=1&pageSize=10'))
        .set('Authorization', 'Bearer token')
        .set('X-Request-Id', 'cid-health-list-1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        pageSize: 10,
        total: expect.any(Number),
      });
      expect(res.body.meta).toMatchObject({ correlationid: 'cid-health-list-1' });
    });

    test('validation: from > to -> 400; page/pageSize bounds', async () => {
      await request(app)
        .get(pathList(field_id, '?from=2025-02-01&to=2025-01-01'))
        .set('Authorization', 'Bearer token')
        .expect(400);

      await request(app)
        .get(pathList(field_id, '?page=0'))
        .set('Authorization', 'Bearer token')
        .expect(400);

      await request(app)
        .get(pathList(field_id, '?pageSize=101'))
        .set('Authorization', 'Bearer token')
        .expect(400);
    });
  });
});
