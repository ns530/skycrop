process.env.NODE_ENV = 'test';

// In-memory fake Redis
const store = new Map();
function matchPattern(key, pattern) {
  const re = new RegExp(
    `^${String(pattern)
      .replace(/[.+^${}()|[\\]\\\\]/g, '\\$&')
      .replace(/\\\*/g, '.*')}$`
  );
  return re.test(key);
}
const fakeRedis = {
  isOpen: true,
  async get(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setEx(key, ttl, value) {
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
  async incr(key) {
    const cur = Number(store.get(key) || 0);
    const next = cur + 1;
    store.set(key, String(next));
    return next;
  },
  async expire(_key, _ttl) {
    return 1;
  },
  async scan(cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(store.keys()).filter(k => (!MATCH ? true : matchPattern(k, MATCH)));
    return ['0', keys];
  },
};

// Mock Redis client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: jest.fn(async () => fakeRedis),
  getRedisClient: jest.fn(() => fakeRedis),
}));

// Mocks for dependencies
const Field = require('../../src/models/field.model');
const HealthRecord = require('../../src/models/health.model');

// Weather service dynamic mock
let mockForecast = jest.fn();
jest.mock('../../src/services/weather.service', () => ({
  getWeatherService: () => ({
    getForecastByField: (...args) => mockForecast(...args),
  }),
}));

const { FieldHealthService } = require('../../src/services/fieldHealth.service');
const { ValidationError, NotFoundError } = require('../../src/errors/custom-errors');

describe('FieldHealthService unit', () => {
  let svc;

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    svc = new FieldHealthService();

    // Default ownership check: field exists for user
    jest.spyOn(Field, 'findOne').mockImplementation(async ({ where }) => {
      if (where && where.user_id && where.field_id) {
        return {
          field_id: where.field_id,
          user_id: where.user_id,
          status: 'active',
          center: { type: 'Point', coordinates: [80.105, 7.205] },
        };
      }
      return null;
    });

    // Default latest health record
    jest.spyOn(HealthRecord, 'findOne').mockImplementation(async ({ where, order }) => {
      if (where && where.field_id && Array.isArray(order)) {
        return {
          field_id: where.field_id,
          measurementdate: new Date().toISOString(),
          healthstatus: 'good',
          ndvimean: 0.34,
          ndwimean: 0.22,
          tdvimean: 0.15,
          cloudcover: 10,
        };
      }
      return null;
    });

    // Default forecast: none (simulate unavailable upstream)
    mockForecast = jest.fn().mockRejectedValue(new Error('forecast unavailable'));
  });

  test('throws ValidationError when user_id is missing', async () => {
    await expect(svc.getFieldHealth('field-1', null)).rejects.toBeInstanceOf(ValidationError);
  });

  test('throws ValidationError when field_id is missing', async () => {
    await expect(svc.getFieldHealth(null, 'user-1')).rejects.toBeInstanceOf(ValidationError);
  });

  test('throws NotFoundError when ownership check fails', async () => {
    Field.findOne.mockResolvedValueOnce(null);
    await expect(svc.getFieldHealth('field-x', 'user-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('returns neutral summary when no latest health record (cache miss path)', async () => {
    // Make latest record not found
    HealthRecord.findOne.mockResolvedValueOnce(null);

    const setExSpy = jest.spyOn(fakeRedis, 'setEx');

    const res = await svc.getFieldHealth('field-1', 'user-1');
    expect(res).toMatchObject({
      id: 'field-1',
      score: 50,
      status: 'moderate', // 50 → moderate per statusFromScore
      signals: [],
    });
    expect(Array.isArray(res.advice)).toBe(true);
    expect(res.advice.join(' ')).toMatch(/No satellite-derived health data yet/i);
    expect(setExSpy).toHaveBeenCalledTimes(1);
    expect(setExSpy.mock.calls[0][0]).toBe('field:health:field-1');
  });

  test('computes summary from latest record, caches it, and serves from cache on subsequent call', async () => {
    const getSpy = jest.spyOn(fakeRedis, 'get');
    const setSpy = jest.spyOn(fakeRedis, 'setEx');
    const recSpy = jest.spyOn(HealthRecord, 'findOne');

    // First call: cache miss, compute and cache
    const out1 = await svc.getFieldHealth('field-2', 'user-1');
    expect(out1.id).toBe('field-2');
    expect(typeof out1.score).toBe('number');
    expect(['good', 'moderate', 'poor']).toContain(out1.status);
    expect(Array.isArray(out1.signals)).toBe(true);
    expect(setSpy).toHaveBeenCalledTimes(1);

    // Second call: should hit cache; no extra HealthRecord.findOne
    const out2 = await svc.getFieldHealth('field-2', 'user-1');
    expect(out2).toEqual(out1);
    expect(getSpy).toHaveBeenCalledTimes(2); // read twice
    expect(recSpy).toHaveBeenCalledTimes(1); // only first call hit DB
  });

  test('advice includes rain tip when forecast indicates significant precipitation', async () => {
    mockForecast = jest.fn().mockResolvedValue({
      data: {
        daily: [
          { dt: 1, pop: 0.7 }, // triggers rain advice via pop>=0.6
        ],
      },
    });

    const out = await svc.getFieldHealth('field-3', 'user-1');
    const tips = out.advice.join(' | ');
    expect(tips).toMatch(/Significant rain expected soon/i);
  });

  test('signalsFromRecord returns present metrics with weights', () => {
    const rec = { ndvimean: 0.2, ndwimean: 0.3, tdvimean: 0.1, cloudcover: 25 };
    const sigs = svc.signalsFromRecord(rec);
    const keys = sigs.map(s => s.key).sort();
    expect(keys).toEqual(['cloud', 'ndvimean', 'ndwimean', 'tdvimean'].sort());
    const w = Object.fromEntries(sigs.map(s => [s.key, s.weight]));
    expect(w.ndvimean).toBeCloseTo(0.4, 5);
    expect(w.ndwimean).toBeCloseTo(0.3, 5);
    expect(w.tdvimean).toBeCloseTo(0.2, 5);
    expect(w.cloud).toBeCloseTo(0.1, 5);
  });

  test('statusFromScore thresholds: 70→good, 40→moderate, <40→poor', () => {
    expect(svc.statusFromScore(70)).toBe('good');
    expect(svc.statusFromScore(69)).toBe('moderate');
    expect(svc.statusFromScore(40)).toBe('moderate');
    expect(svc.statusFromScore(39)).toBe('poor');
  });

  test('scoreFromRecord clamps and adjusts with ndvi/ndwi/cloud', () => {
    const base = { healthstatus: 'good', ndvimean: 0.9, ndwimean: 1.0, cloudcover: 90 };
    const score = svc.scoreFromRecord(base);
    // Should be within 0..100 range (clamped)
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('maybeGetForecast returns null when weather service throws', async () => {
    mockForecast = jest.fn().mockRejectedValue(new Error('fail'));
    // Call private via any
    const out = await svc.maybeGetForecast('user-1', 'field-9');
    expect(out).toBeNull();
  });

  test('ownership validation messages for missing parameters are precise', async () => {
    // Directly assert private method throws with specific messages
    await expect(svc.assertOwnership(null, 'f')).rejects.toThrow(/user_id is required/i);
    await expect(svc.assertOwnership('u', null)).rejects.toThrow(/field_id is required/i);
  });
});
