'use strict';

const express = require('express');
const Joi = require('joi');
const NotificationController = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * Notification Routes
 * Endpoints for device token registration and push notifications
 *
 * Routes:
 * - POST   /api/v1/notifications/register       - Register device token
 * - DELETE /api/v1/notifications/unregister     - Unregister device token
 * - POST   /api/v1/notifications/test           - Send test notification
 * - GET    /api/v1/notifications/queue/stats    - Get queue stats
 */

// ========== Validation Schemas ==========

const registerDeviceBody = Joi.object({
  deviceToken: Joi.string().min(10).max(500).required().messages({
    'string.base': 'Device token must be a string',
    'string.min': 'Device token must be at least 10 characters',
    'string.max': 'Device token cannot exceed 500 characters',
    'any.required': 'Device token is required',
  }),
  platform: Joi.string().valid('android', 'ios').required().messages({
    'any.only': 'Platform must be either "android" or "ios"',
    'any.required': 'Platform is required',
  }),
});

const unregisterDeviceBody = Joi.object({
  deviceToken: Joi.string().min(10).max(500).required().messages({
    'string.base': 'Device token must be a string',
    'string.min': 'Device token must be at least 10 characters',
    'string.max': 'Device token cannot exceed 500 characters',
    'any.required': 'Device token is required',
  }),
});

const testNotificationBody = Joi.object({
  title: Joi.string().max(100).required().messages({
    'string.max': 'Title cannot exceed 100 characters',
    'any.required': 'Title is required',
  }),
  message: Joi.string().max(500).required().messages({
    'string.max': 'Message cannot exceed 500 characters',
    'any.required': 'Message is required',
  }),
  type: Joi.string()
    .valid('info', 'warning', 'error', 'success')
    .optional()
    .default('info')
    .messages({
      'any.only': 'Type must be one of: info, warning, error, success',
    }),
});

// ========== Routes (All Protected) ==========

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(apiLimiter);

// Register device token
router.post(
  '/register',
  validateRequest(registerDeviceBody, 'body'),
  NotificationController.registerDevice
);

// Unregister device token
router.delete(
  '/unregister',
  validateRequest(unregisterDeviceBody, 'body'),
  NotificationController.unregisterDevice
);

// Send test notification (development/testing only)
router.post(
  '/test',
  validateRequest(testNotificationBody, 'body'),
  NotificationController.sendTestNotification
);

// Get queue statistics
router.get('/queue/stats', NotificationController.getQueueStats);

module.exports = router;
