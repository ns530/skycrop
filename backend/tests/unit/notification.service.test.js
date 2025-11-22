'use strict';

// Mock dependencies
const mockEmailService = {
  sendHealthAlert: jest.fn().mockResolvedValue({ success: true }),
  sendRecommendationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendYieldPredictionEmail: jest.fn().mockResolvedValue({ success: true }),
};

const mockPushService = {
  sendToUser: jest.fn().mockResolvedValue({ success: true, totalDevices: 2, successCount: 2 }),
};

const mockQueue = {
  addEmail: jest.fn().mockResolvedValue({ jobId: 'email-job-1' }),
  addPush: jest.fn().mockResolvedValue({ jobId: 'push-job-1' }),
  getStats: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 10,
    failed: 0,
    provider: 'memory',
  }),
};

jest.mock('../../src/services/email.service', () => ({
  getEmailService: jest.fn(() => mockEmailService),
  EmailService: jest.fn(),
}));

jest.mock('../../src/services/pushNotification.service', () => ({
  getPushNotificationService: jest.fn(() => mockPushService),
  PushNotificationService: jest.fn(),
}));

jest.mock('../../src/jobs/notificationQueue', () => ({
  getNotificationQueue: jest.fn(() => mockQueue),
  NotificationQueue: jest.fn(),
}));

const mockUserModel = {
  findByPk: jest.fn().mockResolvedValue({
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
  }),
};

jest.mock('../../src/models/user.model', () => mockUserModel);

const { NotificationService } = require('../../src/services/notification.service');

describe('NotificationService', () => {
  let notificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockEmailService.sendHealthAlert.mockResolvedValue({ success: true });
    mockEmailService.sendRecommendationEmail.mockResolvedValue({ success: true });
    mockEmailService.sendYieldPredictionEmail.mockResolvedValue({ success: true });
    mockPushService.sendToUser.mockResolvedValue({ success: true, totalDevices: 2, successCount: 2 });
    mockQueue.addEmail.mockResolvedValue({ jobId: 'email-job-1' });
    mockQueue.addPush.mockResolvedValue({ jobId: 'push-job-1' });
    mockQueue.getStats.mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 10,
      failed: 0,
      provider: 'memory',
    });

    // Disable queue for direct service calls
    process.env.USE_NOTIFICATION_QUEUE = 'false';
    
    notificationService = new NotificationService();
  });

  afterEach(() => {
    delete process.env.USE_NOTIFICATION_QUEUE;
  });

  describe('sendHealthAlert', () => {
    it('should send health alert via email and push', async () => {
      const result = await notificationService.sendHealthAlert(
        'user-1',
        'Test Field',
        'NDVI drop detected',
        'critical'
      );

      expect(result.success).toBe(true);
      expect(result.channels).toEqual(['email', 'push']);
      expect(mockEmailService.sendHealthAlert).toHaveBeenCalledWith(
        'test@example.com',
        'Test Field',
        'NDVI drop detected',
        'critical'
      );
      expect(mockPushService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        '🚨 Test Field Alert',
        'NDVI drop detected - critical severity',
        expect.objectContaining({
          type: 'health_alert',
          fieldName: 'Test Field',
          alertType: 'NDVI drop detected',
          severity: 'critical',
        })
      );
    });

    it('should use queue when enabled', async () => {
      process.env.USE_NOTIFICATION_QUEUE = 'true';
      const queueService = new NotificationService();

      await queueService.sendHealthAlert(
        'user-1',
        'Test Field',
        'Low health score',
        'high'
      );

      expect(mockQueue.addEmail).toHaveBeenCalled();
      expect(mockQueue.addPush).toHaveBeenCalled();
      expect(mockEmailService.sendHealthAlert).not.toHaveBeenCalled();
      expect(mockPushService.sendToUser).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      mockUserModel.findByPk.mockResolvedValueOnce(null);

      await expect(
        notificationService.sendHealthAlert('non-existent', 'Field', 'Alert', 'low')
      ).rejects.toThrow('User not found');
    });
  });

  describe('sendRecommendation', () => {
    const mockRecommendation = {
      recommendation_id: 'rec-1',
      field_id: 'field-1',
      title: 'Apply fertilizer',
      description: 'NDVI is low',
      priority: 'high',
      type: 'fertilizer',
      action_steps: ['Step 1', 'Step 2'],
      estimated_cost: 2500,
    };

    it('should send recommendation via email and push', async () => {
      const result = await notificationService.sendRecommendation(
        'user-1',
        'Test Field',
        mockRecommendation
      );

      expect(result.success).toBe(true);
      expect(result.channels).toEqual(['email', 'push']);
      expect(mockEmailService.sendRecommendationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test Field',
        expect.objectContaining({
          recommendation_id: 'rec-1',
          title: 'Apply fertilizer',
          priority: 'high',
          actionSteps: ['Step 1', 'Step 2'],
          estimatedCost: 2500,
        })
      );
      expect(mockPushService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        '📋 Apply fertilizer',
        'HIGH priority recommendation for Test Field',
        expect.objectContaining({
          type: 'recommendation',
          recommendationId: 'rec-1',
          priority: 'high',
        })
      );
    });

    it('should handle recommendations without action steps', async () => {
      const simpleRec = {
        ...mockRecommendation,
        action_steps: null,
      };

      const result = await notificationService.sendRecommendation(
        'user-1',
        'Test Field',
        simpleRec
      );

      expect(result.success).toBe(true);
      expect(mockEmailService.sendRecommendationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          actionSteps: [],
        })
      );
    });
  });

  describe('sendYieldPrediction', () => {
    const mockPrediction = {
      prediction_id: 'pred-1',
      field_id: 'field-1',
      predicted_yield_per_ha: 4800,
      predicted_total_yield: 12000,
      confidence_interval: {
        lower: 4200,
        upper: 5400,
      },
      expected_revenue: 960000,
      harvest_date_estimate: '2024-05-15',
    };

    it('should send yield prediction via email and push', async () => {
      const result = await notificationService.sendYieldPrediction(
        'user-1',
        'Test Field',
        mockPrediction
      );

      expect(result.success).toBe(true);
      expect(result.channels).toEqual(['email', 'push']);
      expect(mockEmailService.sendYieldPredictionEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test Field',
        mockPrediction
      );
      expect(mockPushService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        '🌾 Yield Prediction: Test Field',
        '4,800 kg/ha predicted',
        expect.objectContaining({
          type: 'yield_prediction',
          predictionId: 'pred-1',
          predictedYield: '4800',
        })
      );
    });
  });

  describe('sendNotification', () => {
    it('should send general notification via push only', async () => {
      const result = await notificationService.sendNotification(
        'user-1',
        'Test Title',
        'Test Message',
        'info'
      );

      expect(result.success).toBe(true);
      expect(result.channels).toEqual(['push']);
      expect(mockPushService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'Test Title',
        'Test Message',
        { type: 'info' }
      );
      expect(mockEmailService.sendHealthAlert).not.toHaveBeenCalled();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const stats = await notificationService.getQueueStats();

      expect(stats).toEqual({
        waiting: 0,
        active: 0,
        completed: 10,
        failed: 0,
        provider: 'memory',
      });
      expect(mockQueue.getStats).toHaveBeenCalled();
    });
  });
});

