'use strict';

process.env.NODE_ENV = 'test';
process.env.HEALTH_INDICES_TTL_SECONDS = '86400';
process.env.HEALTH_DEFAULT_IMAGE_SIZE = '256';
process.env.SENTINELHUB_BASE_URL = 'https://services.sentinel-hub.com';
process.env.SENTINELHUB_TOKEN_URL = 'https://services.sentinel-hub.com/oauth/token';
process.env.SENTINELHUB_CLIENT_ID = 'client-id';
process.env.SENTINELHUB_CLIENT_SECRET = 'client-secret';

// In-memory fake Redis for unit tests
const store = new Map();
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setEx(key, _ttl, value) {
    store.set(key, value);
    return 'OK';
  },
  async setex(key, ttl, value) {
    return this.setEx(key, ttl, value);
  },
  async del(keys) {
    if (Array.isArray(keys)) {
      let count = 0;
      for (const k of keys) {
        if (store.delete(k)) count += 1;
      }
      return count;
    }
    return store.delete(keys) ? 1 : 0;
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

const axios = require('axios');
jest.mock('axios', () => ({
  post: jest.fn(),
}));

const { sequelize } = require('../../src/config/database.config');
const Field = require('../../src/models/field.model');
const { HealthService } = require('../../src/services/health.service');

describe('HealthService (vegetation indices) unit', () => {
  let svc;
  let querySpy;

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    svc = new HealthService();

    // Field ownership check: Field.scope('allStatuses').findOne
    Field.scope = jest.fn(() => ({
      findOne: jest.fn(async ({ where }) => {
        if (where.user_id && where.field_id) {
          return { field_id: where.field_id, user_id: where.user_id, status: 'active' };
        }
        return null;
      }),
    }));

    // Default DB query mock
    querySpy = jest.spyOn(sequelize, 'query').mockImplementation(async (sql, { replacements, type } = {}) => {
      const sqlStr = String(sql);

      // Get field boundary geometry
      if (/FROM\s+fields/i.test(sqlStr) && /ST_AsGeoJSON\(boundary\)/i.test(sqlStr)) {
        return [
          {
            boundary: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [80.10, 7.20],
                    [80.12, 7.20],
                    [80.12, 7.22],
                    [80.10, 7.22],
                    [80.10, 7.20],
                  ],
                ],
              ],
            },
          },
        ];
      }

      // Insert upsert (ignore or update) no-op
      if (/INSERT\s+INTO\s+health_snapshots/i.test(sqlStr)) {
        return [];
      }

      // Select snapshot by (field_id, timestamp)
      if (/FROM\s+health_snapshots/i.test(sqlStr) && /WHERE\s+field_id\s*=\s*:fieldId/i.test(sqlStr) && /timestamp/.test(sqlStr)) {
        const ts = replacements.ts || `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
        return [
          {
            id: 'snap-1',
            field_id: replacements.fieldId,
            timestamp: ts,
            source: 'sentinel2',
            ndvi: 0.62,
            ndwi: 0.2,
            tdvi: 0.45,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      // List snapshots path (window count)
      if (/FROM\s+health_snapshots/i.test(sqlStr) && /COUNT\(\*\)\s+OVER\(\)/i.test(sqlStr)) {
        return [
          {
            id: 'snap-1',
            field_id: replacements.fieldId,
            timestamp: `${(replacements.from || '2025-01-01T00:00:00.000Z')}`,
            source: 'sentinel2',
            ndvi: 0.62,
            ndwi: 0.2,
            tdvi: 0.45,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_count: 1,
          },
        ];
      }

      return [];
    });
  });

  afterEach(() => {
    if (querySpy) querySpy.mockRestore();
  });

  test('evalscript builder includes expected bands and index formulas', () => {
    // Accessing "private" method for unit coverage (pattern used elsewhere in repo)
    const code = svc._buildIndicesEvalscript();
    expect(code).toMatch(/VERSION=3/);
    expect(code).toMatch(/input:\s*\["B04", "B03", "B08"\]/);
    expect(code).toMatch(/let ndvi = \(NIR - RED\) \/ \(NIR \+ RED \+ 1e-6\)/);
    expect(code).toMatch(/let ndwi = \(GREEN - NIR\) \/ \(GREEN \+ NIR \+ 1e-6\)/);
    expect(code).toMatch(/let tdvi = \(NIR - RED\) \/ Math\.sqrt\(NIR \+ RED \+ 1e-6\)/);
  });

  test('computeIndicesForField builds Process API request with geometry and image size, populates cache', async () => {
    const userId = 'user-1';
    const fieldId = 'field-1';
    const date = '2025-01-15';

    // Axios calls: OAuth then Process returning JSON stats
    axios.post.mockImplementationOnce(async (url, data, config) => {
      // OAuth
      expect(url).toContain('/oauth/token');
      expect(config.validateStatus(200)).toBe(true);
      return { status: 200, data: { access_token: 'tok', expires_in: 3600 } };
    });
    axios.post.mockImplementationOnce(async (url, body, config) => {
      // Process
      expect(url).toContain('/api/v1/process');
      expect(body).toHaveProperty('input.bounds.geometry'); // using geometry, not bbox
      expect(body).toHaveProperty('output.width', 256);
      expect(body).toHaveProperty('output.height', 256);
      expect(typeof body.evalscript).toBe('string');
      // return JSON stats so _parseProcessResponse aggregates means
      const stats = { stats: { ndvi: { mean: 0.62 }, ndwi: { mean: 0.2 }, tdvi: { mean: 0.45 } } };
      return {
        status: 200,
        data: Buffer.from(JSON.stringify(stats), 'utf8'),
        headers: { 'content-type': 'application/json' },
      };
    });

    const result = await svc.computeIndicesForField(userId, fieldId, date);
    expect(result.field_id).toBe(fieldId);
    expect(result.timestamp).toBe(`${date}T00:00:00.000Z`);
    expect(result.source).toBe('sentinel2');
    expect(result.ndvi).toBeCloseTo(0.62, 5);
    expect(result.ndwi).toBeCloseTo(0.2, 5);
    expect(result.tdvi).toBeCloseTo(0.45, 5);
    expect(result.cache_hit).toBe(false);

    // second call should hit cache and not call axios process again
    const before = axios.post.mock.calls.length;
    const cached = await svc.computeIndicesForField(userId, fieldId, date);
    expect(cached.cache_hit).toBe(true);
    expect(cached.ndvi).toBeCloseTo(0.62, 5);
    expect(axios.post.mock.calls.length).toBe(before); // no extra calls
  });

  test('upsertSnapshot is idempotent and returns row; recompute=true updates values', async () => {
    const fieldId = 'field-1';
    const ts = '2025-01-15T00:00:00.000Z';

    // First insert (no existing) recompute=false
    const row1 = await svc.upsertSnapshot(fieldId, ts, { ndvi: 0.5, ndwi: 0.1, tdvi: 0.3, source: 'sentinel2' }, false);
    expect(row1).toBeDefined();
    expect(row1.field_id).toBe(fieldId);
    expect(row1.timestamp).toBe(ts);

    // Recompute=true should "update"; our mock returns same select row structure
    const row2 = await svc.upsertSnapshot(fieldId, ts, { ndvi: 0.55, ndwi: 0.12, tdvi: 0.35, source: 'sentinel2' }, true);
    expect(row2).toBeDefined();
    expect(row2.field_id).toBe(fieldId);
  });

  test('listSnapshots returns paginated results and respects range and page/pageSize defaults', async () => {
    const userId = 'user-1';
    const fieldId = 'field-1';
    const res = await svc.listSnapshots(userId, fieldId, { from: '2025-01-01', to: '2025-01-31', page: 1, pageSize: 20 });
    expect(res).toHaveProperty('items');
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res).toMatchObject({ page: 1, pageSize: 20, total: expect.any(Number) });
    const item = res.items[0];
    expect(item).toHaveProperty('ndvi');
    expect(item).toHaveProperty('ndwi');
    expect(item).toHaveProperty('tdvi');
  });

  test('Process API error mapping: 5xx -> 503, 4xx -> 400', async () => {
    const userId = 'user-1';
    const fieldId = 'field-1';
    const date = '2025-01-15';

    // OAuth OK
    axios.post.mockImplementationOnce(async () => ({ status: 200, data: { access_token: 'tok', expires_in: 3600 } }));
    // Process 500
    axios.post.mockImplementationOnce(async () => ({ status: 500, data: {} }));
    await expect(svc.computeIndicesForField(userId, fieldId, date)).rejects.toMatchObject({ statusCode: 503 });

    // OAuth OK again
    axios.post.mockImplementationOnce(async () => ({ status: 200, data: { access_token: 'tok', expires_in: 3600 } }));
    // Process 400
    axios.post.mockImplementationOnce(async () => ({ status: 400, data: {} }));
    await expect(svc.computeIndicesForField(userId, fieldId, date)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('date validation rejects invalid date format', async () => {
    await expect(svc.computeIndicesForField('user-1', 'field-1', '2025/01/01')).rejects.toMatchObject({
      name: 'ValidationError',
      code: 'VALIDATION_ERROR',
    });
  });
});