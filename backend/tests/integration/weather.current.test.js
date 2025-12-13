/* eslint-disable camelcase */
const request = require('supertest');
const axios = require('axios');

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
const fakeRedisClient = {
  isOpen: true,
  async get(key) {
    return redisStore.has(key) ? redisStore.get(key) : null;
  },
  async setEx(key, ttl, value) {
    redisStore.set(key, value);
    return 'OK';
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

// Spy Field model to simulate ownership + center point in Sri Lanka
const Field = require('../../src/models/field.model');

jest.spyOn(Field, 'findOne').mockImplementation(async ({ where }) => {
  if (where.user_id === 'user-1' && where.field_id && where.status === 'active') {
    return {
      field_id: where.field_id,
      user_id: 'user-1',
      center: { type: 'Point', coordinates: [80.7001, 7.1234] }, // [lon, lat]
    };
  }
  return null;
});

// Mock axios.get for OpenWeather current
jest.spyOn(axios, 'get').mockImplementation(async url => {
  if (url.includes('onecall') && url.includes('exclude=minutely,hourly,alerts,daily')) {
    return {
      status: 200,
      data: {
        lat: 7.1234,
        lon: 80.7001,
        timezone: 'Asia/Colombo',
        current: {
          dt: 1700000000,
          temp: 30,
          humidity: 60,
          weather: [{ main: 'Clouds', description: 'scattered clouds' }],
        },
      },
    };
  }
  return { status: 500, data: {} };
});

process.env.NODE_ENV = 'test';
process.env.OPENWEATHER_API_KEY = 'test-key';
process.env.JWTSECRET = 'test-secret'; // controller path relies on auth middleware only

// Mock app.js to avoid ES module import issues
jest.mock('../../src/app', () => {
  // eslint-disable-next-line global-require
  const express = require('express');
  const app = express();
  app.use(express.json());

  // Import and register weather routes
  try {
    // eslint-disable-next-line global-require
    const weatherRoutes = require('../../src/api/routes/weather.routes');
    // eslint-disable-next-line global-require
    const fieldRoutes = require('../../src/api/routes/field.routes');
    app.use('/api/v1/weather', weatherRoutes);
    app.use('/api/v1/fields', fieldRoutes);
  } catch (e) {
    // Log error for debugging but continue
    console.error('Failed to load routes in weather test mock:', e.message);
  }

  return {
    __esModule: true,
    default: app,
  };
});

// eslint-disable-next-line global-require
const app = require('../../src/app').default || require('../../src/app');

describe('GET /api/v1/weather/current', () => {
  const field_id = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    // clear cache before each test case
    redisStore.clear();
  });

  it('returns 200 with provider data on first call (cache miss), then cache hit on second call', async () => {
    // First call -> miss
    const res1 = await request(app)
      .get('/api/v1/weather/current')
      .set('Authorization', 'Bearer token') // authMiddleware mocked; token not validated
      .query({ field_id })
      .expect(200);

    expect(res1.body).toHaveProperty('success', true);
    expect(res1.body).toHaveProperty('data');
    expect(res1.body).toHaveProperty('meta');
    expect(res1.body.meta).toMatchObject({ cache: 'miss', source: 'provider' });
    expect(res1.body.data).toMatchObject({
      field_id,
      coord: { lat: expect.any(Number), lon: expect.any(Number) },
      current: expect.any(Object),
      source: 'openweathermaponecall',
    });

    // Second call -> hit (from cache)
    const res2 = await request(app)
      .get('/api/v1/weather/current')
      .set('Authorization', 'Bearer token')
      .query({ field_id })
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cache: 'hit', source: 'cache' });
    expect(res2.body.data.field_id).toBe(field_id);
  });

  it('returns 400 when field_id is invalid', async () => {
    const res = await request(app)
      .get('/api/v1/weather/current')
      .set('Authorization', 'Bearer token')
      .query({ field_id: 'not-a-uuid' })
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code');
  });

  it('returns 404 when field not found or not owned by user', async () => {
    // Patch Field.findOne to simulate missing
    const spy = jest.spyOn(Field, 'findOne');
    spy.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/v1/weather/current')
      .set('Authorization', 'Bearer token')
      .query({ field_id })
      .expect(404);

    expect(res.body.success).toBe(false);

    // restore default mock
    spy.mockRestore();
  });
});
