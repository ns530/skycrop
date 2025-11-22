'use strict';

const { logger } = require('../utils/logger');

/**
 * Push Notification Service
 * Handles push notifications through Firebase Cloud Messaging (FCM)
 * 
 * For MVP: Uses console logging (stub)
 * For Production: Integrate with Firebase Cloud Messaging
 */
class PushNotificationService {
  constructor() {
    this.provider = process.env.PUSH_PROVIDER || 'console'; // 'fcm' or 'console'
    this.initialized = false;
    
    if (this.provider === 'fcm') {
      this._initFirebase();
    } else {
      logger.info('Push notification service: Console mode (MVP)');
    }
  }

  _initFirebase() {
    try {
      const admin = require('firebase-admin');
      
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccount) {
        logger.warn('FIREBASE_SERVICE_ACCOUNT not set, push service will use console logging');
        this.provider = 'console';
        return;
      }

      const credentials = JSON.parse(serviceAccount);
      
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });

      this.admin = admin;
      this.messaging = admin.messaging();
      this.initialized = true;
      logger.info('Firebase Cloud Messaging initialized');
    } catch (error) {
      logger.warn('Firebase not available, falling back to console logging', { error: error.message });
      this.provider = 'console';
    }
  }

  /**
   * Send push notification to specific device token
   * @param {string} deviceToken - FCM device token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Send result
   */
  async sendToDevice(deviceToken, title, body, data = {}) {
    const started = Date.now();

    try {
      if (this.provider === 'fcm' && this.initialized) {
        return await this._sendViaFCM(deviceToken, title, body, data);
      } else {
        return await this._sendViaConsole(deviceToken, title, body, data);
      }
    } catch (error) {
      const latency = Date.now() - started;
      logger.error('push.send.error', {
        deviceToken: deviceToken.substring(0, 20) + '...',
        title,
        provider: this.provider,
        latency_ms: latency,
        error: error.message,
      });
      throw error;
    }
  }

  async _sendViaFCM(deviceToken, title, body, data) {
    const started = Date.now();

    const message = {
      token: deviceToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        sentAt: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await this.messaging.send(message);
    
    const latency = Date.now() - started;
    logger.info('push.sent', {
      deviceToken: deviceToken.substring(0, 20) + '...',
      title,
      provider: 'fcm',
      messageId: response,
      latency_ms: latency,
    });

    return {
      success: true,
      provider: 'fcm',
      messageId: response,
      latency_ms: latency,
    };
  }

  async _sendViaConsole(deviceToken, title, body, data) {
    logger.info('push.sent.console', {
      deviceToken: deviceToken.substring(0, 20) + '...',
      title,
      body,
      data,
      provider: 'console',
    });

    console.log('\n========== PUSH NOTIFICATION (Console Mode) ==========');
    console.log(`Device Token: ${deviceToken.substring(0, 30)}...`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`Data:`, data);
    console.log('======================================================\n');

    return {
      success: true,
      provider: 'console',
      messageId: 'console-' + Date.now(),
      latency_ms: 0,
    };
  }

  /**
   * Send push notification to user (looks up device tokens)
   * @param {string} userId - User UUID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Send result
   */
  async sendToUser(userId, title, body, data = {}) {
    try {
      // Get user's device tokens from database
      const DeviceToken = require('../models/deviceToken.model');
      
      const devices = await DeviceToken.findAll({
        where: {
          user_id: userId,
          active: true,
        },
      });

      if (devices.length === 0) {
        logger.warn('push.no_devices', { userId });
        return {
          success: false,
          reason: 'no_devices',
          userId,
        };
      }

      // Send to all devices
      const results = [];
      for (const device of devices) {
        try {
          const result = await this.sendToDevice(device.device_token, title, body, data);
          results.push({
            deviceId: device.token_id,
            ...result,
          });

          // Update last_used timestamp
          await device.update({ last_used: new Date() });
        } catch (error) {
          logger.error('push.device.failed', {
            deviceId: device.token_id,
            error: error.message,
          });
          
          // If token is invalid, mark device as inactive
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            await device.update({ active: false });
          }
          
          results.push({
            deviceId: device.token_id,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: results.some(r => r.success),
        userId,
        totalDevices: devices.length,
        successCount: results.filter(r => r.success).length,
        results,
      };
    } catch (error) {
      logger.error('push.sendToUser.error', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array<string>} userIds - Array of user UUIDs
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   * @returns {Promise<Array>} Array of send results
   */
  async sendToUsers(userIds, title, body, data = {}) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, title, body, data);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          userId,
          error: error.message,
        });
      }
    }
    return results;
  }

  /**
   * Register device token for a user
   * @param {string} userId - User UUID
   * @param {string} deviceToken - FCM device token
   * @param {string} platform - Platform ('android' or 'ios')
   * @returns {Promise<Object>} Registration result
   */
  async registerDevice(userId, deviceToken, platform) {
    try {
      const DeviceToken = require('../models/deviceToken.model');
      
      // Check if token already exists
      let device = await DeviceToken.findOne({
        where: { device_token: deviceToken },
      });

      if (device) {
        // Update existing token
        await device.update({
          user_id: userId,
          platform,
          active: true,
          last_used: new Date(),
        });
        
        logger.info('push.device.updated', {
          userId,
          deviceId: device.token_id,
          platform,
        });
      } else {
        // Create new token
        device = await DeviceToken.create({
          user_id: userId,
          device_token: deviceToken,
          platform,
          active: true,
          last_used: new Date(),
        });
        
        logger.info('push.device.registered', {
          userId,
          deviceId: device.token_id,
          platform,
        });
      }

      return {
        success: true,
        deviceId: device.token_id,
        platform: device.platform,
      };
    } catch (error) {
      logger.error('push.device.register.error', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Unregister device token
   * @param {string} deviceToken - FCM device token
   * @returns {Promise<Object>} Unregistration result
   */
  async unregisterDevice(deviceToken) {
    try {
      const DeviceToken = require('../models/deviceToken.model');
      
      const device = await DeviceToken.findOne({
        where: { device_token: deviceToken },
      });

      if (device) {
        await device.update({ active: false });
        
        logger.info('push.device.unregistered', {
          deviceId: device.token_id,
          userId: device.user_id,
        });

        return {
          success: true,
          deviceId: device.token_id,
        };
      }

      return {
        success: false,
        reason: 'device_not_found',
      };
    } catch (error) {
      logger.error('push.device.unregister.error', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Singleton instance
let pushServiceInstance;

function getPushNotificationService() {
  if (!pushServiceInstance) {
    pushServiceInstance = new PushNotificationService();
  }
  return pushServiceInstance;
}

module.exports = {
  PushNotificationService,
  getPushNotificationService,
};

