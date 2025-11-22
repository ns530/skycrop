'use strict';

const request = require('supertest');

// Mock auth middleware - must be before app import
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { userId: 'user-1' };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  requireAnyRole: () => (_req, _res, next) => next(),
}));

// Mock rate limiter
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (_req, _res, next) => next(),
  authLimiter: (_req, _res, next) => next(),
}));

// Create mock service instance
const mockYieldService = {
  predictYield: jest.fn(),
  getPredictions: jest.fn(),
  create: jest.fn(),
  listByField: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStatistics: jest.fn(),
};

// Mock yield service
jest.mock('../../src/services/yield.service', () => ({
  getYieldService: jest.fn(() => mockYieldService),
}));

// Mock models
jest.mock('../../src/models/field.model', () => ({
  findOne: jest.fn(),
  findByPk: jest.fn(),
}));
jest.mock('../../src/models/actualYield.model', () => ({}));
jest.mock('../../src/models/yield_prediction.model', () => ({}));

const app = require('../../src/app');

describe('Yield Prediction API Integration Tests', () => {
  const mockUserId = 'user-1';
  const mockFieldId = 'test-field-1';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/fields/:fieldId/yield/predict', () => {
    it('should generate yield prediction successfully', async () => {
      mockYieldService.predictYield.mockResolvedValue({
        prediction_id: 'pred-1',
        field_id: mockFieldId,
        field_name: 'Test Field',
        field_area_ha: 2.5,
        prediction_date: '2024-01-15',
        predicted_yield_per_ha: 4800,
        predicted_total_yield: 12000,
        confidence_interval: {
          lower: 4200,
          upper: 5400,
        },
        expected_revenue: 960000,
        harvest_date_estimate: '2024-05-15',
        model_version: '1.0.0',
        features_used: {
          ndvi_avg: 0.65,
          rainfall_mm: 120,
          temp_avg: 28,
        },
        ml_response: 'fresh',
      });

      const response = await request(app)
        .post(`/api/v1/fields/${mockFieldId}/yield/predict`)
        .send({
          planting_date: '2024-01-15',
          crop_variety: 'BG 300',
          price_per_kg: 80,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prediction_id).toBe('pred-1');
      expect(response.body.data.predicted_yield_per_ha).toBe(4800);
      expect(response.body.data.confidence_interval).toEqual({
        lower: 4200,
        upper: 5400,
      });
      expect(mockYieldService.predictYield).toHaveBeenCalledWith(
        mockUserId,
        mockFieldId,
        {
          planting_date: '2024-01-15',
          crop_variety: 'BG 300',
          price_per_kg: 80,
        }
      );
    });

    it('should handle field not found error', async () => {
      const error = new Error('Field not found or does not belong to user');
      error.statusCode = 404;
      mockYieldService.predictYield.mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/v1/fields/non-existent/yield/predict`)
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post(`/api/v1/fields/${mockFieldId}/yield/predict`)
        .send({
          planting_date: 'invalid-date',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should work without optional parameters', async () => {
      mockYieldService.predictYield.mockResolvedValue({
        prediction_id: 'pred-1',
        field_id: mockFieldId,
        field_name: 'Test Field',
        predicted_yield_per_ha: 4500,
        predicted_total_yield: 11250,
        confidence_interval: { lower: 4000, upper: 5000 },
        expected_revenue: 900000,
        harvest_date_estimate: '2024-05-15',
        model_version: '1.0.0',
        features_used: {},
        ml_response: 'fresh',
      });

      const response = await request(app)
        .post(`/api/v1/fields/${mockFieldId}/yield/predict`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prediction_id).toBe('pred-1');
    });

    it('should handle ML service errors gracefully', async () => {
      const error = new Error('ML service unavailable');
      error.statusCode = 502;
      mockYieldService.predictYield.mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/v1/fields/${mockFieldId}/yield/predict`)
        .send({})
        .expect(502);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/fields/:fieldId/yield/predictions', () => {
    it('should retrieve predictions successfully', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [
          {
            prediction_id: 'pred-1',
            field_id: mockFieldId,
            prediction_date: '2024-01-15',
            predicted_yield_per_ha: 4800,
            predicted_total_yield: 12000,
            confidence_interval: { lower: 4200, upper: 5400 },
            expected_revenue: 960000,
            harvest_date_estimate: '2024-05-15',
            model_version: '1.0.0',
            actual_yield: null,
            accuracy_mape: null,
            created_at: new Date(),
          },
          {
            prediction_id: 'pred-2',
            field_id: mockFieldId,
            prediction_date: '2024-01-10',
            predicted_yield_per_ha: 4600,
            predicted_total_yield: 11500,
            confidence_interval: { lower: 4100, upper: 5100 },
            expected_revenue: 920000,
            harvest_date_estimate: '2024-05-10',
            model_version: '1.0.0',
            actual_yield: null,
            accuracy_mape: null,
            created_at: new Date(),
          },
        ],
        cacheHit: false,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockFieldId}/yield/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].prediction_id).toBe('pred-1');
      expect(response.body.meta.count).toBe(2);
      expect(response.body.meta.cache_hit).toBe(false);
    });

    it('should return empty array when no predictions exist', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [],
        cacheHit: false,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockFieldId}/yield/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.meta.count).toBe(0);
    });

    it('should handle field not found error', async () => {
      const error = new Error('Field not found or does not belong to user');
      error.statusCode = 404;
      mockYieldService.getPredictions.mockRejectedValue(error);

      const response = await request(app)
        .get(`/api/v1/fields/non-existent/yield/predictions`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should respect query parameters', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [],
        cacheHit: false,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockFieldId}/yield/predictions`)
        .query({ limit: 5, sort: 'predicted_yield_per_ha', order: 'asc' })
        .expect(200);

      expect(mockYieldService.getPredictions).toHaveBeenCalledWith(
        mockUserId,
        mockFieldId,
        {
          limit: '5',
          sort: 'predicted_yield_per_ha',
          order: 'asc',
        }
      );
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/fields/${mockFieldId}/yield/predictions`)
        .query({ limit: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should enforce max limit of 100', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [],
        cacheHit: false,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockFieldId}/yield/predictions`)
        .query({ limit: 200 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return cached results when available', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [
          {
            prediction_id: 'pred-1',
            field_id: mockFieldId,
            prediction_date: '2024-01-15',
            predicted_yield_per_ha: 4800,
            predicted_total_yield: 12000,
            confidence_interval: { lower: 4200, upper: 5400 },
            expected_revenue: 960000,
            harvest_date_estimate: '2024-05-15',
            model_version: '1.0.0',
            actual_yield: null,
            accuracy_mape: null,
            created_at: new Date(),
          },
        ],
        cacheHit: true,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockFieldId}/yield/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.cache_hit).toBe(true);
    });
  });
});

