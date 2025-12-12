/* eslint-disable camelcase */
const request = require('supertest');

// Mock rate limiter to no-op for tests
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
}));

// Mock auth middleware to pass authentication
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = {
      user_id: 'test-user-123',
      email: 'test@example.com',
      role: 'farmer',
    };
    next();
  },
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
  async del(keys) {
    if (Array.isArray(keys)) {
      let count = 0;
      keys.forEach(k => {
        if (redisStore.delete(k)) count += 1;
      });
      return count;
    }
    return redisStore.delete(keys) ? 1 : 0;
  },
};
// Mock Redis config to use in-memory client
jest.mock('../../src/config/redis.config', () => ({
  initRedis: async () => fakeRedisClient,
  getRedisClient: () => fakeRedisClient,
}));

process.env.NODE_ENV = 'test';
process.env.JWTSECRET = 'test-secret';

const app = require('../../src/app');
const { sequelize: _sequelize } = require('../../src/config/database.config');
const HealthRecord = require('../../src/models/health.model');
const Field = require('../../src/models/field.model');

describe('Health Monitoring API Integration Tests', () => {
  const field_id = 'field-123';
  const user_id = 'test-user-123';
  let findAllSpy;
  let findByPkSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();

    // Set up spies for model methods
    findByPkSpy = jest.spyOn(Field, 'findByPk');
    findAllSpy = jest.spyOn(HealthRecord, 'findAll');
  });

  afterEach(() => {
    if (findByPkSpy) findByPkSpy.mockRestore();
    if (findAllSpy) findAllSpy.mockRestore();
  });

  describe('GET /api/v1/fields/:field_id/health/history', () => {
    it('should return 200 with health analysis for valid field and period', async () => {
      // Mock field exists and belongs to user
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      // Mock health records
      const mockRecords = [];
      for (let i = 0; i < 30; i += 1) {
        const date = new Date();
        date.setDate(date.getDate() - (30 - i));
        mockRecords.push({
          recordid: `rec-${i}`,
          field_id,
          measurementdate: date.toISOString().split('T')[0],
          ndvimean: 0.6 + i * 0.001,
          ndvimin: 0.55,
          ndvimax: 0.65,
          ndvistd: 0.02,
          ndwimean: 0.3,
          ndwimin: 0.25,
          ndwimax: 0.35,
          ndwistd: 0.02,
          tdvimean: 0.7,
          healthstatus: 'good',
          healthscore: 70,
          trend: 'improving',
          satelliteimageid: `img-${i}`,
          cloudcover: 10,
        });
      }

      findAllSpy.mockResolvedValue(mockRecords);

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({ period: '30d' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.field_id).toBe(field_id);
      expect(response.body.data.recordCount).toBe(30);
      expect(response.body.data.currentHealth).toBeDefined();
      expect(response.body.data.trend).toBeDefined();
      expect(response.body.data.timeSeries).toHaveLength(30);
    });

    it('should return 200 with custom date range', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      findAllSpy.mockResolvedValue([
        {
          recordid: 'rec-1',
          field_id,
          measurementdate: '2025-01-15',
          ndvimean: 0.65,
          ndvimin: 0.6,
          ndvimax: 0.7,
          ndvistd: 0.02,
          ndwimean: 0.3,
          ndwimin: 0.25,
          ndwimax: 0.35,
          ndwistd: 0.02,
          tdvimean: 0.7,
          healthstatus: 'good',
          healthscore: 75,
          trend: 'stable',
          satelliteimageid: 'img-1',
          cloudcover: 5,
        },
      ]);

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when field does not exist', async () => {
      findByPkSpy.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({ period: '30d' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FIELDNOTFOUND');
    });

    it('should return 403 when user does not own field', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id: 'different-user-456',
        name: 'Other User Field',
      });

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({ period: '30d' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 when neither period nor date range provided', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSINGPARAMETERS');
    });

    it('should return 400 for invalid period format', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({ period: '45d' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALIDPERIOD');
    });

    it('should return 400 for invalid date format', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({
          startDate: 'invalid-date',
          endDate: '2025-01-31',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 200 with nodata status when field has no health records', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      findAllSpy.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({ period: '30d' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.recordCount).toBe(0);
      expect(response.body.data.status).toBe('nodata');
      expect(response.body.data.currentHealth).toBeNull();
    });

    it('should include correlation ID in response metadata', async () => {
      findByPkSpy.mockResolvedValue({
        field_id,
        user_id,
        name: 'Test Field',
      });

      findAllSpy.mockResolvedValue([]);

      const correlationId = 'test-correlation-123';

      const response = await request(app)
        .get(`/api/v1/fields/${field_id}/health/history`)
        .query({ period: '7d' })
        .set('Authorization', 'Bearer valid-token')
        .set('X-Request-Id', correlationId);

      expect(response.status).toBe(200);
      expect(response.body.meta.correlationId).toBe(correlationId);
    });
  });
});
