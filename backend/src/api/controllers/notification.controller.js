'use strict';

const { getPushNotificationService } = require('../../services/pushNotification.service');
const { getNotificationService } = require('../../services/notification.service');
const { logger } = require('../../utils/logger');
const { ValidationError } = require('../../errors/custom-errors');

const pushService = getPushNotificationService();
const notificationService = getNotificationService();

/**
 * Notification Controller
 * Handles device token registration and notification management
 */
module.exports = {
  /**
   * POST /api/v1/notifications/register
   * Register device token for push notifications
   */
  async registerDevice(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { deviceToken, platform } = req.body;

      if (!deviceToken || !platform) {
        throw new ValidationError('deviceToken and platform are required');
      }

      if (!['android', 'ios'].includes(platform)) {
        throw new ValidationError('platform must be either "android" or "ios"');
      }

      const result = await pushService.registerDevice(userId, deviceToken, platform);

      const latency = Date.now() - started;
      logger.info('notifications.register', {
        route: '/api/v1/notifications/register',
        method: 'POST',
        user_id: userId,
        device_id: result.deviceId,
        platform,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(201).json({
        success: true,
        data: {
          deviceId: result.deviceId,
          platform: result.platform,
        },
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/notifications/unregister
   * Unregister device token
   */
  async unregisterDevice(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const { deviceToken } = req.body;

      if (!deviceToken) {
        throw new ValidationError('deviceToken is required');
      }

      const result = await pushService.unregisterDevice(deviceToken);

      const latency = Date.now() - started;
      logger.info('notifications.unregister', {
        route: '/api/v1/notifications/unregister',
        method: 'DELETE',
        success: result.success,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/notifications/test
   * Send test notification (development only)
   */
  async sendTestNotification(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { title, message, type } = req.body;

      if (!title || !message) {
        throw new ValidationError('title and message are required');
      }

      const result = await notificationService.sendNotification(
        userId,
        title || 'Test Notification',
        message || 'This is a test notification from SkyCrop',
        type || 'info'
      );

      const latency = Date.now() - started;
      logger.info('notifications.test', {
        route: '/api/v1/notifications/test',
        method: 'POST',
        user_id: userId,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/notifications/queue/stats
   * Get notification queue statistics
   */
  async getQueueStats(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const stats = await notificationService.getQueueStats();

      const latency = Date.now() - started;
      logger.info('notifications.queue.stats', {
        route: '/api/v1/notifications/queue/stats',
        method: 'GET',
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: stats,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },
};

