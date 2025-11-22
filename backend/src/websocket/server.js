'use strict';

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

/**
 * Initialize WebSocket Server with Socket.IO
 * @param {http.Server} server - HTTP server instance
 * @returns {SocketIO.Server} - Socket.IO server instance
 */
function initializeWebSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.warn('websocket.auth.no_token', {
          socketId: socket.id,
          ip: socket.handshake.address,
        });
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to socket
      socket.userId = decoded.user_id; // Fixed: JWT payload uses user_id, not userId
      socket.userEmail = decoded.email;

      logger.info('websocket.auth.success', {
        socketId: socket.id,
        userId: socket.userId,
        email: socket.userEmail,
      });

      next();
    } catch (error) {
      logger.error('websocket.auth.failed', {
        socketId: socket.id,
        error: error.message,
        stack: error.stack,
      });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    logger.info('websocket.client.connected', {
      socketId: socket.id,
      userId,
      email: socket.userEmail,
    });

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    // Subscribe to field updates
    socket.on('subscribe_field', (fieldId) => {
      socket.join(`field:${fieldId}`);
      logger.info('websocket.subscribe.field', {
        socketId: socket.id,
        userId,
        fieldId,
      });
      socket.emit('subscribed', { fieldId });
    });

    // Unsubscribe from field updates
    socket.on('unsubscribe_field', (fieldId) => {
      socket.leave(`field:${fieldId}`);
      logger.info('websocket.unsubscribe.field', {
        socketId: socket.id,
        userId,
        fieldId,
      });
      socket.emit('unsubscribed', { fieldId });
    });

    // Handle custom ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info('websocket.client.disconnected', {
        socketId: socket.id,
        userId,
        reason,
      });
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error('websocket.client.error', {
        socketId: socket.id,
        userId,
        error: error.message,
        stack: error.stack,
      });
    });
  });

  // Store io instance globally for use in services
  global.io = io;

  logger.info('websocket.server.initialized', {
    cors: process.env.CORS_ORIGIN || '*',
  });

  return io;
}

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToUser(userId, event, data) {
  if (!global.io) {
    logger.warn('websocket.emit.no_io', { userId, event });
    return;
  }

  global.io.to(`user:${userId}`).emit(event, data);
  
  logger.debug('websocket.emit.user', {
    userId,
    event,
    dataKeys: Object.keys(data || {}),
  });
}

/**
 * Emit event to all subscribers of a field
 * @param {string} fieldId - Field ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToField(fieldId, event, data) {
  if (!global.io) {
    logger.warn('websocket.emit.no_io', { fieldId, event });
    return;
  }

  global.io.to(`field:${fieldId}`).emit(event, data);
  
  logger.debug('websocket.emit.field', {
    fieldId,
    event,
    dataKeys: Object.keys(data || {}),
  });
}

/**
 * Broadcast event to all connected clients
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function broadcastEvent(event, data) {
  if (!global.io) {
    logger.warn('websocket.emit.no_io', { event });
    return;
  }

  global.io.emit(event, data);
  
  logger.debug('websocket.emit.broadcast', {
    event,
    dataKeys: Object.keys(data || {}),
  });
}

/**
 * Get number of connected clients
 * @returns {number} - Number of connected clients
 */
function getConnectedClientsCount() {
  if (!global.io) {
    return 0;
  }
  return global.io.sockets.sockets.size;
}

/**
 * Get Socket.IO server instance
 * @returns {SocketIO.Server|null} - Socket.IO server instance or null
 */
function getIO() {
  return global.io || null;
}

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitToField,
  broadcastEvent,
  getConnectedClientsCount,
  getIO,
};

