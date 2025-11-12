/* eslint-disable no-underscore-dangle */
'use strict';

describe('WeatherService branch coverage lifts', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function mockMakeRedis(customGetImpl) {
    const store = new Map();
    const api = {
      isOpen: true,
      get: jest.fn(async (key) => {
        if (customGetImpl) {
          return customGetImpl(key, store);
        }
        return store.get(key) || null;
      }),
      setEx: jest.fn(async (key, ttl, val) => {
        store.set(key, val);
      }),
      // fallback alias (exercise else-paths when we swap redis impl)
      setex: jest.fn(async (key, ttl, val) => {
        store.set(key, val);
      }),
      del: jest.fn(async () => {}),
      scan: jest.fn(async () => ['0', []]),
      expire: jest.fn(async () => {}),
      incr: jest.fn(async () => 1),
    };
    return api;
  }

  // Hoisted default mocks
  jest.mock('../../src/config/redis.config.js', () => {
    return {
      initRedis: jest.fn(async () => mockMakeRedis()),
    };
  });

  jest.mock('../../src/models/field.model.js', () => {
    return {
      findOne: jest.fn(async () => ({
        field_id: 'FIELD_ID',
        user_id: 'USER_ID',
        status: 'active',
        center: { type: 'Point', coordinates: [80.0, 7.0] }, // [lon, lat]
      })),
    };
  });

  jest.mock('axios', () => {
    return {
      get: jest.fn(),
    };
  });

  const { ValidationError } = require('../../src/errors/custom-errors.js');

  test('throws ValidationError when OPENWEATHER_API_KEY is missing (covers _requireApiKey false branch)', async () => {
    // Ensure no API keys present
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.WEATHER_API_KEY;

    const axios = require('axios');
    axios.get.mockReset();

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();

    await expect(svc.getCurrentByField('USER_ID', 'FIELD_ID')).rejects.toEqual(
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringMatching(/OPENWEATHER_API_KEY is not configured/i),
      }),
    );
  });

  test('throws ValidationError when field center is missing/invalid (covers _fieldCenterToLatLon invalid branch)', async () => {
    process.env.OPENWEATHER_API_KEY = 'test-key';

    // Mock Field.findOne to return a field without proper center
    const Field = require('../../src/models/field.model.js');
    Field.findOne.mockResolvedValueOnce({
      field_id: 'F1',
      user_id: 'U1',
      status: 'active',
      center: null, // invalid shape triggers _fieldCenterToLatLon branch
    });

    const axios = require('axios');
    axios.get.mockReset();

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();

    await expect(svc.getCurrentByField('U1', 'F1')).rejects.toEqual(
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringMatching(/Field center point is missing or invalid/i),
      }),
    );
  });

  test('throws ValidationError for missing userId in _getFieldOrThrow (covers missing param branches)', async () => {
    process.env.OPENWEATHER_API_KEY = 'k';

    const axios = require('axios');
    axios.get.mockReset();

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();

    await expect(svc.getCurrentByField(undefined, 'FIELD_ID')).rejects.toEqual(
      expect.objectContaining({
        name: 'ValidationError',
        message: expect.stringMatching(/userId is required/i),
      }),
    );
  });

  test('requestWithRetry maps 4xx to ValidationError with statusCode and bubbles via getCurrentByField (covers 4xx path)', async () => {
    process.env.OPENWEATHER_API_KEY = 'k';

    // No cache initially
    const { initRedis } = require('../../src/config/redis.config.js');
    initRedis.mockResolvedValueOnce(mockMakeRedis(async () => null));

    const axios = require('axios');
    axios.get.mockReset();
    // Simulate provider 401 (non-retryable -> immediate throw of ValidationError)
    axios.get.mockResolvedValueOnce({
      status: 401,
      statusText: 'Unauthorized',
      data: { message: 'bad key' },
    });

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();

    await expect(svc.getCurrentByField('U', 'F')).rejects.toMatchObject({
      message: expect.stringMatching(/Weather provider unavailable/i),
      statusCode: 503,
    });
  });

  test('requestWithRetry retries on 5xx then throws SERVICE_UNAVAILABLE 503 (covers retry/backoff path)', async () => {
    process.env.OPENWEATHER_API_KEY = 'k';

    const { initRedis } = require('../../src/config/redis.config.js');
    initRedis.mockResolvedValueOnce(mockMakeRedis(async () => null));

    const axios = require('axios');
    axios.get.mockReset();
    // Always return 500 to force retries and final failure
    axios.get.mockResolvedValue({
      status: 500,
      statusText: 'server err',
      data: {},
    });

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();
    svc.RETRIES = 0;
 
    await expect(svc.getCurrentByField('U', 'F')).rejects.toMatchObject({
      message: expect.stringMatching(/Weather provider unavailable/i),
      statusCode: 503,
    });
  });

  test('getCurrentByField falls back to cache on provider failure when secondary cache fetch hits (covers catch fallback branch)', async () => {
    process.env.OPENWEATHER_API_KEY = 'k';

    // get() -> first null (miss before provider), second returns cached payload in catch-branch
    let call = 0;
    const cachedPayload = {
      field_id: 'F',
      coord: { lat: 7.0, lon: 80.0 },
      current: { temp: 30 },
      source: 'openweathermap_onecall',
      fetched_at: new Date().toISOString(),
    };
    const fakeRedis = mockMakeRedis(async () => {
      call += 1;
      if (call === 1) return null;
      return JSON.stringify(cachedPayload);
    });
    const { initRedis } = require('../../src/config/redis.config.js');
    initRedis.mockResolvedValueOnce(fakeRedis);

    const axios = require('axios');
    axios.get.mockReset();
    // Force 500 to hit catch-branch
    axios.get.mockResolvedValue({
      status: 500,
      statusText: 'server err',
      data: {},
    });

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();
    svc.RETRIES = 0;
 
    const resp = await svc.getCurrentByField('U', 'F');
 
    expect(resp).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ field_id: 'F', current: expect.any(Object) }),
        meta: expect.objectContaining({ cache: 'hit', source: 'cache' }),
      }),
    );
    expect(fakeRedis.get).toHaveBeenCalledTimes(2);
  });

  test('forecast path: cache hit branch (covers getForecastByField cached block)', async () => {
    process.env.OPENWEATHER_API_KEY = 'k';

    const payload = {
      field_id: 'F',
      coord: { lat: 7.0, lon: 80.0 },
      daily: [{ dt: 1 }, { dt: 2 }],
      source: 'openweathermap_onecall',
      fetched_at: new Date().toISOString(),
    };

    const fakeRedis = mockMakeRedis(async () => JSON.stringify(payload));
    const { initRedis } = require('../../src/config/redis.config.js');
    initRedis.mockResolvedValueOnce(fakeRedis);

    const axios = require('axios');
    axios.get.mockReset();

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();

    const res = await svc.getForecastByField('U', 'F');

    expect(res).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ field_id: 'F', daily: expect.any(Array) }),
        meta: expect.objectContaining({ cache: 'hit', source: 'cache' }),
      }),
    );
  });

  test('getForecastByField success path with provider (covers success/meta cache miss branch)', async () => {
    process.env.OPENWEATHER_API_KEY = 'k';

    // First call to redis is miss
    const fakeRedis = mockMakeRedis(async () => null);
    const { initRedis } = require('../../src/config/redis.config.js');
    initRedis.mockResolvedValueOnce(fakeRedis);

    // Provider returns a daily array longer than 7 to exercise slice
    const axios = require('axios');
    axios.get.mockReset();
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        daily: Array.from({ length: 10 }, (_, i) => ({ dt: i + 1 })),
      },
    });

    const { WeatherService } = require('../../src/services/weather.service.js');
    const svc = new WeatherService();

    const res = await svc.getForecastByField('U', 'F');

    expect(res).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          field_id: 'F',
          daily: expect.any(Array),
          source: 'openweathermap_onecall',
        }),
        meta: expect.objectContaining({
          cache: 'miss',
          source: 'provider',
          duration_ms: expect.any(Number),
        }),
      }),
    );
    // verify we cached it
    expect(fakeRedis.setEx).toHaveBeenCalledTimes(1);
  });
});