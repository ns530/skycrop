'use strict';

const request = require('supertest');

// Mock rate limiter to no-op for tests
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (_req, _res, next) => next(),
  authLimiter: (_req, _res, next) => next(),
}));

// Mock auth middleware to inject a test user
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { userId: 'test-user-123' };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requireAnyRole: () => (_req, _res, next) => next(),
}));

// In-memory fake Redis
const redisStore = new Map();
const fakeRedisClient = {
  isOpen: true,
  async get(key) {
    return redisStore.has(key) ? redisStore.get(key) : null;
  },
  async setEx(key, _ttl, value) {
    redisStore.set(key, value);
    return 'OK';
  },
  async setex(key, _ttl, value) {
    redisStore.set(key, value);
    return 'OK';
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

// Mock database queries
const { QueryTypes } = require('sequelize');
jest.mock('../../src/config/database.config', () => {
  const { QueryTypes: OriginalQueryTypes } = jest.requireActual('sequelize');
  return {
    sequelize: {
      query: jest.fn(),
      define: jest.fn((modelName) => {
        // Return a minimal mock model
        return {
          name: modelName,
          findOne: jest.fn(),
          findAll: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          destroy: jest.fn(),
          hasMany: jest.fn(),
          belongsTo: jest.fn(),
          scope: jest.fn(() => ({ findOne: jest.fn() })),
        };
      }),
      literal: jest.fn((val) => val),
      Op: {},
      QueryTypes: OriginalQueryTypes,
    },
  };
});

const { sequelize } = require('../../src/config/database.config');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DASHBOARD_CACHE_TTL_SEC = '300';

const app = require('../../src/app');

describe('GET /api/v1/dashboard/metrics', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('returns dashboard metrics with cache miss then hit', async () => {
    // Mock database queries
    sequelize.query
      .mockResolvedValueOnce([{ total_fields: 5, active_fields: 4, total_area_sqm: 250000, avg_field_size_sqm: 62500 }]) // field metrics
      .mockResolvedValueOnce([ // health metrics
        { health_score: 75, health_status: 'good', ndvi_mean: 0.65, ndwi_mean: 0.25, measurement_date: '2025-11-15T10:00:00Z', field_id: 'field-1', field_name: 'Field 1' },
        { health_score: 82, health_status: 'excellent', ndvi_mean: 0.72, ndwi_mean: 0.30, measurement_date: '2025-11-15T10:00:00Z', field_id: 'field-2', field_name: 'Field 2' },
        { health_score: 68, health_status: 'fair', ndvi_mean: 0.58, ndwi_mean: 0.20, measurement_date: '2025-11-15T10:00:00Z', field_id: 'field-3', field_name: 'Field 3' },
        { health_score: 45, health_status: 'poor', ndvi_mean: 0.35, ndwi_mean: 0.10, measurement_date: '2025-11-15T10:00:00Z', field_id: 'field-4', field_name: 'Field 4' }
      ])
      .mockResolvedValueOnce([{ total_alerts: 3, high_severity: 1, medium_severity: 2, low_severity: 0, water_alerts: 2, fertilizer_alerts: 1 }]) // alert metrics
      .mockResolvedValueOnce([ // recent health activity
        { activity_type: 'health_assessment', activity_date: '2025-11-18T08:00:00Z', field_name: 'Field 1', health_status: 'good', health_score: 75 },
        { activity_type: 'health_assessment', activity_date: '2025-11-17T14:00:00Z', field_name: 'Field 2', health_status: 'excellent', health_score: 82 }
      ])
      .mockResolvedValueOnce([ // recent recommendation activity
        { activity_type: 'recommendation', activity_date: '2025-11-16T10:00:00Z', field_name: 'Field 3', type: 'water', severity: 'high' }
      ])
      .mockResolvedValueOnce([ // field thumbnails
        { field_id: 'field-1', name: 'Field 1', center: { type: 'Point', coordinates: [80.1, 7.2] }, area_sqm: 100000 },
        { field_id: 'field-2', name: 'Field 2', center: { type: 'Point', coordinates: [80.2, 7.3] }, area_sqm: 75000 },
        { field_id: 'field-3', name: 'Field 3', center: { type: 'Point', coordinates: [80.3, 7.4] }, area_sqm: 50000 },
        { field_id: 'field-4', name: 'Field 4', center: { type: 'Point', coordinates: [80.4, 7.5] }, area_sqm: 25000 }
      ]);

    const res1 = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'dashboard-req-1')
      .expect(200);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toHaveProperty('fields');
    expect(res1.body.data).toHaveProperty('health');
    expect(res1.body.data).toHaveProperty('alerts');
    expect(res1.body.data).toHaveProperty('recent_activity');
    expect(res1.body.data).toHaveProperty('field_thumbnails');
    expect(res1.body.meta).toMatchObject({ cache_hit: false, correlation_id: 'dashboard-req-1' });

    // Verify field metrics
    expect(res1.body.data.fields).toEqual({
      total: 5,
      active: 4,
      total_area_hectares: 25,
      average_size_hectares: 6.25
    });

    // Verify health metrics
    expect(res1.body.data.health.average_score).toBe(68); // (75+82+68+45)/4
    expect(res1.body.data.health.status_distribution).toEqual({ good: 2, moderate: 1, poor: 1 });
    expect(res1.body.data.health.total_assessed).toBe(4);

    // Verify alert metrics
    expect(res1.body.data.alerts.total).toBe(3);
    expect(res1.body.data.alerts.by_severity).toEqual({ high: 1, medium: 2, low: 0 });
    expect(res1.body.data.alerts.by_type).toEqual({ water: 2, fertilizer: 1 });

    // Verify recent activity
    expect(res1.body.data.recent_activity).toHaveLength(3);
    expect(res1.body.data.recent_activity[0].type).toBe('health_assessment');
    expect(res1.body.data.recent_activity[0].field_name).toBe('Field 1');

    // Verify field thumbnails
    expect(res1.body.data.field_thumbnails).toHaveLength(4);
    expect(res1.body.data.field_thumbnails[0]).toMatchObject({
      field_id: 'field-1',
      field_name: 'Field 1',
      thumbnail_url: expect.stringContaining('/api/v1/satellite/tiles/'),
      area_hectares: 10
    });

    // Second request should hit cache
    const res2 = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'dashboard-req-2')
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cache_hit: true, correlation_id: 'dashboard-req-2' });
    // Database should not be queried again
    expect(sequelize.query).toHaveBeenCalledTimes(6); // Only called once for the first request
  });

  it('handles empty results gracefully', async () => {
    // Mock empty results
    sequelize.query
      .mockResolvedValueOnce([{ total_fields: 0, active_fields: 0, total_area_sqm: null, avg_field_size_sqm: null }])
      .mockResolvedValueOnce([]) // no health records
      .mockResolvedValueOnce([{ total_alerts: 0, high_severity: 0, medium_severity: 0, low_severity: 0, water_alerts: 0, fertilizer_alerts: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fields.total).toBe(0);
    expect(res.body.data.health.average_score).toBe(50); // default
    expect(res.body.data.health.total_assessed).toBe(0);
    expect(res.body.data.alerts.total).toBe(0);
    expect(res.body.data.recent_activity).toEqual([]);
    expect(res.body.data.field_thumbnails).toEqual([]);
  });

  it('propagates X-Request-Id into meta.correlation_id', async () => {
    sequelize.query
      .mockResolvedValueOnce([{ total_fields: 1, active_fields: 1, total_area_sqm: 10000, avg_field_size_sqm: 10000 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total_alerts: 0, high_severity: 0, medium_severity: 0, low_severity: 0, water_alerts: 0, fertilizer_alerts: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'dashboard-corr-xyz')
      .expect(200);

    expect(res.body.meta.correlation_id).toBe('dashboard-corr-xyz');
  });
});