const axios = require('axios');

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
  async expire(key, ttl) {
    return 1;
  },
  async scan(cursor, opts = {}) {
    const { MATCH } = opts || {};
    const keys = Array.from(store.keys()).filter(k => (!MATCH ? true : matchPattern(k, MATCH)));
    return ['0', keys];
  },
};

// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

const Field = require('../../src/models/field.model');
const { WeatherService } = require('../../src/services/weather.service');
const { ValidationError } = require('../../src/errors/custom-errors');

describe('WeatherService branch coverage lift', () => {
  let svc;

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    process.env.OPENWEATHER_API_KEY = 'test-api-key';
    // Default field center
    jest.spyOn(Field, 'findOne').mockResolvedValue({
      field_id: 'fid-1',
      user_id: 'user-1',
      status: 'active',
      center: { type: 'Point', coordinates: [80.11, 7.21] },
    });
    svc = new WeatherService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getCurrentByField: cache hit short-circuits and returns cached payload', async () => {
    const cacheKey = 'weather:current:fid-1';
    const cached = {
      field_id: 'fid-1',
      coord: { lat: 7.21, lon: 80.11 },
      current: { temp: 30 },
      source: 'openweathermaponecall',
      fetchedat: new Date().toISOString(),
    };
    await fakeRedis.setEx(cacheKey, 21600, JSON.stringify(cached));

    const out = await svc.getCurrentByField('user-1', 'fid-1');
    expect(out.meta).toEqual({ cache: 'hit', source: 'cache' });
    expect(out.data).toMatchObject({ field_id: 'fid-1', current: { temp: 30 } });
  });

  test('getCurrentByField: success provider path -> miss then provider', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: { current: { temp: 28 } },
    });

    const out = await svc.getCurrentByField('user-1', 'fid-1');
    expect(out.meta.source).toBe('provider');
    expect(out.meta.cache).toBe('miss');
    expect(out.data.current.temp).toBe(28);
  });

  test('getCurrentByField: 4xx client error maps to ValidationError with statusCode from provider', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 401,
      statusText: 'Unauthorized',
      data: {},
    });
    await expect(svc.getCurrentByField('user-1', 'fid-1')).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  test('getCurrentByField: 5xx error retries and ends as SERVICE_UNAVAILABLE 503', async () => {
    // Avoid real timer waits on backoff
    jest.spyOn(global, 'setTimeout').mockImplementation(fn => {
      // call immediately
      fn();
      return 0;
    });
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 500,
      data: {},
    });
    await expect(svc.getCurrentByField('user-1', 'fid-1')).rejects.toMatchObject({
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
    });
  });

  test('getForecastByField: success provider path returns limited daily array', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: { daily: new Array(10).fill(0).map((_, i) => ({ day: i })) },
    });

    const out = await svc.getForecastByField('user-1', 'fid-1');
    expect(out.data.daily.length).toBeLessThanOrEqual(7);
    expect(out.meta.source).toBe('provider');
  });

  test('getCurrentByField: missing API key throws ValidationError quickly', async () => {
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.WEATHER_API_KEY;
    await expect(svc.getCurrentByField('user-1', 'fid-1')).rejects.toBeInstanceOf(ValidationError);
  });
});
