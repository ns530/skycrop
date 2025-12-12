process.env.NODE_ENV = 'test';
process.env.OPENWEATHER_API_KEY = 'test-api-key';

// In-memory fake Redis
const store = new Map();
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
};

// Mock Redis config
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedis,
  getRedisClient: () => fakeRedis,
}));

// Mock axios
const axios = require('axios');

jest.mock('axios', () => ({
  get: jest.fn(),
}));

// Mock Field model
jest.mock('../../src/models/field.model', () => ({
  findOne: jest.fn(),
}));

const Field = require('../../src/models/field.model');
const { WeatherService } = require('../../src/services/weather.service');

describe('WeatherService unit', () => {
  let svc;

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    svc = new WeatherService();
  });

  test('init initializes redis client', async () => {
    svc.redis = null;
    await svc.init();
    expect(svc.redis).toBe(fakeRedis);
  });

  test('requireApiKey throws when no API key', () => {
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.WEATHER_API_KEY;
    expect(() => svc.requireApiKey()).toThrow('OPENWEATHER_API_KEY is not configured');
  });

  test('requireApiKey returns API key', () => {
    process.env.OPENWEATHER_API_KEY = 'test-key';
    expect(svc.requireApiKey()).toBe('test-key');
  });

  test('fieldCenterToLatLon extracts coordinates', () => {
    const field = { center: { coordinates: [80.5, 7.2] } };
    const result = svc.fieldCenterToLatLon(field);
    expect(result).toEqual({ lat: 7.2, lon: 80.5 });
  });

  test('fieldCenterToLatLon throws for invalid field', () => {
    expect(() => svc.fieldCenterToLatLon({})).toThrow('Field center point is missing');
    expect(() => svc.fieldCenterToLatLon({ center: {} })).toThrow('Field center point is missing');
  });

  test('cacheKey generates correct key', () => {
    expect(svc.cacheKey('current', 'field-1')).toBe('weather:current:field-1');
    expect(svc.cacheKey('forecast', 'field-2')).toBe('weather:forecast:field-2');
  });

  test('getFieldOrThrow validates parameters', async () => {
    await expect(svc.getFieldOrThrow(null, 'field-1')).rejects.toThrow('user_id is required');
    await expect(svc.getFieldOrThrow('user-1', null)).rejects.toThrow('field_id is required');
  });

  test('getFieldOrThrow throws NotFoundError for missing field', async () => {
    Field.findOne.mockResolvedValue(null);
    await expect(svc.getFieldOrThrow('user-1', 'field-1')).rejects.toThrow('Field not found');
  });

  test('getFieldOrThrow returns field', async () => {
    const field = { field_id: 'field-1', user_id: 'user-1' };
    Field.findOne.mockResolvedValue(field);
    const result = await svc.getFieldOrThrow('user-1', 'field-1');
    expect(result).toBe(field);
  });

  test('requestWithRetry succeeds on first attempt', async () => {
    const mockResponse = { status: 200, data: { current: { temp: 25 } } };
    axios.get.mockResolvedValue(mockResponse);
    const result = await svc.requestWithRetry('http://test.com', 'test.label');
    expect(result).toEqual({ current: { temp: 25 } });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  test('requestWithRetry retries on 5xx errors', async () => {
    axios.get
      .mockResolvedValueOnce({ status: 500, data: {} })
      .mockResolvedValueOnce({ status: 200, data: { success: true } });
    const result = await svc.requestWithRetry('http://test.com', 'test.label');
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  test('requestWithRetry throws on 4xx errors without retry', async () => {
    axios.get.mockResolvedValue({ status: 401, data: {}, statusText: 'Unauthorized' });
    await expect(svc.requestWithRetry('http://test.com', 'test.label')).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'Weather API error (401): Unauthorized',
      statusCode: 401,
    });
  });

  test('requestWithRetry throws after max retries', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    await expect(svc.requestWithRetry('http://test.com', 'test.label')).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503,
    });
  });

  test('getCurrentByField returns cached data', async () => {
    await svc.init();
    const cachedData = { field_id: 'field-1', current: { temp: 20 } };
    store.set('weather:current:field-1', JSON.stringify(cachedData));

    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    const result = await svc.getCurrentByField('user-1', 'field-1');
    expect(result.data).toEqual(cachedData);
    expect(result.meta.cache).toBe('hit');
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('getCurrentByField fetches from API when not cached', async () => {
    await svc.init();
    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    axios.get.mockResolvedValue({
      status: 200,
      data: { current: { temp: 25, humidity: 60 } },
    });

    const result = await svc.getCurrentByField('user-1', 'field-1');
    expect(result.data.current.temp).toBe(25);
    expect(result.meta.cache).toBe('miss');
    expect(result.meta.source).toBe('provider');
  });

  test('getCurrentByField falls back to cache on API failure', async () => {
    await svc.init();
    const cachedData = { field_id: 'field-1', current: { temp: 20 } };
    store.set('weather:current:field-1', JSON.stringify(cachedData));

    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    axios.get.mockRejectedValue(new Error('API down'));

    const result = await svc.getCurrentByField('user-1', 'field-1');
    expect(result.data).toEqual(cachedData);
    expect(result.meta.cache).toBe('hit');
  });

  test('getForecastByField returns cached data', async () => {
    await svc.init();
    const cachedData = { field_id: 'field-1', daily: [] };
    store.set('weather:forecast:field-1', JSON.stringify(cachedData));

    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    const result = await svc.getForecastByField('user-1', 'field-1');
    expect(result.data).toEqual(cachedData);
    expect(result.meta.cache).toBe('hit');
  });

  test('getForecastByField fetches from API when not cached', async () => {
    await svc.init();
    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    axios.get.mockResolvedValue({
      status: 200,
      data: { daily: [{ dt: Date.now() / 1000, temp: { min: 20, max: 30 }, rain: 5 }] },
    });

    const result = await svc.getForecastByField('user-1', 'field-1');
    expect(result.data.daily).toHaveLength(1);
    expect(result.meta.cache).toBe('miss');
  });

  test('normalizeDaily processes daily array', () => {
    const daily = [
      {
        dt: Date.now() / 1000,
        temp: { min: 20, max: 30 },
        rain: 5,
        wind_speed: 2.5,
      },
      {
        dt: (Date.now() + 86400000) / 1000,
        temp: { min: 22, max: 32 },
        rain: 0,
        wind_speed: 3.0,
      },
    ];
    const result = svc.normalizeDaily(daily);
    expect(result.days).toHaveLength(2);
    expect(result.days[0].rain_mm).toBe(5);
    expect(result.days[0].tmin).toBe(20);
    expect(result.days[0].tmax).toBe(30);
    expect(result.days[0].wind).toBe(2.5);
    expect(result.totals.rain_3d_mm).toBe(5);
    expect(result.totals.rain_7d_mm).toBe(5);
  });

  test('forecastCacheKeyByCoords generates key', () => {
    expect(svc.forecastCacheKeyByCoords(7.1234, 80.5678)).toBe('weather:forecast:7.1234:80.5678');
  });

  test('getForecast returns normalized cached data', async () => {
    await svc.init();
    const cachedData = {
      coord: { lat: 7, lon: 80 },
      days: [],
      totals: { rain_3d_mm: 0, rain_7d_mm: 0 },
    };
    store.set('weather:forecast:7.0000:80.0000', JSON.stringify(cachedData));

    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    const result = await svc.getForecast('user-1', 'field-1');
    expect(result.data).toEqual(cachedData);
    expect(result.meta.cache).toBe('hit');
  });

  test('getForecast fetches and normalizes from API', async () => {
    await svc.init();
    Field.findOne.mockResolvedValue({ center: { coordinates: [80, 7] } });
    axios.get.mockResolvedValue({
      status: 200,
      data: {
        daily: [
          { dt: Date.now() / 1000, temp: { min: 20, max: 30 }, rain: 5 },
          { dt: (Date.now() + 86400000) / 1000, temp: { min: 22, max: 32 }, rain: 3 },
        ],
      },
    });

    const result = await svc.getForecast('user-1', 'field-1');
    expect(result.data.days).toHaveLength(2);
    expect(result.data.totals.rain_3d_mm).toBe(8);
    expect(result.data.totals.rain_7d_mm).toBe(8);
    expect(result.meta.cache).toBe('miss');
  });

  test('getForecastByCoords works without field validation', async () => {
    await svc.init();
    axios.get.mockResolvedValue({
      status: 200,
      data: { daily: [{ dt: Date.now() / 1000, temp: { min: 20, max: 30 }, rain: 5 }] },
    });

    const result = await svc.getForecastByCoords(7, 80);
    expect(result.data.coord).toEqual({ lat: 7, lon: 80 });
    expect(result.data.days).toHaveLength(1);
  });

  test('getWeatherService returns singleton', () => {
    const { getWeatherService } = require('../../src/services/weather.service');
    const svc1 = getWeatherService();
    const svc2 = getWeatherService();
    expect(svc1).toBeInstanceOf(WeatherService);
    expect(svc1).toBe(svc2);
  });
});
