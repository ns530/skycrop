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

// Mock weather service
jest.mock('../../src/services/weather.service', () => ({
  getWeatherService: jest.fn(() => ({
    getForecast: jest.fn().mockResolvedValue({
      data: {
        days: [
          { date: '2025-12-06', rain_mm: 0, tmin: 22, tmax: 32, wind: 5 },
          { date: '2025-12-07', rain_mm: 2, tmin: 21, tmax: 31, wind: 4 },
          { date: '2025-12-08', rain_mm: 0, tmin: 23, tmax: 33, wind: 6 },
          { date: '2025-12-09', rain_mm: 1, tmin: 22, tmax: 32, wind: 5 },
          { date: '2025-12-10', rain_mm: 0, tmin: 21, tmax: 31, wind: 4 },
          { date: '2025-12-11', rain_mm: 3, tmin: 23, tmax: 33, wind: 6 },
          { date: '2025-12-12', rain_mm: 0, tmin: 22, tmax: 32, wind: 5 }
        ],
        totals: { rain_3d_mm: 3, rain_7d_mm: 6 }
      }
    })
  }))
}));

// Mock ML Gateway service
jest.mock('../../src/services/mlGateway.service', () => ({
  getMLGatewayService: jest.fn(() => ({
    getDisasterAssessment: jest.fn().mockResolvedValue({
      risk_level: 'low',
      disaster_types: ['flood'],
      confidence: 0.85,
      assessed_at: new Date().toISOString()
    })
  }))
}));

// Mock Sequelize entirely
jest.mock('sequelize', () => {
  const { QueryTypes: OriginalQueryTypes } = jest.requireActual('sequelize');

  // Create a mock Model class that mimics Sequelize Model
  class MockModel {
    constructor(data = {}) {
      Object.assign(this, data);
      this.name = 'MockModel';
    }

    static init(attributes, options) {
      // Mock init method - just return the class
      this._attributes = attributes;
      this._options = options;
      return this;
    }

    static findOne() { return Promise.resolve(null); }
    static findAll() { return Promise.resolve([]); }
    static create(data) { return Promise.resolve(new this(data)); }
    static update() { return Promise.resolve([0]); }
    static destroy() { return Promise.resolve(0); }
    static hasMany() { return this; }
    static belongsTo() { return this; }
    static scope() { return this; }
  }

  const mockSequelize = {
    query: jest.fn(),
    define: jest.fn((modelName, attributes, options) => {
      // Return a mock Model class
      const ModelClass = class extends MockModel {
        constructor(data = {}) {
          super(data);
          this.name = modelName;
        }
      };
      // Pre-init the model with attributes
      ModelClass.init(attributes, options);
      return ModelClass;
    }),
    literal: jest.fn((val) => ({ val, _isSequelizeLiteral: true })),
    Op: {
      ne: Symbol('ne'),
      gte: Symbol('gte'),
      lte: Symbol('lte'),
      or: Symbol('or'),
      iLike: Symbol('iLike'),
      gt: Symbol('gt'),
      between: Symbol('between'),
      lt: Symbol('lt'),
    },
    QueryTypes: OriginalQueryTypes,
  };

  return {
    Sequelize: jest.fn(() => mockSequelize),
    Model: MockModel,
    DataTypes: {
      UUID: 'UUID',
      UUIDV4: 'UUIDV4',
      STRING: (length) => `STRING(${length})`,
      TEXT: 'TEXT',
      INTEGER: 'INTEGER',
      DECIMAL: (precision, scale) => `DECIMAL(${precision},${scale})`,
      DATE: 'DATE',
      ENUM: (...values) => `ENUM(${values.join(',')})`,
      BOOLEAN: 'BOOLEAN',
      NOW: 'NOW',
      GEOMETRY: (type, srid) => `GEOMETRY(${type}, ${srid})`,
      POINT: 'POINT',
    },
    Op: mockSequelize.Op,
    QueryTypes: OriginalQueryTypes,
  };
});

// Mock database queries
const { QueryTypes } = require('sequelize');
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