/* eslint-disable max-classes-per-file */
const request = require('supertest');

// Mock rate limiter to no-op for tests
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
}));

// Mock auth middleware to inject a test user
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { user_id: 'test-user-123' };
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
  async setex(key, ttl, value) {
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
          { date: '2025-12-12', rain_mm: 0, tmin: 22, tmax: 32, wind: 5 },
        ],
        totals: { rain_3d_mm: 3, rain_7d_mm: 6 },
      },
    }),
  })),
}));

// Mock ML Gateway service
jest.mock('../../src/services/mlGateway.service', () => ({
  getMLGatewayService: jest.fn(() => ({
    getDisasterAssessment: jest.fn().mockResolvedValue({
      risklevel: 'low',
      disastertypes: ['flood'],
      confidence: 0.85,
      assessedat: new Date().toISOString(),
    }),
  })),
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
      this.attributes = attributes;
      this.options = options;
      return this;
    }

    static findOne() {
      return Promise.resolve(null);
    }

    static findAll() {
      return Promise.resolve([]);
    }

    static create(data) {
      return Promise.resolve(new this(data));
    }

    static update() {
      return Promise.resolve([0]);
    }

    static destroy() {
      return Promise.resolve(0);
    }

    static hasMany() {
      return this;
    }

    static belongsTo() {
      return this;
    }

    static scope() {
      return this;
    }
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
    literal: jest.fn(val => ({ val, isSequelizeLiteral: true })),
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
      STRING: length => `STRING(${length})`,
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
const { QueryTypes: _QueryTypes } = require('sequelize');
const { sequelize } = require('../../src/config/database.config');

process.env.NODE_ENV = 'test';
process.env.JWTSECRET = 'test-secret';
process.env.DASHBOARDCACHETTLSEC = '300';

// Mock app.js to avoid ES module import issues
jest.mock('../../src/app', () => {
  // eslint-disable-next-line global-require
  const express = require('express');
  const app = express();
  app.use(express.json());

  try {
    // eslint-disable-next-line global-require
    const dashboardRoutes = require('../../src/api/routes/dashboard.routes');
    app.use('/api/v1/dashboard', dashboardRoutes);
  } catch (e) {
    console.error('Failed to load routes in dashboard test mock:', e.message);
  }

  return {
    __esModule: true,
    default: app,
  };
});

// eslint-disable-next-line global-require
const app = require('../../src/app').default || require('../../src/app');

describe('GET /api/v1/dashboard/metrics', () => {
  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  it('returns dashboard metrics with cache miss then hit', async () => {
    // Mock database queries
    sequelize.query
      .mockResolvedValueOnce([
        { totalfields: 5, activefields: 4, totalareasqm: 250000, avgfieldsizesqm: 62500 },
      ]) // field metrics
      .mockResolvedValueOnce([
        // health metrics
        {
          healthscore: 75,
          healthstatus: 'good',
          ndvimean: 0.65,
          ndwimean: 0.25,
          measurementdate: '2025-11-15T10:00:00Z',
          field_id: 'field-1',
          fieldname: 'Field 1',
        },
        {
          healthscore: 82,
          healthstatus: 'excellent',
          ndvimean: 0.72,
          ndwimean: 0.3,
          measurementdate: '2025-11-15T10:00:00Z',
          field_id: 'field-2',
          fieldname: 'Field 2',
        },
        {
          healthscore: 68,
          healthstatus: 'fair',
          ndvimean: 0.58,
          ndwimean: 0.2,
          measurementdate: '2025-11-15T10:00:00Z',
          field_id: 'field-3',
          fieldname: 'Field 3',
        },
        {
          healthscore: 45,
          healthstatus: 'poor',
          ndvimean: 0.35,
          ndwimean: 0.1,
          measurementdate: '2025-11-15T10:00:00Z',
          field_id: 'field-4',
          fieldname: 'Field 4',
        },
      ])
      .mockResolvedValueOnce([
        {
          totalalerts: 3,
          highseverity: 1,
          mediumseverity: 2,
          lowseverity: 0,
          wateralerts: 2,
          fertilizeralerts: 1,
        },
      ]) // alert metrics
      .mockResolvedValueOnce([
        // recent health activity
        {
          activitytype: 'healthassessment',
          activitydate: '2025-11-18T08:00:00Z',
          fieldname: 'Field 1',
          healthstatus: 'good',
          healthscore: 75,
        },
        {
          activitytype: 'healthassessment',
          activitydate: '2025-11-17T14:00:00Z',
          fieldname: 'Field 2',
          healthstatus: 'excellent',
          healthscore: 82,
        },
      ])
      .mockResolvedValueOnce([
        // recent recommendation activity
        {
          activitytype: 'recommendation',
          activitydate: '2025-11-16T10:00:00Z',
          fieldname: 'Field 3',
          type: 'water',
          severity: 'high',
        },
      ])
      .mockResolvedValueOnce([
        // field thumbnails
        {
          field_id: 'field-1',
          name: 'Field 1',
          center: { type: 'Point', coordinates: [80.1, 7.2] },
          areasqm: 100000,
        },
        {
          field_id: 'field-2',
          name: 'Field 2',
          center: { type: 'Point', coordinates: [80.2, 7.3] },
          areasqm: 75000,
        },
        {
          field_id: 'field-3',
          name: 'Field 3',
          center: { type: 'Point', coordinates: [80.3, 7.4] },
          areasqm: 50000,
        },
        {
          field_id: 'field-4',
          name: 'Field 4',
          center: { type: 'Point', coordinates: [80.4, 7.5] },
          areasqm: 25000,
        },
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
    expect(res1.body.data).toHaveProperty('recentactivity');
    expect(res1.body.data).toHaveProperty('fieldthumbnails');
    expect(res1.body.meta).toMatchObject({ cachehit: false, correlationid: 'dashboard-req-1' });

    // Verify field metrics
    expect(res1.body.data.fields).toEqual({
      total: 5,
      active: 4,
      totalareahectares: 25,
      averagesizehectares: 6.25,
    });

    // Verify health metrics
    expect(res1.body.data.health.averagescore).toBe(68); // (75+82+68+45)/4
    expect(res1.body.data.health.statusdistribution).toEqual({ good: 2, moderate: 1, poor: 1 });
    expect(res1.body.data.health.totalassessed).toBe(4);

    // Verify alert metrics
    expect(res1.body.data.alerts.total).toBe(3);
    expect(res1.body.data.alerts.byseverity).toEqual({ high: 1, medium: 2, low: 0 });
    expect(res1.body.data.alerts.bytype).toEqual({ water: 2, fertilizer: 1 });

    // Verify recent activity
    expect(res1.body.data.recentactivity).toHaveLength(3);
    expect(res1.body.data.recentactivity[0].type).toBe('healthassessment');
    expect(res1.body.data.recentactivity[0].fieldname).toBe('Field 1');

    // Verify field thumbnails
    expect(res1.body.data.fieldthumbnails).toHaveLength(4);
    expect(res1.body.data.fieldthumbnails[0]).toMatchObject({
      field_id: 'field-1',
      fieldname: 'Field 1',
      thumbnailurl: expect.stringContaining('/api/v1/satellite/tiles/'),
      areahectares: 10,
    });

    // Second request should hit cache
    const res2 = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'dashboard-req-2')
      .expect(200);

    expect(res2.body.meta).toMatchObject({ cachehit: true, correlationid: 'dashboard-req-2' });
    // Database should not be queried again
    expect(sequelize.query).toHaveBeenCalledTimes(6); // Only called once for the first request
  });

  it('handles empty results gracefully', async () => {
    // Mock empty results
    sequelize.query
      .mockResolvedValueOnce([
        { totalfields: 0, activefields: 0, totalareasqm: null, avgfieldsizesqm: null },
      ])
      .mockResolvedValueOnce([]) // no health records
      .mockResolvedValueOnce([
        {
          totalalerts: 0,
          highseverity: 0,
          mediumseverity: 0,
          lowseverity: 0,
          wateralerts: 0,
          fertilizeralerts: 0,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.fields.total).toBe(0);
    expect(res.body.data.health.averagescore).toBe(50); // default
    expect(res.body.data.health.totalassessed).toBe(0);
    expect(res.body.data.alerts.total).toBe(0);
    expect(res.body.data.recentactivity).toEqual([]);
    expect(res.body.data.fieldthumbnails).toEqual([]);
  });

  it('propagates X-Request-Id into meta.correlationid', async () => {
    sequelize.query
      .mockResolvedValueOnce([
        { totalfields: 1, activefields: 1, totalareasqm: 10000, avgfieldsizesqm: 10000 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          totalalerts: 0,
          highseverity: 0,
          mediumseverity: 0,
          lowseverity: 0,
          wateralerts: 0,
          fertilizeralerts: 0,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', 'Bearer token')
      .set('X-Request-Id', 'dashboard-corr-xyz')
      .expect(200);

    expect(res.body.meta.correlationid).toBe('dashboard-corr-xyz');
  });
});
