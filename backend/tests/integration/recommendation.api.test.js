'use strict';

const request = require('supertest');

// OpenAPI contract assertion helper (optional if jest-openapi unavailable)
let assertApiSpec = () => {};
try {
  const path = require('path');
  const { matchers } = require('jest-openapi');
  const jestOpenAPI = (require('jest-openapi').default || require('jest-openapi'));
  expect.extend(matchers);
  beforeAll(() => {
    jestOpenAPI(path.join(__dirname, '../../src/api/openapi.yaml'));
  });
  assertApiSpec = (res) => {
    expect(res).toSatisfyApiSpec();
  };
} catch (_e) {
  assertApiSpec = () => {};
}

// Disable rate limiter for tests
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

// In-memory fake Redis with scanIterator support
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
  // Minimal async iterator used by invalidateListCache
  async *scanIterator({ MATCH } = {}) {
    const regex = MATCH ? new RegExp('^' + MATCH.replace(/[.+^${}()|[\\]\\\\]/g, '\\$&').replace(/\\\*/g, '.*') + '$') : null;
    for (const k of store.keys()) {
      if (!regex || regex.test(k)) {
        yield k;
      }
    }
  },
};
// Hook Redis config
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

// Deterministic mocks for health + weather used by recommendation service
let mockSnapshots = [];
let mockForecast = { data: { days: [], totals: { rain_3d_mm: 0, rain_7d_mm: 0 } } };

jest.mock('../../src/services/health.service', () => ({
  getHealthService: () => ({
    listSnapshots: jest.fn(async (_userId, _fieldId, _opts) => {
      return { items: mockSnapshots.slice() };
    }),
  }),
}));

jest.mock('../../src/services/weather.service', () => ({
  getWeatherService: () => ({
    getForecast: jest.fn(async (_userId, _fieldId) => mockForecast),
  }),
}));

// In-memory "DB" for recommendations via sequelize.query
const recStore = new Map(); // key = `${fieldId}|${ts}|${type}`
let idCounter = 1;

function recKey(fieldId, ts, type) {
  return `${fieldId}|${ts}|${type}`;
}

function listRecs({ fieldId, fromISO, toISO, type }) {
  const arr = [];
  for (const r of recStore.values()) {
    if (r.field_id !== fieldId) continue;
    if (type && r.type !== type) continue;
    const t = new Date(r.timestamp).getTime();
    if (fromISO && t < new Date(fromISO).getTime()) continue;
    if (toISO && t > new Date(toISO).getTime()) continue;
    arr.push({ ...r });
  }
  arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp) || (a.id || '').localeCompare(b.id || ''));
  return arr;
}

// Patch sequelize.query used by recommendation.service and controller helper count queries
const { sequelize } = require('../../src/config/database.config');
jest.spyOn(sequelize, 'query').mockImplementation(async (sql, { replacements } = {}) => {
  const s = String(sql);

  // Count existing for date window (controller helper _countExistingForDate)
  if (/SELECT\s+COUNT\(\*\)::int\s+AS\s+cnt\s+FROM\s+recommendations/i.test(s)) {
    const rows = listRecs({
      fieldId: replacements.fieldId,
      fromISO: replacements.from,
      toISO: replacements.to,
    });
    return [{ cnt: rows.length }];
  }

  // INSERT INTO recommendations ... ON CONFLICT ...
  if (/INSERT\s+INTO\s+recommendations/i.test(s)) {
    const { fieldId, ts, type, severity, reason } = replacements;
    const details = replacements.details ? JSON.parse(replacements.details) : null;
    const k = recKey(fieldId, ts, type);

    if (/DO\s+UPDATE\s+SET/i.test(s)) {
      // Upsert with update
      const existing = recStore.get(k);
      if (existing) {
        recStore.set(k, {
          ...existing,
          severity,
          reason,
          details,
          updated_at: new Date().toISOString(),
        });
      } else {
        recStore.set(k, {
          id: `rec-${idCounter++}`,
          field_id: fieldId,
          timestamp: ts,
          type,
          severity,
          reason,
          details,
          created_at: new Date().toISOString(),
          updated_at: null,
        });
      }
    } else {
      // Insert-or-ignore
      if (!recStore.has(k)) {
        recStore.set(k, {
          id: `rec-${idCounter++}`,
          field_id: fieldId,
          timestamp: ts,
          type,
          severity,
          reason,
          details,
          created_at: new Date().toISOString(),
          updated_at: null,
        });
      }
    }
    return [];
  }

  // SELECT by tuple to return the persisted row
  if (/FROM\s+recommendations/i.test(s) && /WHERE\s+field_id\s*=\s*:fieldId/i.test(s) && /"timestamp"\s*=\s*:ts/.test(s) && /type\s*=\s*:type/.test(s)) {
    const k = recKey(replacements.fieldId, replacements.ts, replacements.type);
    const row = recStore.get(k);
    return row ? [row] : [];
  }

  // Paginated list with COUNT(*) OVER()
  if (/FROM\s+recommendations/i.test(s) && /COUNT\(\*\)\s+OVER\(\)/i.test(s)) {
    const rows = listRecs({
      fieldId: replacements.fieldId,
      fromISO: replacements.from,
      toISO: replacements.to,
      type: replacements.type,
    });
    const pageSlice = rows.slice(replacements.offset, replacements.offset + replacements.limit).map((r) => ({
      ...r,
      total_count: rows.length,
    }));
    return pageSlice;
  }

  return [];
});

const app = require('../../src/app');

function makeSnapshot(isoTs, ndvi, ndwi, tdvi) {
  return {
    id: `snap-${isoTs}`,
    field_id: 'field-1',
    timestamp: isoTs,
    source: 'sentinel2',
    ndvi,
    ndwi,
    tdvi,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('Recommendation API', () => {
  const fieldId = '11111111-1111-4111-8111-111111111111';
  const date = '2025-01-15';
  const ts = `${date}T00:00:00.000Z`;

  beforeEach(() => {
    store.clear();
    recStore.clear();
    idCounter = 1;

    // Default: water high (NDWI=0.04 and rain7=6) and fertilizer medium (delta=0.01, TDVI=0.55)
    mockSnapshots = [
      makeSnapshot(ts, 0.50, 0.04, 0.55),
      makeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.20, 0.30),
    ];
    mockForecast = {
      data: {
        days: [
          { date: '2025-01-16', rain_mm: 0.4, tmin: 24, tmax: 33, wind: 2.0 },
          { date: '2025-01-17', rain_mm: 0.3, tmin: 24, tmax: 33, wind: 2.0 },
          { date: '2025-01-18', rain_mm: 0.2, tmin: 24, tmax: 33, wind: 2.0 },
        ],
        totals: { rain_3d_mm: 0.9, rain_7d_mm: 6.0 },
      },
    };
  });

  const postCompute = (id, body) =>
    request(app)
      .post(`/api/v1/fields/${id}/recommendations/compute`)
      .set('Authorization', 'Bearer token')
      .set('X-Correlation-Id', 'cid-reco-1')
      .send(body);

  const getList = (id, query) =>
    request(app)
      .get(`/api/v1/fields/${id}/recommendations${query ? `?${query}` : ''}`)
      .set('Authorization', 'Bearer token')
      .set('X-Correlation-Id', 'cid-reco-list-1');

  test('POST compute: 201 on first create; 200 if exists and recompute=false', async () => {
    // First call -> 201
    const r1 = await postCompute(fieldId, { date }).expect(201);
    expect(r1.body.success).toBe(true);
    expect(Array.isArray(r1.body.data)).toBe(true);
    expect(r1.body.data.length).toBeGreaterThan(0);
    expect(r1.body.meta).toHaveProperty('correlation_id');

    // Second call -> 200 (idempotent)
    const r2 = await postCompute(fieldId, { date }).expect(200);
    expect(r2.body.success).toBe(true);
    expect(Array.isArray(r2.body.data)).toBe(true);
  });

  test('POST compute: recompute=true updates existing record (200)', async () => {
    await postCompute(fieldId, { date }).expect(201);

    // Change conditions to drive different severity: water medium case
    mockSnapshots = [
      makeSnapshot(ts, 0.50, 0.08, 0.40),
      makeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.20, 0.30),
    ];
    mockForecast = { data: { days: [], totals: { rain_3d_mm: 3.5, rain_7d_mm: 20.0 } } };

    const r = await postCompute(fieldId, { date, recompute: true }).expect(200);
    expect(r.body.success).toBe(true);
    expect(r.body.data.some((x) => x.type === 'water')).toBe(true);
  });

  test('GET list pagination, filter by type and date range', async () => {
    // Seed two days via compute with different types
    mockSnapshots = [makeSnapshot('2025-01-14T00:00:00.000Z', 0.50, 0.12, 0.30)];
    mockForecast = { data: { days: [], totals: { rain_3d_mm: 1.5, rain_7d_mm: 20.0 } } };
    await postCompute(fieldId, { date: '2025-01-14', recompute: true }).expect(201);

    mockSnapshots = [makeSnapshot('2025-01-15T00:00:00.000Z', 0.50, 0.04, 0.55), makeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.2, 0.3)];
    mockForecast = { data: { days: [], totals: { rain_3d_mm: 0.9, rain_7d_mm: 6.0 } } };
    await postCompute(fieldId, { date: '2025-01-15', recompute: true }).expect(200);

    // List only water in range
    const res = await getList(fieldId, 'from=2025-01-14&to=2025-01-15&type=water&page=1&pageSize=10').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, pageSize: 10, total: expect.any(Number) });
    for (const r of res.body.data) {
      expect(['water']).toContain(r.type);
    }
  });

  test('Validation failures: bad date, from>to, type invalid, pagination bounds', async () => {
    // POST compute bad date
    await postCompute(fieldId, { date: '2025/01/15' }).expect(400);

    // GET list from > to
    await getList(fieldId, 'from=2025-02-01&to=2025-01-01').expect(400);

    // type invalid
    await getList(fieldId, 'type=invalid').expect(400);

    // page bounds
    await getList(fieldId, 'page=0').expect(400);
    await getList(fieldId, 'pageSize=101').expect(400);
  });
});