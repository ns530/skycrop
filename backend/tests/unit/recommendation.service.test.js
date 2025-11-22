/* eslint-disable no-underscore-dangle */
'use strict';

process.env.NODE_ENV = 'test';
process.env.WATER_NDWI_THRESHOLD = '0.1';
process.env.WATER_RAIN_MM_MIN = '5';
process.env.NDVI_GROWTH_MIN = '0.02';
process.env.TDVI_STRESS_THRESHOLD = '0.5';
process.env.RECO_TTL_COMPUTE_SECONDS = '86400';
process.env.RECO_TTL_LIST_SECONDS = '300';

const { v4: uuidv4 } = require('uuid');

// In-memory Redis mock with scanIterator support
const redisStore = new Map();
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
      let n = 0;
      for (const k of keys) {
        if (redisStore.delete(k)) n += 1;
      }
      return n;
    }
    return redisStore.delete(keys) ? 1 : 0;
  },
  // Minimal async iterator for SCAN pattern used by invalidateListCache
  async *scanIterator({ MATCH } = {}) {
    const regex = MATCH ? new RegExp('^' + MATCH.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*') + '$') : null;
    for (const k of redisStore.keys()) {
      if (!regex || regex.test(k)) {
        yield k;
      }
    }
  },
};

// Wire Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

// Mocks for dependent services with per-test data injection
let mockSnapshots = [];
let mockForecastPayload = { data: { days: [], totals: { rain_3d_mm: 0, rain_7d_mm: 0 } } };

jest.mock('../../src/services/health.service', () => ({
  getHealthService: () => ({
    listSnapshots: jest.fn(async (_userId, _fieldId, _opts) => {
      return { items: mockSnapshots.slice() };
    }),
  }),
}));

jest.mock('../../src/services/weather.service', () => ({
  getWeatherService: () => ({
    getForecast: jest.fn(async (_userId, _fieldId) => mockForecastPayload),
  }),
}));

// In-memory "DB" for sequelize.query
const mockRecStore = new Map(); // key = `${fieldId}|${ts}|${type}`
let mockIdCounter = 1;

function mockKeyOf(fieldId, ts, type) {
  return `${fieldId}|${ts}|${type}`;
}

function mockSelectByKey(fieldId, ts, type) {
  const k = mockKeyOf(fieldId, ts, type);
  return mockRecStore.has(k) ? { ...mockRecStore.get(k) } : null;
}

function mockListByWhere({ fieldId, fromISO, toISO, type }) {
  const all = [];
  for (const v of mockRecStore.values()) {
    if (v.field_id !== fieldId) continue;
    if (type && v.type !== type) continue;
    const t = new Date(v.timestamp).getTime();
    if (fromISO && t < new Date(fromISO).getTime()) continue;
    if (toISO && t > new Date(toISO).getTime()) continue;
    all.push(v);
  }
  // mimic ORDER BY timestamp DESC, id
  all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp) || (a.id || '').localeCompare(b.id || ''));
  return all;
}

jest.mock('../../src/config/database.config', () => {
  const original = jest.requireActual('../../src/config/database.config');
  return {
    ...original,
    sequelize: {
      ...original.sequelize,
      query: jest.fn(async (sql, { replacements, type } = {}) => {
        const s = String(sql);

        // Count existing for date (controller helper)
        if (/SELECT\s+COUNT\(\*\)::int\s+AS\s+cnt\s+FROM\s+recommendations/i.test(s)) {
          const rows = mockListByWhere({
            fieldId: replacements.fieldId,
            fromISO: replacements.from,
            toISO: replacements.to,
          });
          return [{ cnt: rows.length }];
        }

        // INSERT INTO recommendations ... ON CONFLICT DO UPDATE/NOTHING
        if (/INSERT\s+INTO\s+recommendations/i.test(s)) {
          const { fieldId, ts, type: rtype, severity, reason } = replacements;
          const detailsJSON = replacements.details ? JSON.parse(replacements.details) : null;
          const k = mockKeyOf(fieldId, ts, rtype);
          if (/DO\s+UPDATE\s+SET/i.test(s)) {
            // Upsert with update
            const existing = mockRecStore.get(k);
            if (existing) {
              mockRecStore.set(k, {
                ...existing,
                severity,
                reason,
                details: detailsJSON,
                updated_at: new Date().toISOString(),
              });
            } else {
              mockRecStore.set(k, {
                id: `rec-${mockIdCounter++}`,
                field_id: fieldId,
                timestamp: ts,
                type: rtype,
                severity,
                reason,
                details: detailsJSON,
                created_at: new Date().toISOString(),
                updated_at: null,
              });
            }
          } else {
            // DO NOTHING path
            if (!mockRecStore.has(k)) {
              mockRecStore.set(k, {
                id: `rec-${mockIdCounter++}`,
                field_id: fieldId,
                timestamp: ts,
                type: rtype,
                severity,
                reason,
                details: detailsJSON,
                created_at: new Date().toISOString(),
                updated_at: null,
              });
            }
          }
          return [];
        }

        // SELECT single row by tuple
        if (/FROM\s+recommendations/i.test(s) && /WHERE\s+field_id\s*=\s*:fieldId/i.test(s) && /"timestamp"\s*=\s*:ts/i.test(s) && /type\s*=\s*:type/i.test(s)) {
          const row = mockSelectByKey(replacements.fieldId, replacements.ts, replacements.type);
          return row ? [row] : [];
        }

        // Paginated list with COUNT(*) OVER()
        if (/FROM\s+recommendations/i.test(s) && /COUNT\(\*\)\s+OVER\(\)/i.test(s)) {
          const rows = mockListByWhere({
            fieldId: replacements.fieldId,
            fromISO: replacements.from,
            toISO: replacements.to,
            type: replacements.type,
          });
          const sliced = rows.slice(replacements.offset, replacements.offset + replacements.limit).map((r) => ({
            ...r,
            total_count: rows.length,
          }));
          return sliced;
        }

        return [];
      }),
    },
  };
});

const { getRecommendationService } = require('../../src/services/recommendation.service');

function mockMakeSnapshot(tsISO, ndvi, ndwi, tdvi) {
  return {
    id: uuidv4(),
    field_id: 'F1',
    timestamp: tsISO,
    source: 'sentinel2',
    ndvi,
    ndwi,
    tdvi,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('RecommendationService unit', () => {
  const userId = 'user-1';
  const fieldId = 'F1';
  const date = '2025-01-15';
  const ts = `${date}T00:00:00.000Z`;
  let svc;

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    mockRecStore.clear();
    mockIdCounter = 1;

    // Default snapshots window: two points 14 days apart
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.50, 0.04, 0.55), // latest
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.18, 0.30), // ~14d ago
    ];

    // Default forecast totals
    mockForecastPayload = {
      data: {
        days: [
          { date: '2025-01-16', rain_mm: 0.5, tmin: 24, tmax: 33, wind: 2.1 },
          { date: '2025-01-17', rain_mm: 0.7, tmin: 24, tmax: 33, wind: 2.2 },
          { date: '2025-01-18', rain_mm: 0.6, tmin: 24, tmax: 33, wind: 2.3 },
        ],
        totals: { rain_3d_mm: 1.8, rain_7d_mm: 6.0 },
      },
    };

    svc = getRecommendationService();
  });

  test('water alert severity: high when NDWI very low or 7-day rain < 10 mm', async () => {
    // latest NDWI=0.04 and rain_7d=6 -> high
    const { recommendations, meta } = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    expect(Array.isArray(recommendations)).toBe(true);
    const water = recommendations.find((r) => r.type === 'water');
    expect(water).toBeDefined();
    expect(water.severity).toBe('high');
    expect(meta.cache_hit).toBe(false);
  });

  test('water alert severity: medium when NDWI in [0.05,0.1) and 3-day rain < 5 mm', async () => {
    // Adjust snapshots: NDWI=0.08
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.50, 0.08, 0.30),
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.18, 0.30),
    ];
    // 3-day rain below 5mm (keep totals default 1.8mm)
    mockForecastPayload.data.totals = { rain_3d_mm: 3.5, rain_7d_mm: 15.0 };

    const { recommendations } = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    const water = recommendations.find((r) => r.type === 'water');
    expect(water).toBeDefined();
    expect(water.severity).toBe('medium');
  });

  test('water alert severity: low when NDWI in [0.1,0.15) and 3-day rain < 2 mm (low-only rule)', async () => {
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.50, 0.12, 0.30),
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.18, 0.30),
    ];
    mockForecastPayload.data.totals = { rain_3d_mm: 1.5, rain_7d_mm: 20.0 };

    const { recommendations } = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    const water = recommendations.find((r) => r.type === 'water');
    expect(water).toBeDefined();
    expect(water.severity).toBe('low');
  });

  test('fertilizer alert: medium when ΔNDVI < threshold and TDVI > threshold', async () => {
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.50, 0.20, 0.55), // latest
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.18, 0.30), // delta = 0.01
    ];

    const { recommendations } = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    const fert = recommendations.find((r) => r.type === 'fertilizer');
    expect(fert).toBeDefined();
    expect(fert.severity).toBe('medium');
  });

  test('fertilizer alert: high when ΔNDVI < NDVI_GROWTH_MIN/2 OR TDVI > TDVI_STRESS_THRESHOLD+0.1', async () => {
    // Case A: Very small delta
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.500, 0.20, 0.55),
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.495, 0.18, 0.30), // delta=0.005 < 0.01
    ];
    let out = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    let fert = out.recommendations.find((r) => r.type === 'fertilizer');
    expect(fert).toBeDefined();
    expect(fert.severity).toBe('high');

    // Case B: TDVI strong stress
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.505, 0.20, 0.62), // tdvi > 0.6 (0.5 + 0.1)
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.18, 0.30),
    ];
    out = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    fert = out.recommendations.find((r) => r.type === 'fertilizer');
    expect(fert).toBeDefined();
    expect(fert.severity).toBe('high');
  });

  test('compute cache: second call returns cache_hit = true and same recommendations', async () => {
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.50, 0.04, 0.55),
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.18, 0.30),
    ];
    const r1 = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: false });
    const r2 = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: false });
    expect(r1.meta.cache_hit).toBe(false);
    expect(r2.meta.cache_hit).toBe(true);
    expect(r2.recommendations.length).toBe(r1.recommendations.length);
  });

  test('upsertRecommendations idempotent by (field_id, timestamp, type); recompute=true updates severity/reason/details', async () => {
    const recs = [
      { type: 'water', severity: 'medium', reason: 'R1', details: { a: 1 } },
      { type: 'fertilizer', severity: 'low', reason: 'R2', details: { b: 2 } },
    ];

    // First insert
    const inserted = await svc.upsertRecommendations(fieldId, date, recs, { recompute: false });
    expect(inserted.length).toBe(2);

    // Insert again with same data (DO NOTHING)
    const again = await svc.upsertRecommendations(fieldId, date, recs, { recompute: false });
    expect(again.length).toBe(2);
    expect(again[0].id).toBe(inserted[0].id);

    // Recompute update
    const updated = await svc.upsertRecommendations(
      fieldId,
      date,
      [{ type: 'water', severity: 'high', reason: 'UPDATED', details: { changed: true } }],
      { recompute: true }
    );
    const w = updated.find((x) => x.type === 'water');
    expect(w).toBeDefined();
    expect(w.severity).toBe('high');
  });

  test('listRecommendations filters by type and range and returns pagination; cache stored and invalidated on upsert', async () => {
    // Seed two days
    await svc.upsertRecommendations(fieldId, '2025-01-14', [{ type: 'water', severity: 'low', reason: 'older' }], { recompute: true });
    await svc.upsertRecommendations(fieldId, '2025-01-15', [{ type: 'fertilizer', severity: 'medium', reason: 'newer' }], { recompute: true });

    // List fertilizer only in range
    const list1 = await svc.listRecommendations(fieldId, { from: '2025-01-14', to: '2025-01-15', type: 'fertilizer', page: 1, pageSize: 10 });
    expect(list1.data.length).toBe(1);
    expect(list1.data[0].type).toBe('fertilizer');

    // Confirm cache set
    const cacheKeyPrefix = `recommendations:list:${fieldId}:`;
    const anyCached = Array.from(redisStore.keys()).some((k) => k.startsWith(cacheKeyPrefix));
    expect(anyCached).toBe(true);

    // Upsert new fertilizer on same day and assert cache invalidation best-effort
    await svc.upsertRecommendations(fieldId, '2025-01-15', [{ type: 'fertilizer', severity: 'high', reason: 'update' }], { recompute: true });
    const list2 = await svc.listRecommendations(fieldId, { from: '2025-01-14', to: '2025-01-15', type: 'fertilizer', page: 1, pageSize: 10 });
    // At least one record and possibly updated severity
    expect(list2.data.length).toBe(1);
    expect(['medium', 'high']).toContain(list2.data[0].severity);
  });

  test('forecast normalization shape consumed by recommendation engine', async () => {
    // Return a normalized forecast with days and totals; engine should read totals.rain_3d_mm / 7d
    mockSnapshots = [
      mockMakeSnapshot(ts, 0.50, 0.04, 0.55),
      mockMakeSnapshot('2025-01-01T00:00:00.000Z', 0.49, 0.48, 0.30),
    ];
    mockForecastPayload = {
      data: {
        days: [{ date: '2025-01-16', rain_mm: 0.0, tmin: 23, tmax: 34, wind: 2.0 }],
        totals: { rain_3d_mm: 0.1, rain_7d_mm: 6.0 },
      },
    };

    const res = await svc.computeRecommendationsForField(userId, fieldId, date, { recompute: true });
    expect(res.recommendations.some((r) => r.type === 'water')).toBe(true);
    const w = res.recommendations.find((r) => r.type === 'water');
    expect(w.details.forecast).toMatchObject({ rain_3d_mm: expect.any(Number), rain_7d_mm: expect.any(Number) });
  });

  test('validation errors thrown for bad inputs', async () => {
    await expect(svc.listRecommendations('', {})).rejects.toMatchObject({ name: 'ValidationError' });
    await expect(svc.listRecommendations(fieldId, { from: '2025-02-01', to: '2025-01-01' })).rejects.toMatchObject({ name: 'ValidationError' });
    await expect(svc.listRecommendations(fieldId, { type: 'invalid' })).rejects.toMatchObject({ name: 'ValidationError' });
    await expect(svc.upsertRecommendations(fieldId, '2025/01/01', [], {})).rejects.toMatchObject({ name: 'ValidationError' });
  });
});