const request = require('supertest');

// Mock auth middleware - must be before app import
jest.mock('../../src/api/middleware/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { user_id: 'user-1' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
  requireAnyRole: () => (req, res, next) => next(),
}));

// Mock rate limiter
jest.mock('../../src/api/middleware/rateLimit.middleware', () => ({
  apiLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next(),
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
jest.mock('../../src/models/yieldprediction.model', () => ({}));

const app = require('../../src/app');

describe('Yield Prediction API Integration Tests', () => {
  const mockuser_id = 'user-1';
  const mockfield_id = 'test-field-1';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWTSECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/fields/:field_id/yield/predict', () => {
    it('should generate yield prediction successfully', async () => {
      mockYieldService.predictYield.mockResolvedValue({
        predictionid: 'pred-1',
        field_id: mockfield_id,
        fieldname: 'Test Field',
        fieldareaha: 2.5,
        predictiondate: '2024-01-15',
        predictedyieldperha: 4800,
        predictedtotalyield: 12000,
        confidenceinterval: {
          lower: 4200,
          upper: 5400,
        },
        expectedrevenue: 960000,
        harvestdateestimate: '2024-05-15',
        modelversion: '1.0.0',
        featuresused: {
          ndviavg: 0.65,
          rainfallmm: 120,
          tempavg: 28,
        },
        mlresponse: 'fresh',
      });

      const response = await request(app)
        .post(`/api/v1/fields/${mockfield_id}/yield/predict`)
        .send({
          plantingdate: '2024-01-15',
          cropvariety: 'BG 300',
          priceperkg: 80,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictionid).toBe('pred-1');
      expect(response.body.data.predictedyieldperha).toBe(4800);
      expect(response.body.data.confidenceinterval).toEqual({
        lower: 4200,
        upper: 5400,
      });
      expect(mockYieldService.predictYield).toHaveBeenCalledWith(mockuser_id, mockfield_id, {
        plantingdate: '2024-01-15',
        cropvariety: 'BG 300',
        priceperkg: 80,
      });
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
        .post(`/api/v1/fields/${mockfield_id}/yield/predict`)
        .send({
          plantingdate: 'invalid-date',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should work without optional parameters', async () => {
      mockYieldService.predictYield.mockResolvedValue({
        predictionid: 'pred-1',
        field_id: mockfield_id,
        fieldname: 'Test Field',
        predictedyieldperha: 4500,
        predictedtotalyield: 11250,
        confidenceinterval: { lower: 4000, upper: 5000 },
        expectedrevenue: 900000,
        harvestdateestimate: '2024-05-15',
        modelversion: '1.0.0',
        featuresused: {},
        mlresponse: 'fresh',
      });

      const response = await request(app)
        .post(`/api/v1/fields/${mockfield_id}/yield/predict`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictionid).toBe('pred-1');
    });

    it('should handle ML service errors gracefully', async () => {
      const error = new Error('ML service unavailable');
      error.statusCode = 502;
      mockYieldService.predictYield.mockRejectedValue(error);

      const response = await request(app)
        .post(`/api/v1/fields/${mockfield_id}/yield/predict`)
        .send({})
        .expect(502);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/fields/:field_id/yield/predictions', () => {
    it('should retrieve predictions successfully', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [
          {
            predictionid: 'pred-1',
            field_id: mockfield_id,
            predictiondate: '2024-01-15',
            predictedyieldperha: 4800,
            predictedtotalyield: 12000,
            confidenceinterval: { lower: 4200, upper: 5400 },
            expectedrevenue: 960000,
            harvestdateestimate: '2024-05-15',
            modelversion: '1.0.0',
            actualyield: null,
            accuracymape: null,
            createdat: new Date(),
          },
          {
            predictionid: 'pred-2',
            field_id: mockfield_id,
            predictiondate: '2024-01-10',
            predictedyieldperha: 4600,
            predictedtotalyield: 11500,
            confidenceinterval: { lower: 4100, upper: 5100 },
            expectedrevenue: 920000,
            harvestdateestimate: '2024-05-10',
            modelversion: '1.0.0',
            actualyield: null,
            accuracymape: null,
            createdat: new Date(),
          },
        ],
        cacheHit: false,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockfield_id}/yield/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].predictionid).toBe('pred-1');
      expect(response.body.meta.count).toBe(2);
      expect(response.body.meta.cachehit).toBe(false);
    });

    it('should return empty array when no predictions exist', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [],
        cacheHit: false,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockfield_id}/yield/predictions`)
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
        .get(`/api/v1/fields/${mockfield_id}/yield/predictions`)
        .query({ limit: 5, sort: 'predictedyieldperha', order: 'asc' })
        .expect(200);

      expect(mockYieldService.getPredictions).toHaveBeenCalledWith(mockuser_id, mockfield_id, {
        limit: '5',
        sort: 'predictedyieldperha',
        order: 'asc',
      });
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/fields/${mockfield_id}/yield/predictions`)
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
        .get(`/api/v1/fields/${mockfield_id}/yield/predictions`)
        .query({ limit: 200 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return cached results when available', async () => {
      mockYieldService.getPredictions.mockResolvedValue({
        predictions: [
          {
            predictionid: 'pred-1',
            field_id: mockfield_id,
            predictiondate: '2024-01-15',
            predictedyieldperha: 4800,
            predictedtotalyield: 12000,
            confidenceinterval: { lower: 4200, upper: 5400 },
            expectedrevenue: 960000,
            harvestdateestimate: '2024-05-15',
            modelversion: '1.0.0',
            actualyield: null,
            accuracymape: null,
            createdat: new Date(),
          },
        ],
        cacheHit: true,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockfield_id}/yield/predictions`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.meta.cachehit).toBe(true);
    });
  });
});
