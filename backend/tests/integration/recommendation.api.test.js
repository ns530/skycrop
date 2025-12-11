const request = require('supertest');

// Create mock instances that we can control
const mockRecommendationEngineService = {
  generateRecommendations: jest.fn(),
};

const mockRecommendationRepository = {
  findByfield_id: jest.fn(),
  findByuser_id: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  getStatistics: jest.fn(),
};

const mockFieldModel = {
  findByPk: jest.fn(),
};

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

// Mock the service and repository classes
jest.mock('../../src/services/recommendationEngine.service', () => {
  return jest.fn().mockImplementation(() => mockRecommendationEngineService);
});

jest.mock('../../src/repositories/recommendation.repository', () => {
  return jest.fn().mockImplementation(() => mockRecommendationRepository);
});

jest.mock('../../src/models/field.model', () => mockFieldModel);
jest.mock('../../src/models/recommendation.model', () => ({}));
jest.mock('../../src/services/healthMonitoring.service', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../src/services/notification.service', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../src/repositories/health.repository', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../src/repositories/field.repository', () => {
  return jest.fn().mockImplementation(() => ({}));
});

const app = require('../../src/app');

describe('Recommendation API Integration Tests', () => {
  const mockuser_id = 'user-1';
  const mockOtheruser_id = 'user-2';
  const mockfield_id = 'test-field-1';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWTSECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default field model mock
    mockFieldModel.findByPk.mockImplementation(async id => {
      if (id === mockfield_id) {
        return { field_id: mockfield_id, user_id: mockuser_id, name: 'Test Field' };
      }
      if (id === 'other-user-field') {
        return { field_id: 'other-user-field', user_id: mockOtheruser_id, name: 'Other Field' };
      }
      return null;
    });
  });

  describe('POST /api/v1/fields/:field_id/recommendations/generate', () => {
    it('should generate recommendations successfully', async () => {
      mockRecommendationEngineService.generateRecommendations.mockResolvedValue({
        field_id: mockfield_id,
        fieldName: 'Test Field',
        generatedAt: new Date().toISOString(),
        healthSummary: {
          currentScore: 60,
          status: 'fair',
          trend: 'stable',
        },
        recommendations: [
          {
            recommendationId: 'rec-1',
            type: 'irrigation',
            priority: 'high',
            urgency: 80,
            title: 'Schedule irrigation soon',
            description: 'NDWI indicates water stress',
            actionSteps: ['Schedule irrigation within 2-3 days'],
            estimatedCost: 1200,
          },
        ],
        totalCount: 1,
        criticalCount: 0,
        highCount: 1,
      });

      const response = await request(app)
        .post(`/api/v1/fields/${mockfield_id}/recommendations/generate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.field_id).toBe(mockfield_id);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent field', async () => {
      const error = new Error('Field not found');
      error.statusCode = 404;
      mockRecommendationEngineService.generateRecommendations.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/fields/non-existent/recommendations/generate')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized field access', async () => {
      const error = new Error('Unauthorized access to field');
      error.statusCode = 403;
      mockRecommendationEngineService.generateRecommendations.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/fields/other-user-field/recommendations/generate')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/fields/:field_id/recommendations', () => {
    it('should retrieve field recommendations successfully', async () => {
      mockRecommendationRepository.findByfield_id.mockResolvedValue([
        {
          recommendationid: 'rec-1',
          field_id: mockfield_id,
          user_id: mockuser_id,
          type: 'fertilizer',
          priority: 'high',
          urgencyscore: 85,
          title: 'Apply nitrogen fertilizer',
          description: 'NDVI is low and declining',
          actionsteps: JSON.stringify(['Purchase urea fertilizer']),
          estimatedcost: 2500,
          status: 'pending',
          generatedat: new Date(),
        },
      ]);

      mockRecommendationRepository.getStatistics.mockResolvedValue({
        total: 1,
        pending: 1,
        inProgress: 0,
        completed: 0,
        dismissed: 0,
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockfield_id}/recommendations`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      expect(response.body.data.statistics).toBeDefined();
    });

    it('should filter recommendations by status', async () => {
      mockRecommendationRepository.findByfield_id.mockResolvedValue([]);
      mockRecommendationRepository.getStatistics.mockResolvedValue({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        dismissed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });

      const response = await request(app)
        .get(`/api/v1/fields/${mockfield_id}/recommendations?status=completed`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent field', async () => {
      const response = await request(app)
        .get('/api/v1/fields/non-existent/recommendations')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized field access', async () => {
      const response = await request(app)
        .get('/api/v1/fields/other-user-field/recommendations')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/recommendations', () => {
    it('should retrieve all user recommendations successfully', async () => {
      mockRecommendationRepository.findByuser_id.mockResolvedValue([
        {
          recommendationid: 'rec-1',
          field_id: mockfield_id,
          user_id: mockuser_id,
          type: 'irrigation',
          priority: 'critical',
          urgencyscore: 95,
          title: 'Immediate irrigation required',
          description: 'NDWI is critically low',
          actionsteps: JSON.stringify(['Irrigate immediately']),
          estimatedcost: 1500,
          status: 'pending',
          generatedat: new Date(),
        },
        {
          recommendationid: 'rec-2',
          field_id: mockfield_id,
          user_id: mockuser_id,
          type: 'fertilizer',
          priority: 'high',
          urgencyscore: 85,
          title: 'Apply nitrogen fertilizer',
          description: 'NDVI is low',
          actionsteps: JSON.stringify(['Purchase urea']),
          estimatedcost: 2500,
          status: 'pending',
          generatedat: new Date(),
        },
      ]);

      const response = await request(app).get('/api/v1/recommendations').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
      expect(response.body.meta.count).toBe(2);
    });

    it('should filter user recommendations by priority', async () => {
      mockRecommendationRepository.findByuser_id.mockResolvedValue([
        {
          recommendationid: 'rec-1',
          field_id: mockfield_id,
          user_id: mockuser_id,
          type: 'irrigation',
          priority: 'critical',
          urgencyscore: 95,
          title: 'Immediate irrigation required',
          description: 'NDWI is critically low',
          actionsteps: JSON.stringify(['Irrigate immediately']),
          estimatedcost: 1500,
          status: 'pending',
          generatedat: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/v1/recommendations?priority=critical')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toBeInstanceOf(Array);
    });

    it('should return only valid recommendations when validOnly=true', async () => {
      mockRecommendationRepository.findByuser_id.mockResolvedValue([
        {
          recommendationid: 'rec-1',
          field_id: mockfield_id,
          user_id: mockuser_id,
          type: 'irrigation',
          priority: 'critical',
          urgencyscore: 95,
          title: 'Immediate irrigation required',
          description: 'NDWI is critically low',
          actionsteps: JSON.stringify(['Irrigate immediately']),
          estimatedcost: 1500,
          status: 'pending',
          validuntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          generatedat: new Date(),
        },
      ]);

      const response = await request(app).get('/api/v1/recommendations?validOnly=true').expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/recommendations/:recommendationId/status', () => {
    it('should update recommendation status successfully', async () => {
      mockRecommendationRepository.findById.mockResolvedValue({
        recommendationid: 'rec-1',
        user_id: mockuser_id,
        status: 'pending',
      });

      mockRecommendationRepository.updateStatus.mockResolvedValue({
        recommendationid: 'rec-1',
        field_id: mockfield_id,
        user_id: mockuser_id,
        type: 'fertilizer',
        priority: 'high',
        urgencyscore: 85,
        title: 'Apply nitrogen fertilizer',
        description: 'NDVI is low',
        actionsteps: JSON.stringify(['Purchase urea']),
        estimatedcost: 2500,
        status: 'inprogress',
        actionedat: new Date(),
        generatedat: new Date(),
      });

      const response = await request(app)
        .patch('/api/v1/recommendations/rec-1/status')
        .send({ status: 'inprogress', notes: 'Started fertilizer application' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('inprogress');
    });

    it('should return 400 for missing status', async () => {
      const response = await request(app)
        .patch('/api/v1/recommendations/rec-1/status')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid status', async () => {
      mockRecommendationRepository.findById.mockResolvedValue({
        recommendationid: 'rec-1',
        user_id: mockuser_id,
      });

      const response = await request(app)
        .patch('/api/v1/recommendations/rec-1/status')
        .send({ status: 'invalidstatus' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent recommendation', async () => {
      mockRecommendationRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/v1/recommendations/non-existent/status')
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized recommendation access', async () => {
      mockRecommendationRepository.findById.mockResolvedValue({
        recommendationid: 'rec-1',
        user_id: mockOtheruser_id,
      });

      const response = await request(app)
        .patch('/api/v1/recommendations/rec-1/status')
        .send({ status: 'completed' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/recommendations/:recommendationId', () => {
    it('should delete recommendation successfully', async () => {
      mockRecommendationRepository.findById.mockResolvedValue({
        recommendationid: 'rec-1',
        user_id: mockuser_id,
      });

      mockRecommendationRepository.delete.mockResolvedValue(true);

      const response = await request(app).delete('/api/v1/recommendations/rec-1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent recommendation', async () => {
      mockRecommendationRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/recommendations/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized recommendation access', async () => {
      mockRecommendationRepository.findById.mockResolvedValue({
        recommendationid: 'rec-1',
        user_id: mockOtheruser_id,
      });

      const response = await request(app).delete('/api/v1/recommendations/rec-1').expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
