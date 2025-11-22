'use strict';

const { getEmailService } = require('./email.service');
const { getPushNotificationService } = require('./pushNotification.service');
const { getNotificationQueue } = require('../jobs/notificationQueue');
const { logger } = require('../utils/logger');

/**
 * Notification Service
 * 
 * Unified service for sending notifications via:
 * - Email (SendGrid/AWS SES)
 * - Push Notifications (Firebase Cloud Messaging)
 * 
 * Uses queue for async processing
 */
class NotificationService {
  constructor() {
    this.emailService = getEmailService();
    this.pushService = getPushNotificationService();
    this.queue = getNotificationQueue();
    this.useQueue = process.env.USE_NOTIFICATION_QUEUE !== 'false'; // Default: true
  }

  /**
   * Get user email
   * @param {string} userId - User ID
   * @returns {Promise<string>} User email
   */
  async _getUserEmail(userId) {
    try {
      const User = require('../models/user.model');
      const user = await User.findByPk(userId, {
        attributes: ['email', 'first_name', 'last_name'],
      });
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      return user.email;
    } catch (error) {
      logger.error('notification._getUserEmail.error', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send health alert notification
   * @param {string} userId - User ID
   * @param {string} fieldName - Field name
   * @param {string} alertType - Alert type
   * @param {string} severity - Severity level (low, medium, high, critical)
   * @returns {Promise<Object>} Result
   */
  async sendHealthAlert(userId, fieldName, alertType, severity) {
    try {
      const userEmail = await this._getUserEmail(userId);
      
      // Email notification
      if (this.useQueue) {
        await this.queue.addEmail({
          to: userEmail,
          subject: `⚠️ ${severity.toUpperCase()} Alert: ${fieldName}`,
          html: await this._buildHealthAlertHtml(fieldName, alertType, severity),
        });
      } else {
        await this.emailService.sendHealthAlert(userEmail, fieldName, alertType, severity);
      }

      // Push notification
      const pushTitle = `${severity === 'critical' ? '🚨' : '⚠️'} ${fieldName} Alert`;
      const pushBody = `${alertType} - ${severity} severity`;
      
      if (this.useQueue) {
        await this.queue.addPush({
          userId,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'health_alert',
            fieldName,
            alertType,
            severity,
          },
        });
      } else {
        await this.pushService.sendToUser(userId, pushTitle, pushBody, {
          type: 'health_alert',
          fieldName,
          alertType,
          severity,
        });
      }

      logger.info('notification.healthAlert.sent', {
        userId,
        fieldName,
        alertType,
        severity,
      });

      return {
        success: true,
        channels: ['email', 'push'],
      };
    } catch (error) {
      logger.error('notification.healthAlert.error', {
        userId,
        fieldName,
        error: error.message,
      });
      throw error;
    }
  }

  async _buildHealthAlertHtml(fieldName, alertType, severity) {
    // Simple HTML builder (email service has the full template)
    return `<p>Health alert for ${fieldName}: ${alertType} (${severity})</p>`;
  }

  /**
   * Send recommendation notification
   * @param {string} userId - User ID
   * @param {string} fieldName - Field name
   * @param {Object} recommendation - Recommendation data
   * @returns {Promise<Object>} Result
   */
  async sendRecommendation(userId, fieldName, recommendation) {
    try {
      const userEmail = await this._getUserEmail(userId);
      
      // Email notification
      if (this.useQueue) {
        await this.queue.addEmail({
          to: userEmail,
          subject: `📋 New Recommendation for ${fieldName}`,
          html: await this._buildRecommendationHtml(fieldName, recommendation),
        });
      } else {
        await this.emailService.sendRecommendationEmail(userEmail, fieldName, {
          ...recommendation,
          actionSteps: recommendation.action_steps || [],
          estimatedCost: recommendation.estimated_cost,
          fieldId: recommendation.field_id,
        });
      }

      // Push notification
      const pushTitle = `📋 ${recommendation.title}`;
      const pushBody = `${recommendation.priority.toUpperCase()} priority recommendation for ${fieldName}`;
      
      if (this.useQueue) {
        await this.queue.addPush({
          userId,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'recommendation',
            fieldName,
            recommendationId: recommendation.recommendation_id,
            priority: recommendation.priority,
          },
        });
      } else {
        await this.pushService.sendToUser(userId, pushTitle, pushBody, {
          type: 'recommendation',
          fieldName,
          recommendationId: recommendation.recommendation_id,
          priority: recommendation.priority,
        });
      }

      logger.info('notification.recommendation.sent', {
        userId,
        fieldName,
        recommendationId: recommendation.recommendation_id,
        priority: recommendation.priority,
      });

      return {
        success: true,
        channels: ['email', 'push'],
      };
    } catch (error) {
      logger.error('notification.recommendation.error', {
        userId,
        fieldName,
        error: error.message,
      });
      throw error;
    }
  }

  async _buildRecommendationHtml(fieldName, recommendation) {
    return `<p>New recommendation for ${fieldName}: ${recommendation.title}</p>`;
  }

  /**
   * Send yield prediction notification
   * @param {string} userId - User ID
   * @param {string} fieldName - Field name
   * @param {Object} prediction - Prediction data
   * @returns {Promise<Object>} Result
   */
  async sendYieldPrediction(userId, fieldName, prediction) {
    try {
      const userEmail = await this._getUserEmail(userId);
      
      // Email notification
      if (this.useQueue) {
        await this.queue.addEmail({
          to: userEmail,
          subject: `🌾 Yield Prediction Ready for ${fieldName}`,
          html: await this._buildYieldPredictionHtml(fieldName, prediction),
        });
      } else {
        await this.emailService.sendYieldPredictionEmail(userEmail, fieldName, prediction);
      }

      // Push notification
      const pushTitle = `🌾 Yield Prediction: ${fieldName}`;
      const pushBody = `${prediction.predicted_yield_per_ha.toLocaleString()} kg/ha predicted`;
      
      if (this.useQueue) {
        await this.queue.addPush({
          userId,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'yield_prediction',
            fieldName,
            predictionId: prediction.prediction_id,
            predictedYield: prediction.predicted_yield_per_ha.toString(),
          },
        });
      } else {
        await this.pushService.sendToUser(userId, pushTitle, pushBody, {
          type: 'yield_prediction',
          fieldName,
          predictionId: prediction.prediction_id,
          predictedYield: prediction.predicted_yield_per_ha.toString(),
        });
      }

      logger.info('notification.yieldPrediction.sent', {
        userId,
        fieldName,
        predictionId: prediction.prediction_id,
        predictedYield: prediction.predicted_yield_per_ha,
      });

      return {
        success: true,
        channels: ['email', 'push'],
      };
    } catch (error) {
      logger.error('notification.yieldPrediction.error', {
        userId,
        fieldName,
        error: error.message,
      });
      throw error;
    }
  }

  async _buildYieldPredictionHtml(fieldName, prediction) {
    return `<p>Yield prediction for ${fieldName}: ${prediction.predicted_yield_per_ha} kg/ha</p>`;
  }

  /**
   * Send general notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @returns {Promise<Object>} Result
   */
  async sendNotification(userId, title, message, type = 'info') {
    try {
      // Push notification only for general messages
      if (this.useQueue) {
        await this.queue.addPush({
          userId,
          title,
          body: message,
          data: { type },
        });
      } else {
        await this.pushService.sendToUser(userId, title, message, { type });
      }

      logger.info('notification.general.sent', {
        userId,
        title,
        type,
      });

      return {
        success: true,
        channels: ['push'],
      };
    } catch (error) {
      logger.error('notification.general.error', {
        userId,
        title,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get notification queue stats
   * @returns {Promise<Object>} Queue statistics
   */
  async getQueueStats() {
    return await this.queue.getStats();
  }
}

// Singleton instance
let notificationServiceInstance;

function getNotificationService() {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}

module.exports = {
  NotificationService,
  getNotificationService,
};

// For backward compatibility
module.exports.default = NotificationService;

