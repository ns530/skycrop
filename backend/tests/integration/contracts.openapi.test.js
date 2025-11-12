'use strict';

/**
 * Contract & performance smoke tests (OpenAPI-derived) for:
 * - Fields CRUD
 * - Satellite tiles & preprocess
 * - ML Gateway predict
 *
 * Notes:
 * - Uses in-memory Redis and axios mocks; no real external calls.
 * - Validates response structure/headers against OpenAPI critical shapes.
 * - Adds negative/edge cases and basic performance thresholds (< 300ms locally with mocks).
 */

const request = require('supertest');
const axios = require('axios');
let assertApiSpec = () => {};
try {
  const path = require('path');
  const { matchers } = require('jest-openapi');
  const jestOpenAPI = (require('jest-openapi').default || require('jest-openapi'));
  expect.extend(matchers);
  // Load OpenAPI once for jest-openapi contract validation
  beforeAll(() => {
    jestOpenAPI(path.join(__dirname, '../../src/api/openapi.yaml'));
  });
  assertApiSpec = (res) => {
    expect(res).toSatisfyApiSpec();
  };
} catch (e) {
  // jest-openapi not installed; skip strict OpenAPI assertions
  assertApiSpec = () => {};
}

// Disable rate limiting for tests
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (_req, _res, next) => next(),
  authLimiter: (_req, _res, next) => next(),
}));

// Inject authenticated user
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requireAnyRole: () => (_req, _res, next) => next(),
}));

// In-memory Redis mock
const redisStore = new Map();
function matchPattern(key, pattern) {
  const re = new RegExp('^' + String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(key);
}
const fakeRedis = {
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
    const keys = Array.from(redisStore.keys()).filter((k) => (!MATCH ? true : matchPattern(k, MATCH)));
    return ['0', keys];
  },
};
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Satellite/SH env
process.env.SENTINELHUB_BASE_URL = 'https://services.sentinel-hub.com';
process.env.SENTINELHUB_TOKEN_URL = 'https://services.sentinel-hub.com/oauth/token';
process.env.SENTINELHUB_CLIENT_ID = 'client-id';
process.env.SENTINELHUB_CLIENT_SECRET = 'client-secret';
process.env.SATELLITE_TILE_TTL_SECONDS = '21600';

// ML env
process.env.ML_BASE_URL = 'http://ml-service.local:8001';
process.env.ML_INTERNAL_TOKEN = 'test-internal-token';
process.env.ML_PREDICT_CACHE_TTL_SECONDS = '86400';
process.env.ML_REQUEST_TIMEOUT_MS = '60000';

const app = require('../../src/app');
const { sequelize } = require('../../src/config/database.config');
const Field = require('../../src/models/field.model');

// Helper validators (schema-lite checks inspired by openapi.yaml)
function expectSuccessBody(obj) {
  expect(obj).toBeDefined();
  expect(typeof obj).toBe('object');
  expect(obj.success).toBe(true);
}
function expectErrorBody(obj) {
  expect(obj).toBeDefined();
  expect(obj.success).toBe(false);
  expect(obj.error).toBeDefined();
  expect(typeof obj.error.code).toBe('string');
  expect(typeof obj.error.message).toBe('string');
}
function expectFieldObject(f) {
  expect(f).toBeDefined();
  expect(typeof f.field_id).toBe('string');
  expect(typeof f.user_id).toBe('string');
  expect(typeof f.name).toBe('string');
  expect(f.boundary).toBeDefined();
  expect(f.center).toBeDefined();
  expect(['active', 'archived', 'deleted']).toContain(f.status);
  expect(typeof f.area_sqm).toBe('number');
}
function expectPagination(p) {
  expect(p).toBeDefined();
  expect(typeof p.page).toBe('number');
  expect(typeof p.page_size).toBe('number');
  expect(typeof p.total).toBe('number');
}

describe('OpenAPI Contract & Performance (Fields, Satellite, ML)', () => {
  let querySpy;

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();

    // axios downstream mocks: Sentinel Hub OAuth/Process + ML service
    jest.spyOn(axios, 'post').mockImplementation(async (url, data, config) => {
      // ML service predict
      if (String(url).includes('/v1/segmentation/predict') && String(url).startsWith(process.env.ML_BASE_URL)) {
        // Respect inline vs url
        const isInline = data && data.return === 'inline';
        if (isInline) {
          return {
            status: 200,
            headers: { 'x-model-version': 'unet-1.0.0' },
            data: {
              request_id: 'req-inline',
              model: { name: 'unet', version: '1.0.0' },
              mask_base64: Buffer.from(JSON.stringify({ type: 'FeatureCollection', features: [] })).toString('base64'),
              mask_format: 'geojson',
              metrics: { latency_ms: 42, tile_count: 1, cloud_coverage: 0.0 },
              warnings: [],
            },
          };
        }
        return {
          status: 200,
          headers: { 'x-model-version': 'unet-1.0.0' },
          data: {
            request_id: 'req-abc',
            model: { name: 'unet', version: '1.0.0' },
            mask_url: 'http://ml.local/masks/req-abc.geojson',
            mask_format: 'geojson',
            metrics: { latency_ms: 100, tile_count: 1, cloud_coverage: 0.0 },
            warnings: [],
          },
        };
      }

      // Sentinel Hub OAuth
      if (String(url).includes('/oauth/token')) {
        return {
          status: 200,
          data: { access_token: 'test-access-token', expires_in: 3600 },
        };
      }
      // Sentinel Hub Process API
      if (String(url).includes('/api/v1/process')) {
        const buf = Buffer.from('89504e470d0a1a0aFAKEPNG', 'utf8'); // fake bytes
        return {
          status: 200,
          data: buf,
          headers: { 'content-type': 'image/png' },
        };
      }

      return { status: 500, data: {} };
    });

    // DB & model behavior for Fields
    querySpy = jest.spyOn(sequelize, 'query').mockImplementation(async (sql, { replacements } = {}) => {
      // GET by id
      if (/FROM\s+fields\s+f/i.test(sql) && /WHERE\s+f\.field_id/i.test(sql) && replacements?.fieldId) {
        return [
          {
            field_id: replacements.fieldId,
            user_id: replacements.userId,
            name: 'North plot',
            boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
            area_sqm: 10000.12,
            center: { type: 'Point', coordinates: [80.105, 7.205] },
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      // LIST with pagination
      if (/FROM\s+fields\s+f/i.test(sql) && /ORDER BY/i.test(sql)) {
        const total_count = 2;
        return [
          {
            field_id: 'f-list-1',
            user_id: 'user-1',
            name: 'A',
            boundary: { type: 'MultiPolygon', coordinates: [[[80.1, 7.2]]] },
            area_sqm: 15000,
            center: { type: 'Point', coordinates: [80.11, 7.21] },
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_count,
          },
          {
            field_id: 'f-list-2',
            user_id: 'user-1',
            name: 'B',
            boundary: { type: 'MultiPolygon', coordinates: [[[80.3, 7.4]]] },
            area_sqm: 25000,
            center: { type: 'Point', coordinates: [80.31, 7.41] },
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_count,
          },
        ];
      }

      return [];
    });

    jest.spyOn(Field, 'findOne').mockImplementation(async (_args) => null);
    jest.spyOn(Field, 'create').mockImplementation(async (payload) => ({
      field_id: '11111111-1111-4111-8111-111111111111',
      user_id: payload.user_id,
      name: payload.name,
      status: 'active',
    }));
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

  describe('Fields: POST → GET by id → LIST → PATCH → DELETE (contract + perf)', () => {
    test('happy path adheres to OpenAPI shapes', async () => {
      const t0 = Date.now();
      // Create
      const createRes = await request(app)
        .post('/api/v1/fields')
        .set('Authorization', 'Bearer token')
        .set('X-Request-Id', 'cid-fields-1')
        .send({
          name: 'North plot',
          boundary: {
            type: 'Polygon',
            coordinates: [[[80.1, 7.2], [80.12, 7.2], [80.12, 7.22], [80.1, 7.22], [80.1, 7.2]]],
          },
        })
        .expect(201);

      expectSuccessBody(createRes.body);
      expect(createRes.body.data).toBeDefined();
      const fieldId = createRes.body.data.field_id;
      expect(typeof fieldId).toBe('string');

      // Contract check against OpenAPI
      assertApiSpec(createRes);

      // GET by id
      const getRes = await request(app)
        .get(`/api/v1/fields/${fieldId}`)
        .set('Authorization', 'Bearer token')
        .expect(200);
      expectSuccessBody(getRes.body);
      expectFieldObject(getRes.body.data);

      // Contract check against OpenAPI
      assertApiSpec(getRes);

      // LIST with bbox and pagination shape
      const listRes = await request(app)
        .get('/api/v1/fields?bbox=80.10,7.20,80.50,7.80&page=1&page_size=10&sort=created_at&order=desc')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expectSuccessBody(listRes.body);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      listRes.body.data.forEach(expectFieldObject);
      expectPagination(listRes.body.pagination);

      // Contract check against OpenAPI
      assertApiSpec(listRes);

      // PATCH
      const patchRes = await request(app)
        .patch(`/api/v1/fields/${fieldId}`)
        .set('Authorization', 'Bearer token')
        .send({ name: 'Renamed', status: 'archived' })
        .expect(200);
      expectSuccessBody(patchRes.body);
      expectFieldObject(patchRes.body.data);

      // DELETE
      const delRes = await request(app)
        .delete(`/api/v1/fields/${fieldId}`)
        .set('Authorization', 'Bearer token')
        .expect(200);
      expectSuccessBody(delRes.body);

      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(300); // performance smoke
    });

    test('geometry invalid/self-intersecting path maps to 400 (service mapping)', async () => {
      // Force Field.create to throw a PostGIS-like validity error
      Field.create.mockImplementationOnce(async () => {
        const err = new Error('Geometry invalid: ST_IsValid returned false');
        throw err;
      });

      const res = await request(app)
        .post('/api/v1/fields')
        .set('Authorization', 'Bearer token')
        .send({
          name: 'Bad',
          boundary: {
            type: 'Polygon',
            coordinates: [[[80.1, 7.2], [80.2, 7.3], [80.15, 7.25], [80.1, 7.2]]], // may self-intersect (triangle closed)
          },
        })
        .expect(400);

      expectErrorBody(res.body);
      expect(res.body.error.code).toBeDefined();
    });
  });

  describe('Satellite: tiles and preprocess (contract + negative + perf)', () => {
    test('GET tiles returns 200 with ETag/Cache-Control and binary content-type', async () => {
      const z = 12, x = 3567, y = 2150;
      const url = `/api/v1/satellite/tiles/${z}/${x}/${y}?date=2025-10-10&bands=RGB`;

      const t0 = Date.now();
      const r1 = await request(app)
        .get(url)
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(r1.headers).toHaveProperty('etag');
      expect(r1.headers).toHaveProperty('cache-control');
      expect(r1.headers['cache-control']).toMatch(/public/);
      expect(r1.headers['content-type']).toMatch(/image\/png|image\/jpeg/);

      // Non-matching If-None-Match → 200 with (same) ETag
      const r2 = await request(app)
        .get(url)
        .set('Authorization', 'Bearer token')
        .set('If-None-Match', 'W/"non-matching"')
        .expect(200);

      expect(r2.headers.etag).toBeDefined();
      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(300);
    });

    test('POST preprocess contract: 202, returns {job_id,status} and idempotency stable', async () => {
      const path = '/api/v1/satellite/preprocess';
      const payload = {
        bbox: [80.10, 7.20, 80.50, 7.80],
        date: '2025-10-10',
        bands: ['RGB', 'NIR'],
        cloud_mask: true,
      };
      const idem = 'req-abc';

      const r1 = await request(app)
        .post(path)
        .set('Authorization', 'Bearer token')
        .set('Idempotency-Key', idem)
        .send(payload)
        .expect(202);
      expectSuccessBody(r1.body);
      expect(typeof r1.body.data.job_id).toBe('string');
      expect(typeof r1.body.data.status).toBe('string');

      // Contract check against OpenAPI
      assertApiSpec(r1);

      const r2 = await request(app)
        .post(path)
        .set('Authorization', 'Bearer token')
        .set('Idempotency-Key', idem)
        .send(payload)
        .expect(202);
      expect(r2.body.data.job_id).toBe(r1.body.data.job_id);
    });
  });

  // Additional negative: trigger express.json 10MB cap to produce 413 deterministically (no header spoofing)
  describe('Satellite: payload too large 413 mapping', () => {
    test('preprocess returns 413 when JSON body exceeds 10MB parser limit', async () => {
      const pathUrl = '/api/v1/satellite/preprocess';
      // Create a payload that exceeds the express.json({ limit: "10mb" }) limit defined in app.js
      const hugeBlob = 'x'.repeat(11 * 1024 * 1024); // ~11MB
      const res = await request(app)
        .post(pathUrl)
        .set('Authorization', 'Bearer token')
        // Body parser will reject before route validation; minimal object with oversized property
        .send({ blob: hugeBlob })
        .expect(413);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    }, 20000);
  });

  describe('ML Gateway: predict contract (mask_url and inline) + perf', () => {
    test('mask_url response includes required fields and meta', async () => {
      const t0 = Date.now();
      const res = await request(app)
        .post('/api/v1/ml/segmentation/predict')
        .set('Authorization', 'Bearer token')
        .set('X-Request-Id', 'cid-ml-1')
        .send({
          bbox: [80.1, 7.2, 80.12, 7.22],
          date: '2025-10-15',
          model_version: '1.0.0',
          return: 'mask_url',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        mask_url: expect.any(String),
        mask_format: 'geojson',
        model: { name: expect.any(String), version: expect.any(String) },
      });
      expect(res.body.meta).toMatchObject({ correlation_id: 'cid-ml-1' });

      // Contract check against OpenAPI
      assertApiSpec(res);

      const elapsed = Date.now() - t0;
      expect(elapsed).toBeLessThan(300);
    });

    test('inline response returns base64 mask and format', async () => {
      const res = await request(app)
        .post('/api/v1/ml/segmentation/predict')
        .set('Authorization', 'Bearer token')
        .set('X-Request-Id', 'cid-ml-2')
        .send({
          bbox: [80.11, 7.21, 80.12, 7.22],
          date: '2025-10-10',
          return: 'inline',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('mask_base64');
      expect(res.body.data.mask_format).toBe('geojson');
      expect(res.body.meta).toMatchObject({ correlation_id: 'cid-ml-2' });

      // Contract check against OpenAPI
      assertApiSpec(res);
    });
  });
});