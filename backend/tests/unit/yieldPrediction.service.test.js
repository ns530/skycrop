'use strict';

const { getYieldService } = require('../../src/services/yield.service');

// Mock dependencies
jest.mock('../../src/models/field.model');
jest.mock('../../src/models/yield_prediction.model');
jest.mock('../../src/repositories/health.repository');
jest.mock('../../src/services/mlGateway.service');
jest.mock('../../src/services/weather.service');
jest.mock('../../src/config/redis.config', () => ({
  getRedisClient: jest.fn(() => ({
    isOpen: true,
    get: jest.fn(),
    setEx: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
  })),
  initRedis: jest.fn(),
}));

const Field = require('../../src/models/field.model');
const YieldPrediction = require('../../src/models/yield_prediction.model');
const HealthRepository = require('../../src/repositories/health.repository');

describe('Yield Prediction Service', () => {
  let yieldService;

  beforeEach(() => {
    jest.clearAllMocks();
    yieldService = getYieldService();
  });

  describe('predictYield', () => {
    it('should generate yield prediction successfully', async () => {
      // Mock field
      const mockField = {
        field_id: 'field-1',
        user_id: 'user-1',
        name: 'Test Field',
        area: 2.5,
        center: { coordinates: [80.0, 7.0] },
        status: 'active',
      };
      Field.findOne = jest.fn().mockResolvedValue(mockField);

      // Mock health records
      const mockHealthRecords = [
        { ndvi_mean: 0.65, measurement_date: '2024-01-01' },
        { ndvi_mean: 0.68, measurement_date: '2024-01-05' },
        { ndvi_mean: 0.70, measurement_date: '2024-01-10' },
      ];
      HealthRepository.mockImplementation(() => ({
        findByFieldAndDateRange: jest.fn().mockResolvedValue(mockHealthRecords),
      }));

      // Mock weather service
      const { getWeatherService } = require('../../src/services/weather.service');
      getWeatherService.mockReturnValue({
        getForecastByCoords: jest.fn().mockResolvedValue({
          data: {
            totals: { rain_7d_mm: 120 },
            days: [
              { tmax: 30, tmin: 24 },
              { tmax: 31, tmin: 25 },
            ],
          },
        }),
      });

      // Mock ML Gateway
      const { getMLGatewayService } = require('../../src/services/mlGateway.service');
      getMLGatewayService.mockReturnValue({
        yieldPredict: jest.fn().mockResolvedValue({
          result: {
            data: {
              predictions: [{
                predicted_yield: 4800,
                confidence_interval: {
                  lower: 4200,
                  upper: 5400,
                },
              }],
              model: { version: '1.0.0' },
            },
          },
          cacheHit: false,
        }),
      });

      // Mock yield prediction creation
      YieldPrediction.create = jest.fn().mockResolvedValue({
        prediction_id: 'pred-1',
        field_id: 'field-1',
        prediction_date: '2024-01-15',
        predicted_yield_per_ha: 4800,
        predicted_total_yield: 12000,
        confidence_lower: 4200,
        confidence_upper: 5400,
        expected_revenue: 960000,
        harvest_date_estimate: '2024-05-15',
        model_version: '1.0.0',
        features_used: {},
      });

      const result = await yieldService.predictYield('user-1', 'field-1', {
        planting_date: '2024-01-15',
        price_per_kg: 80,
      });

      expect(result.prediction_id).toBe('pred-1');
      expect(result.predicted_yield_per_ha).toBe(4800);
      expect(result.predicted_total_yield).toBe(12000);
      expect(result.confidence_interval).toEqual({
        lower: 4200,
        upper: 5400,
      });
      expect(YieldPrediction.create).toHaveBeenCalled();
    });

    it('should throw error when field not found', async () => {
      Field.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        yieldService.predictYield('user-1', 'field-1', {})
      ).rejects.toThrow('Field not found');
    });

    it('should handle weather service failure gracefully', async () => {
      const mockField = {
        field_id: 'field-1',
        user_id: 'user-1',
        name: 'Test Field',
        area: 2.5,
        center: { coordinates: [80.0, 7.0] },
        status: 'active',
      };
      Field.findOne = jest.fn().mockResolvedValue(mockField);

      HealthRepository.mockImplementation(() => ({
        findByFieldAndDateRange: jest.fn().mockResolvedValue([
          { ndvi_mean: 0.65 },
        ]),
      }));

      // Mock weather service failure
      const { getWeatherService } = require('../../src/services/weather.service');
      getWeatherService.mockReturnValue({
        getForecastByCoords: jest.fn().mockRejectedValue(new Error('Weather API unavailable')),
      });

      // Mock ML Gateway
      const { getMLGatewayService } = require('../../src/services/mlGateway.service');
      getMLGatewayService.mockReturnValue({
        yieldPredict: jest.fn().mockResolvedValue({
          result: {
            data: {
              predictions: [{
                predicted_yield: 4500,
                confidence_interval: {
                  lower: 4000,
                  upper: 5000,
                },
              }],
              model: { version: '1.0.0' },
            },
          },
          cacheHit: false,
        }),
      });

      YieldPrediction.create = jest.fn().mockResolvedValue({
        prediction_id: 'pred-1',
        field_id: 'field-1',
        prediction_date: '2024-01-15',
        predicted_yield_per_ha: 4500,
        predicted_total_yield: 11250,
        confidence_lower: 4000,
        confidence_upper: 5000,
        expected_revenue: 900000,
        harvest_date_estimate: '2024-05-15',
        model_version: '1.0.0',
        features_used: {},
      });

      const result = await yieldService.predictYield('user-1', 'field-1', {});

      // Should succeed with default weather values
      expect(result.prediction_id).toBe('pred-1');
      expect(result.predicted_yield_per_ha).toBe(4500);
    });

    it('should calculate revenue based on price_per_kg', async () => {
      const mockField = {
        field_id: 'field-1',
        user_id: 'user-1',
        name: 'Test Field',
        area: 1.0, // 1 hectare
        center: { coordinates: [80.0, 7.0] },
        status: 'active',
      };
      Field.findOne = jest.fn().mockResolvedValue(mockField);

      HealthRepository.mockImplementation(() => ({
        findByFieldAndDateRange: jest.fn().mockResolvedValue([
          { ndvi_mean: 0.65 },
        ]),
      }));

      const { getWeatherService } = require('../../src/services/weather.service');
      getWeatherService.mockReturnValue({
        getForecastByCoords: jest.fn().mockResolvedValue({
          data: { totals: { rain_7d_mm: 100 }, days: [] },
        }),
      });

      const { getMLGatewayService } = require('../../src/services/mlGateway.service');
      getMLGatewayService.mockReturnValue({
        yieldPredict: jest.fn().mockResolvedValue({
          result: {
            data: {
              predictions: [{
                predicted_yield: 5000, // 5000 kg/ha
                confidence_interval: { lower: 4500, upper: 5500 },
              }],
              model: { version: '1.0.0' },
            },
          },
          cacheHit: false,
        }),
      });

      YieldPrediction.create = jest.fn().mockImplementation((data) => Promise.resolve({
        ...data,
        prediction_id: 'pred-1',
      }));

      const result = await yieldService.predictYield('user-1', 'field-1', {
        price_per_kg: 100, // 100 LKR per kg
      });

      // Expected revenue = 5000 kg * 100 LKR = 500,000 LKR
      expect(result.expected_revenue).toBe(500000);
    });
  });

  describe('getPredictions', () => {
    it('should retrieve predictions for a field', async () => {
      const mockField = {
        field_id: 'field-1',
        user_id: 'user-1',
        name: 'Test Field',
        status: 'active',
      };
      Field.findOne = jest.fn().mockResolvedValue(mockField);

      const mockPredictions = [
        {
          prediction_id: 'pred-1',
          field_id: 'field-1',
          prediction_date: '2024-01-15',
          predicted_yield_per_ha: 4800,
          predicted_total_yield: 12000,
          confidence_lower: 4200,
          confidence_upper: 5400,
          expected_revenue: 960000,
          harvest_date_estimate: '2024-05-15',
          model_version: '1.0.0',
          actual_yield: null,
          accuracy_mape: null,
          created_at: new Date(),
        },
      ];

      YieldPrediction.findAll = jest.fn().mockResolvedValue(mockPredictions);

      const result = await yieldService.getPredictions('user-1', 'field-1', {});

      expect(result.predictions).toHaveLength(1);
      expect(result.predictions[0].prediction_id).toBe('pred-1');
      expect(result.predictions[0].predicted_yield_per_ha).toBe(4800);
    });

    it('should throw error when field not found', async () => {
      Field.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        yieldService.getPredictions('user-1', 'field-1', {})
      ).rejects.toThrow('Field not found');
    });

    it('should respect limit and sort options', async () => {
      const mockField = {
        field_id: 'field-1',
        user_id: 'user-1',
        name: 'Test Field',
        status: 'active',
      };
      Field.findOne = jest.fn().mockResolvedValue(mockField);

      YieldPrediction.findAll = jest.fn().mockResolvedValue([]);

      await yieldService.getPredictions('user-1', 'field-1', {
        limit: 5,
        sort: 'predicted_yield_per_ha',
        order: 'asc',
      });

      expect(YieldPrediction.findAll).toHaveBeenCalledWith({
        where: { field_id: 'field-1' },
        order: [['predicted_yield_per_ha', 'ASC']],
        limit: 5,
        attributes: expect.any(Array),
      });
    });
  });
});

