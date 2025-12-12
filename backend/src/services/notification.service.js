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
    this.useQueue = process.env.USENOTIFICATIONQUEUE !== 'false'; // Default: true
  }

  /**
   * Get user email
   * @param {string} user_id - User ID
   * @returns {Promise<string>} User email
   */
  async getUserEmail(user_id) {
    try {
      const User = require('../models/user.model');
      const user = await User.findByPk(user_id, {
        attributes: ['email', 'firstname', 'lastname'],
      });

      if (!user) {
        throw new Error(`User not found: ${user_id}`);
      }

      return user.email;
    } catch (error) {
      logger.error('notification.getUserEmail.error', {
        user_id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send health alert notification
   * @param {string} user_id - User ID
   * @param {string} fieldName - Field name
   * @param {string} alertType - Alert type
   * @param {string} severity - Severity level (low, medium, high, critical)
   * @returns {Promise<Object>} Result
   */
  async sendHealthAlert(user_id, fieldName, alertType, severity) {
    try {
      const userEmail = await this.getUserEmail(user_id);

      // Email notification
      if (this.useQueue) {
        await this.queue.addEmail({
          to: userEmail,
          subject: `⚠️ ${severity.toUpperCase()} Alert: ${fieldName}`,
          html: await this.buildHealthAlertHtml(fieldName, alertType, severity),
        });
      } else {
        await this.emailService.sendHealthAlert(userEmail, fieldName, alertType, severity);
      }

      // Push notification
      const pushTitle = `${severity === 'critical' ? '🚨' : '⚠️'} ${fieldName} Alert`;
      const pushBody = `${alertType} - ${severity} severity`;

      if (this.useQueue) {
        await this.queue.addPush({
          user_id,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'healthalert',
            fieldName,
            alertType,
            severity,
          },
        });
      } else {
        await this.pushService.sendToUser(user_id, pushTitle, pushBody, {
          type: 'healthalert',
          fieldName,
          alertType,
          severity,
        });
      }

      logger.info('notification.healthAlert.sent', {
        user_id,
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
        user_id,
        fieldName,
        error: error.message,
      });
      throw error;
    }
  }

  async buildHealthAlertHtml(fieldName, alertType, severity) {
    // Simple HTML builder (email service has the full template)
    return `<p>Health alert for ${fieldName}: ${alertType} (${severity})</p>`;
  }

  /**
   * Send recommendation notification
   * @param {string} user_id - User ID
   * @param {string} fieldName - Field name
   * @param {Object} recommendation - Recommendation data
   * @returns {Promise<Object>} Result
   */
  async sendRecommendation(user_id, fieldName, recommendation) {
    try {
      const userEmail = await this.getUserEmail(user_id);

      // Email notification
      if (this.useQueue) {
        await this.queue.addEmail({
          to: userEmail,
          subject: `📋 New Recommendation for ${fieldName}`,
          html: await this.buildRecommendationHtml(fieldName, recommendation),
        });
      } else {
        await this.emailService.sendRecommendationEmail(userEmail, fieldName, {
          ...recommendation,
          actionSteps: recommendation.actionsteps || [],
          estimatedCost: recommendation.estimatedcost,
          field_id: recommendation.field_id,
        });
      }

      // Push notification
      const pushTitle = `📋 ${recommendation.title}`;
      const pushBody = `${recommendation.priority.toUpperCase()} priority recommendation for ${fieldName}`;

      if (this.useQueue) {
        await this.queue.addPush({
          user_id,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'recommendation',
            fieldName,
            recommendationId: recommendation.recommendationid,
            priority: recommendation.priority,
          },
        });
      } else {
        await this.pushService.sendToUser(user_id, pushTitle, pushBody, {
          type: 'recommendation',
          fieldName,
          recommendationId: recommendation.recommendationid,
          priority: recommendation.priority,
        });
      }

      logger.info('notification.recommendation.sent', {
        user_id,
        fieldName,
        recommendationId: recommendation.recommendationid,
        priority: recommendation.priority,
      });

      return {
        success: true,
        channels: ['email', 'push'],
      };
    } catch (error) {
      logger.error('notification.recommendation.error', {
        user_id,
        fieldName,
        error: error.message,
      });
      throw error;
    }
  }

  async buildRecommendationHtml(fieldName, recommendation) {
    return `<p>New recommendation for ${fieldName}: ${recommendation.title}</p>`;
  }

  /**
   * Send yield prediction notification
   * @param {string} user_id - User ID
   * @param {string} fieldName - Field name
   * @param {Object} prediction - Prediction data
   * @returns {Promise<Object>} Result
   */
  async sendYieldPrediction(user_id, fieldName, prediction) {
    try {
      const userEmail = await this.getUserEmail(user_id);

      // Email notification
      if (this.useQueue) {
        await this.queue.addEmail({
          to: userEmail,
          subject: `🌾 Yield Prediction Ready for ${fieldName}`,
          html: await this.buildYieldPredictionHtml(fieldName, prediction),
        });
      } else {
        await this.emailService.sendYieldPredictionEmail(userEmail, fieldName, prediction);
      }

      // Push notification
      const pushTitle = `🌾 Yield Prediction: ${fieldName}`;
      const pushBody = `${prediction.predictedyieldperha.toLocaleString()} kg/ha predicted`;

      if (this.useQueue) {
        await this.queue.addPush({
          user_id,
          title: pushTitle,
          body: pushBody,
          data: {
            type: 'yieldprediction',
            fieldName,
            predictionId: prediction.predictionid,
            predictedYield: prediction.predictedyieldperha.toString(),
          },
        });
      } else {
        await this.pushService.sendToUser(user_id, pushTitle, pushBody, {
          type: 'yieldprediction',
          fieldName,
          predictionId: prediction.predictionid,
          predictedYield: prediction.predictedyieldperha.toString(),
        });
      }

      logger.info('notification.yieldPrediction.sent', {
        user_id,
        fieldName,
        predictionId: prediction.predictionid,
        predictedYield: prediction.predictedyieldperha,
      });

      return {
        success: true,
        channels: ['email', 'push'],
      };
    } catch (error) {
      logger.error('notification.yieldPrediction.error', {
        user_id,
        fieldName,
        error: error.message,
      });
      throw error;
    }
  }

  async buildYieldPredictionHtml(fieldName, prediction) {
    return `<p>Yield prediction for ${fieldName}: ${prediction.predictedyieldperha} kg/ha</p>`;
  }

  /**
   * Send general notification
   * @param {string} user_id - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @returns {Promise<Object>} Result
   */
  async sendNotification(user_id, title, message, type = 'info') {
    try {
      // Push notification only for general messages
      if (this.useQueue) {
        await this.queue.addPush({
          user_id,
          title,
          body: message,
          data: { type },
        });
      } else {
        await this.pushService.sendToUser(user_id, title, message, { type });
      }

      logger.info('notification.general.sent', {
        user_id,
        title,
        type,
      });

      return {
        success: true,
        channels: ['push'],
      };
    } catch (error) {
      logger.error('notification.general.error', {
        user_id,
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
