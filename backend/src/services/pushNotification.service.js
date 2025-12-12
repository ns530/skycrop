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
    this.provider = process.env.PUSHPROVIDER || 'console'; // 'fcm' or 'console'
    this.initialized = false;

    if (this.provider === 'fcm') {
      this.initFirebase();
    } else {
      logger.info('Push notification service: Console mode (MVP)');
    }
  }

  initFirebase() {
    try {
      const admin = require('firebase-admin');

      const serviceAccount = process.env.FIREBASESERVICEACCOUNT;
      if (!serviceAccount) {
        logger.warn('FIREBASESERVICEACCOUNT not set, push service will use console logging');
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
      logger.warn('Firebase not available, falling back to console logging', {
        error: error.message,
      });
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
        return await this.sendViaFCM(deviceToken, title, body, data);
      }
      return await this.sendViaConsole(deviceToken, title, body, data);
    } catch (error) {
      const latency = Date.now() - started;
      logger.error('push.send.error', {
        deviceToken: `${deviceToken.substring(0, 20)}...`,
        title,
        provider: this.provider,
        latencyms: latency,
        error: error.message,
      });
      throw error;
    }
  }

  async sendViaFCM(deviceToken, title, body, data) {
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
          clickAction: 'FLUTTERNOTIFICATIONCLICK',
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
      deviceToken: `${deviceToken.substring(0, 20)}...`,
      title,
      provider: 'fcm',
      messageId: response,
      latencyms: latency,
    });

    return {
      success: true,
      provider: 'fcm',
      messageId: response,
      latencyms: latency,
    };
  }

  async sendViaConsole(deviceToken, title, body, data) {
    logger.info('push.sent.console', {
      deviceToken: `${deviceToken.substring(0, 20)}...`,
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
      messageId: `console-${Date.now()}`,
      latencyms: 0,
    };
  }

  /**
   * Send push notification to user (looks up device tokens)
   * @param {string} user_id - User UUID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Send result
   */
  async sendToUser(user_id, title, body, data = {}) {
    try {
      // Get user's device tokens from database
      const DeviceToken = require('../models/deviceToken.model');

      const devices = await DeviceToken.findAll({
        where: {
          user_id,
          active: true,
        },
      });

      if (devices.length === 0) {
        logger.warn('push.nodevices', { user_id });
        return {
          success: false,
          reason: 'nodevices',
          user_id,
        };
      }

      // Send to all devices
      const results = [];
      for (const device of devices) {
        try {
          const result = await this.sendToDevice(device.devicetoken, title, body, data);
          results.push({
            deviceId: device.tokenid,
            ...result,
          });

          // Update lastused timestamp
          await device.update({ lastused: new Date() });
        } catch (error) {
          logger.error('push.device.failed', {
            deviceId: device.tokenid,
            error: error.message,
          });

          // If token is invalid, mark device as inactive
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            await device.update({ active: false });
          }

          results.push({
            deviceId: device.tokenid,
            success: false,
            error: error.message,
          });
        }
      }

      return {
        success: results.some(r => r.success),
        user_id,
        totalDevices: devices.length,
        successCount: results.filter(r => r.success).length,
        results,
      };
    } catch (error) {
      logger.error('push.sendToUser.error', {
        user_id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array<string>} user_ids - Array of user UUIDs
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data payload
   * @returns {Promise<Array>} Array of send results
   */
  async sendToUsers(user_ids, title, body, data = {}) {
    const results = [];
    for (const user_id of user_ids) {
      try {
        const result = await this.sendToUser(user_id, title, body, data);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          user_id,
          error: error.message,
        });
      }
    }
    return results;
  }

  /**
   * Register device token for a user
   * @param {string} user_id - User UUID
   * @param {string} deviceToken - FCM device token
   * @param {string} platform - Platform ('android' or 'ios')
   * @returns {Promise<Object>} Registration result
   */
  async registerDevice(user_id, deviceToken, platform) {
    try {
      const DeviceToken = require('../models/deviceToken.model');

      // Check if token already exists
      let device = await DeviceToken.findOne({
        where: { devicetoken: deviceToken },
      });

      if (device) {
        // Update existing token
        await device.update({
          user_id,
          platform,
          active: true,
          lastused: new Date(),
        });

        logger.info('push.device.updated', {
          user_id,
          deviceId: device.tokenid,
          platform,
        });
      } else {
        // Create new token
        device = await DeviceToken.create({
          user_id,
          devicetoken: deviceToken,
          platform,
          active: true,
          lastused: new Date(),
        });

        logger.info('push.device.registered', {
          user_id,
          deviceId: device.tokenid,
          platform,
        });
      }

      return {
        success: true,
        deviceId: device.tokenid,
        platform: device.platform,
      };
    } catch (error) {
      logger.error('push.device.register.error', {
        user_id,
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
        where: { devicetoken: deviceToken },
      });

      if (device) {
        await device.update({ active: false });

        logger.info('push.device.unregistered', {
          deviceId: device.tokenid,
          user_id: device.user_id,
        });

        return {
          success: true,
          deviceId: device.tokenid,
        };
      }

      return {
        success: false,
        reason: 'devicenotfound',
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
