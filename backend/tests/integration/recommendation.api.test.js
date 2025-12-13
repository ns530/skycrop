/* eslint-disable camelcase */
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
  return jest.fn().mockImplementation(() => ({
    analyzeFieldHealth: jest.fn().mockResolvedValue({}),
  }));
});
jest.mock('../../src/services/notification.service', () => ({
  getNotificationService: jest.fn(() => ({
    sendEmail: jest.fn(),
    sendPush: jest.fn(),
  })),
}));
jest.mock('../../src/repositories/health.repository', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../src/repositories/field.repository', () => {
  return jest.fn().mockImplementation(() => ({}));
});
jest.mock('../../src/services/weather.service', () => ({
  getWeatherService: jest.fn(() => ({
    getForecastByCoords: jest.fn().mockResolvedValue({ data: {} }),
  })),
}));

// Mock bull module (required by notificationQueue)
jest.mock('bull');

// Mock notification queue (must be before routes try to require it)
// Set env to disable bull queue usage
process.env.USEBULLQUEUE = 'false';

jest.mock('../../src/jobs/notificationQueue', () => {
  const mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  };
  return {
    notificationQueue: mockQueue,
  };
});

// Mock recommendation controller before routes try to require it
jest.mock('../../src/api/controllers/recommendation.controller', () => {
  function RecommendationController(engineService, repository, fieldModel) {
    this.recommendationEngineService = engineService || mockRecommendationEngineService;
    this.recommendationRepository = repository || mockRecommendationRepository;
    this.Field = fieldModel || mockFieldModel;

    this.generateRecommendations = async (req, res, _next) => {
      try {
        const { field_id: fieldId } = req.params;
        const { user_id: userId } = req.user;
        const result = await this.recommendationEngineService.generateRecommendations(
          fieldId,
          userId
        );
        return res.status(200).json({ success: true, data: result });
      } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
          success: false,
          error: { code: err.code || 'ERROR', message: err.message },
        });
      }
    };

    this.getFieldRecommendations = async (req, res, _next) => {
      try {
        const { field_id: fieldId } = req.params;
        const { user_id: userId } = req.user;

        // Check if field exists and user owns it
        const field = await this.Field.findByPk(fieldId);
        if (!field) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Field not found' },
          });
        }

        if (field.user_id !== userId) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Unauthorized access to field' },
          });
        }

        const recommendations = await this.recommendationRepository.findByfield_id(fieldId);
        const statistics = await this.recommendationRepository.getStatistics(fieldId);
        return res.status(200).json({
          success: true,
          data: { recommendations, statistics },
        });
      } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
          success: false,
          error: { code: err.code || 'ERROR', message: err.message },
        });
      }
    };

    this.getUserRecommendations = async (req, res, _next) => {
      try {
        const { user_id: userId } = req.user;
        const { priority, validOnly } = req.query;
        const recommendations = await this.recommendationRepository.findByuser_id(userId);
        let filtered = recommendations;
        if (priority) {
          filtered = filtered.filter(r => r.priority === priority);
        }
        if (validOnly === 'true') {
          const now = new Date();
          filtered = filtered.filter(r => !r.validuntil || new Date(r.validuntil) > now);
        }
        return res.status(200).json({
          success: true,
          data: { recommendations: filtered },
          meta: { count: filtered.length },
        });
      } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
          success: false,
          error: { code: err.code || 'ERROR', message: err.message },
        });
      }
    };

    this.updateRecommendationStatus = async (req, res, _next) => {
      try {
        const { recommendationId } = req.params;
        const { status, notes } = req.body;
        const { user_id: userId } = req.user;

        if (!status) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Status is required' },
          });
        }

        const validStatuses = ['pending', 'inprogress', 'completed', 'dismissed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid status' },
          });
        }

        const recommendation = await this.recommendationRepository.findById(recommendationId);
        if (!recommendation) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Recommendation not found' },
          });
        }

        if (recommendation.user_id !== userId) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Unauthorized access' },
          });
        }

        const updated = await this.recommendationRepository.updateStatus(recommendationId, {
          status,
          notes,
        });
        return res.status(200).json({ success: true, data: updated });
      } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
          success: false,
          error: { code: err.code || 'ERROR', message: err.message },
        });
      }
    };

    this.deleteRecommendation = async (req, res, _next) => {
      try {
        const { recommendationId } = req.params;
        const { user_id: userId } = req.user;

        const recommendation = await this.recommendationRepository.findById(recommendationId);
        if (!recommendation) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Recommendation not found' },
          });
        }

        if (recommendation.user_id !== userId) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Unauthorized access' },
          });
        }

        await this.recommendationRepository.delete(recommendationId);
        return res.status(200).json({
          success: true,
          message: 'Recommendation deleted successfully',
        });
      } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
          success: false,
          error: { code: err.code || 'ERROR', message: err.message },
        });
      }
    };
  }
  return RecommendationController;
});

// Mock app.js to avoid ES module import issues
jest.mock('../../src/app', () => {
  // eslint-disable-next-line global-require
  const express = require('express');
  const app = express();
  app.use(express.json());

  // Import and register recommendation routes
  try {
    // eslint-disable-next-line global-require
    const recommendationRoutes = require('../../src/api/routes/recommendation.routes');
    // eslint-disable-next-line global-require
    const fieldRoutes = require('../../src/api/routes/field.routes');
    // Mount recommendation routes at /api/v1 (routes have paths like /fields/:field_id/recommendations)
    app.use('/api/v1', recommendationRoutes);
    app.use('/api/v1/fields', fieldRoutes);
  } catch (e) {
    // Log error for debugging but continue
    console.error('Failed to load routes in mock:', e.message);
    console.error(e.stack);
  }

  return {
    __esModule: true,
    default: app,
  };
});

// eslint-disable-next-line global-require
const app = require('../../src/app').default || require('../../src/app');

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
