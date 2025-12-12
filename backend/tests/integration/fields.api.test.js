const request = require('supertest');

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
function matchPattern(key, pattern) {
  // very simple wildcard (*) matcher
  const re = new RegExp(
    `^${String(pattern)
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')}$`
  );
  return re.test(key);
}
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
      !MATCH ? true : matchPattern(k, MATCH)
    );
    // single pass scan for tests
    return ['0', keys];
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

process.env.NODE_ENV = 'test';
process.env.JWTSECRET = 'test-secret';

const app = require('../../src/app');
const { sequelize } = require('../../src/config/database.config');
const Field = require('../../src/models/field.model');

describe('Fields API Integration', () => {
  let querySpy;

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();

    // Default spies/mocks
    querySpy = jest
      .spyOn(sequelize, 'query')
      .mockImplementation(async (sql, { replacements } = {}) => {
        // GET by id
        if (
          /FROM\s+fields\s+f/i.test(sql) &&
          /WHERE\s+f\.field_id/i.test(sql) &&
          replacements?.field_id
        ) {
          return [
            {
              field_id: replacements.field_id,
              user_id: replacements.user_id,
              name: 'North plot',
              boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
              areasqm: 10000.12,
              center: { type: 'Point', coordinates: [80.105, 7.205] },
              status: 'active',
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
            },
          ];
        }

        // LIST with filters
        if (/FROM\s+fields\s+f/i.test(sql) && /ORDER BY/i.test(sql)) {
          const totalcount = 2;
          return [
            {
              field_id: 'f-list-1',
              user_id: 'user-1',
              name: 'A',
              boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
              areasqm: 15000,
              center: { type: 'Point', coordinates: [80.11, 7.21] },
              status: 'active',
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
              totalcount,
            },
            {
              field_id: 'f-list-2',
              user_id: 'user-1',
              name: 'B',
              boundary: { type: 'MultiPolygon', coordinates: [[[80.3, 7.4]]] },
              areasqm: 25000,
              center: { type: 'Point', coordinates: [80.31, 7.41] },
              status: 'active',
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
              totalcount,
            },
          ];
        }

        return [];
      });

    // Model methods
    jest.spyOn(Field, 'findOne').mockImplementation(async args => null);
    jest.spyOn(Field, 'create').mockImplementation(async payload => ({
      field_id: '11111111-1111-4111-8111-111111111111',
      user_id: payload.user_id,
      name: payload.name,
      status: 'active',
    }));
    // scope('allStatuses').findOne for PATCH/DELETE
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async ({ where }) => {
        if (where.user_id === 'user-1' && where.field_id) {
          return {
            field_id: where.field_id,
            user_id: 'user-1',
            name: 'Before',
            status: 'active',
            save: jest.fn(async function save() {
              return this;
            }),
          };
        }
        return null;
      }),
    }));
  });

  afterEach(() => {
    if (querySpy) querySpy.mockRestore();
  });

  it('POST -> GET/{id} -> GET list (with bbox) -> PATCH -> DELETE happy path', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'North plot',
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [80.1, 7.2],
              [80.12, 7.2],
              [80.12, 7.22],
              [80.1, 7.22],
              [80.1, 7.2],
            ],
          ],
        },
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toHaveProperty('field_id');
    expect(createRes.body.data).toHaveProperty('areasqm');

    const { field_id } = createRes.body.data;

    // Get by id
    const getRes = await request(app)
      .get(`/api/v1/fields/${field_id}`)
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data).toHaveProperty('field_id', field_id);

    // List with bbox (first miss then hit to test caching)
    const listRes1 = await request(app)
      .get('/api/v1/fields?bbox=80.10,7.20,80.50,7.80&page=1&pagesize=10')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(listRes1.body.success).toBe(true);
    expect(Array.isArray(listRes1.body.data)).toBe(true);
    expect(listRes1.body.pagination).toMatchObject({ page: 1, pagesize: 10, total: 2 });
    // meta is optional here; ensure structure presence if returned
    if (listRes1.body.meta) {
      expect(listRes1.body.meta).toHaveProperty('cachehit', false);
    }

    const listRes2 = await request(app)
      .get('/api/v1/fields?bbox=80.10,7.20,80.50,7.80&page=1&pagesize=10')
      .set('Authorization', 'Bearer token')
      .expect(200);

    if (listRes2.body.meta) {
      expect(listRes2.body.meta).toHaveProperty('cachehit', true);
    }

    // Patch name and status
    const patchRes = await request(app)
      .patch(`/api/v1/fields/${field_id}`)
      .set('Authorization', 'Bearer token')
      .send({ name: 'Renamed', status: 'archived' })
      .expect(200);

    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.data).toHaveProperty('field_id', field_id);

    // Delete (soft)
    const deleteRes = await request(app)
      .delete(`/api/v1/fields/${field_id}`)
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(deleteRes.body.success).toBe(true);
  });

  it('POST rejects invalid GeoJSON', async () => {
    const res = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Bad',
        boundary: {
          type: 'LineString',
          coordinates: [
            [80.1, 7.2],
            [80.2, 7.25],
          ],
        },
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code');
  });

  it('POST rejects duplicate name (409)', async () => {
    Field.findOne.mockResolvedValueOnce({ field_id: 'dup' });

    const res = await request(app)
      .post('/api/v1/fields')
      .set('Authorization', 'Bearer token')
      .send({
        name: 'Duplicate',
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [80.1, 7.2],
              [80.12, 7.2],
              [80.12, 7.22],
              [80.1, 7.22],
              [80.1, 7.2],
            ],
          ],
        },
      })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('GET list validates bad bbox (400)', async () => {
    const res = await request(app)
      .get('/api/v1/fields?bbox=bad')
      .set('Authorization', 'Bearer token')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATIONERROR');
  });
});
