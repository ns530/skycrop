const HealthMonitoringService = require('../../src/services/healthMonitoring.service');

describe('HealthMonitoringService', () => {
  let service;
  let mockHealthModel;
  let mockFieldModel;

  beforeEach(() => {
    // Mock Health Record model
    mockHealthModel = {
      findAll: jest.fn(),
    };

    // Mock Field model
    mockFieldModel = {
      findByPk: jest.fn(),
    };

    service = new HealthMonitoringService(mockHealthModel, mockFieldModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeFieldHealth', () => {
    const field_id = 'field-123';
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    it('should return comprehensive health analysis for valid field with records', async () => {
      // Mock field exists
      mockFieldModel.findByPk.mockResolvedValue({
        field_id,
        name: 'Test Field',
        user_id: 'user-123',
      });

      // Mock health records (30 days of data)
      const mockRecords = [];
      for (let i = 0; i < 30; i += 1) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i);
        mockRecords.push({
          recordid: `rec-${i}`,
          field_id,
          measurementdate: date.toISOString().split('T')[0],
          ndvimean: 0.6 + i * 0.001, // Slight improvement
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

      mockHealthModel.findAll.mockResolvedValue(mockRecords);

      const result = await service.analyzeFieldHealth(field_id, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.field_id).toBe(field_id);
      expect(result.fieldName).toBe('Test Field');
      expect(result.recordCount).toBe(30);
      expect(result.currentHealth).toBeDefined();
      expect(result.currentHealth.score).toBeGreaterThan(0);
      expect(result.currentHealth.status).toMatch(/excellent|good|fair|poor/);
      expect(result.trend).toBeDefined();
      expect(result.trend.direction).toMatch(/improving|stable|declining|insufficientdata/);
      expect(result.timeSeries).toHaveLength(30);
      expect(result.movingAverages).toBeDefined();
      expect(mockFieldModel.findByPk).toHaveBeenCalledWith(field_id);
      expect(mockHealthModel.findAll).toHaveBeenCalled();
    });

    it('should return nodata status when no health records exist', async () => {
      mockFieldModel.findByPk.mockResolvedValue({
        field_id,
        name: 'Test Field',
      });

      mockHealthModel.findAll.mockResolvedValue([]);

      const result = await service.analyzeFieldHealth(field_id, startDate, endDate);

      expect(result.recordCount).toBe(0);
      expect(result.currentHealth).toBeNull();
      expect(result.status).toBe('nodata');
      expect(result.trend.direction).toBe('nodata');
      expect(result.anomalies).toEqual([]);
    });

    it('should throw 404 error when field does not exist', async () => {
      mockFieldModel.findByPk.mockResolvedValue(null);

      await expect(service.analyzeFieldHealth(field_id, startDate, endDate)).rejects.toThrow(
        'Field not found'
      );
    });

    it('should throw 400 error for invalid start date', async () => {
      await expect(service.analyzeFieldHealth(field_id, 'invalid-date', endDate)).rejects.toThrow(
        'Invalid start date format'
      );
    });

    it('should throw 400 error for invalid end date', async () => {
      await expect(service.analyzeFieldHealth(field_id, startDate, 'invalid-date')).rejects.toThrow(
        'Invalid end date format'
      );
    });

    it('should throw 400 error when start date is after end date', async () => {
      await expect(
        service.analyzeFieldHealth(field_id, '2025-02-01', '2025-01-01')
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should throw 400 error for future end date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await expect(service.analyzeFieldHealth(field_id, startDate, futureDateStr)).rejects.toThrow(
        'End date cannot be in the future'
      );
    });

    it('should throw 400 error for date range exceeding 365 days', async () => {
      await expect(
        service.analyzeFieldHealth(field_id, '2023-01-01', '2024-01-02')
      ).rejects.toThrow('Date range cannot exceed 365 days');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate 7-day moving average correctly', () => {
      const records = [
        { ndvimean: 0.5 },
        { ndvimean: 0.6 },
        { ndvimean: 0.55 },
        { ndvimean: 0.7 },
        { ndvimean: 0.65 },
        { ndvimean: 0.6 },
        { ndvimean: 0.7 },
      ];

      const ma = service.calculateMovingAverage(records, 7, 'ndvimean');
      expect(ma).toBeCloseTo(0.6143, 4);
    });

    it('should return null when insufficient records', () => {
      const records = [{ ndvimean: 0.5 }, { ndvimean: 0.6 }];

      const ma = service.calculateMovingAverage(records, 7, 'ndvimean');
      expect(ma).toBeNull();
    });
  });

  describe('detectTrend', () => {
    it('should detect improving trend', () => {
      const timeSeries = [];
      for (let i = 0; i < 10; i += 1) {
        timeSeries.push({
          date: `2025-01-${i + 1}`,
          value: 0.5 + i * 0.02, // Increasing
        });
      }

      const trend = service.detectTrend(timeSeries);
      expect(trend.direction).toBe('improving');
      expect(trend.slope).toBeGreaterThan(0.01);
    });

    it('should detect declining trend', () => {
      const timeSeries = [];
      for (let i = 0; i < 10; i += 1) {
        timeSeries.push({
          date: `2025-01-${i + 1}`,
          value: 0.7 - i * 0.02, // Decreasing
        });
      }

      const trend = service.detectTrend(timeSeries);
      expect(trend.direction).toBe('declining');
      expect(trend.slope).toBeLessThan(-0.01);
    });

    it('should detect stable trend', () => {
      const timeSeries = [];
      for (let i = 0; i < 10; i += 1) {
        timeSeries.push({
          date: `2025-01-${i + 1}`,
          value: 0.6 + (Math.random() - 0.5) * 0.01, // Small fluctuations
        });
      }

      const trend = service.detectTrend(timeSeries);
      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.slope)).toBeLessThan(0.01);
    });

    it('should return insufficientdata for less than 5 records', () => {
      const timeSeries = [
        { date: '2025-01-01', value: 0.6 },
        { date: '2025-01-02', value: 0.61 },
      ];

      const trend = service.detectTrend(timeSeries);
      expect(trend.direction).toBe('insufficientdata');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect critical NDVI drop (>25%)', () => {
      const records = [];
      // First 10 days: normal
      for (let i = 0; i < 10; i += 1) {
        records.push({
          measurementdate: `2025-01-${i + 1}`,
          ndvimean: 0.7,
        });
      }
      // Day 11: sudden drop (>25%)
      records.push({
        measurementdate: '2025-01-11',
        ndvimean: 0.5, // 28.6% drop from 0.7
      });

      const anomalies = service.detectAnomalies(records);
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].severity).toBe('critical');
      expect(anomalies[0].type).toBe('ndvidrop');
    });

    it('should detect high NDVI drop (15-25%)', () => {
      const records = [];
      for (let i = 0; i < 10; i += 1) {
        records.push({
          measurementdate: `2025-01-${i + 1}`,
          ndvimean: 0.7,
        });
      }
      records.push({
        measurementdate: '2025-01-11',
        ndvimean: 0.58, // ~17% drop
      });

      const anomalies = service.detectAnomalies(records);
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].severity).toBe('high');
    });

    it('should not detect anomalies for small drops (<15%)', () => {
      const records = [];
      for (let i = 0; i < 10; i += 1) {
        records.push({
          measurementdate: `2025-01-${i + 1}`,
          ndvimean: 0.7,
        });
      }
      records.push({
        measurementdate: '2025-01-11',
        ndvimean: 0.65, // ~7% drop
      });

      const anomalies = service.detectAnomalies(records);
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('calculateHealthScore', () => {
    it('should calculate health score correctly (weighted average)', () => {
      // NDVI: 0.7, NDWI: 0.3, TDVI: 0.6
      // Normalized: (0.7+1)/2 = 0.85, (0.3+1)/2 = 0.65, (0.6+1)/2 = 0.8
      // Score = 0.85*60 + 0.65*30 + 0.8*10 = 51 + 19.5 + 8 = 78.5 ≈ 79
      const score = service.calculateHealthScore(0.7, 0.3, 0.6);
      expect(score).toBeCloseTo(79, 0);
    });

    it('should return score between 0 and 100', () => {
      const score1 = service.calculateHealthScore(1.0, 1.0, 1.0);
      expect(score1).toBeLessThanOrEqual(100);
      expect(score1).toBeGreaterThanOrEqual(0);

      const score2 = service.calculateHealthScore(-1.0, -1.0, -1.0);
      expect(score2).toBeLessThanOrEqual(100);
      expect(score2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHealthStatus', () => {
    it('should return excellent for score >= 80', () => {
      expect(service.getHealthStatus(85)).toBe('excellent');
      expect(service.getHealthStatus(80)).toBe('excellent');
    });

    it('should return good for score 60-79', () => {
      expect(service.getHealthStatus(70)).toBe('good');
      expect(service.getHealthStatus(60)).toBe('good');
    });

    it('should return fair for score 40-59', () => {
      expect(service.getHealthStatus(50)).toBe('fair');
      expect(service.getHealthStatus(40)).toBe('fair');
    });

    it('should return poor for score < 40', () => {
      expect(service.getHealthStatus(30)).toBe('poor');
      expect(service.getHealthStatus(0)).toBe('poor');
    });
  });
});
