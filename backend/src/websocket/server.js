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
      origin: process.env.CORSORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth;

      if (!token) {
        logger.warn('websocket.auth.notoken', {
          socketId: socket.id,
          ip: socket.handshake.address,
        });
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWTSECRET);

      // Attach user info to socket
      socket.user_id = decoded.user_id; // Fixed: JWT payload uses user_id, not user_id
      socket.userEmail = decoded.email;

      logger.info('websocket.auth.success', {
        socketId: socket.id,
        user_id: socket.user_id,
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
  io.on('connection', socket => {
    const { user_id } = socket;

    logger.info('websocket.client.connected', {
      socketId: socket.id,
      user_id,
      email: socket.userEmail,
    });

    // Join user-specific room for targeted notifications
    socket.join(`user:${user_id}`);

    // Subscribe to field updates
    socket.on('subscribefield', field_id => {
      socket.join(`field:${field_id}`);
      logger.info('websocket.subscribe.field', {
        socketId: socket.id,
        user_id,
        field_id,
      });
      socket.emit('subscribed', { field_id });
    });

    // Unsubscribe from field updates
    socket.on('unsubscribefield', field_id => {
      socket.leave(`field:${field_id}`);
      logger.info('websocket.unsubscribe.field', {
        socketId: socket.id,
        user_id,
        field_id,
      });
      socket.emit('unsubscribed', { field_id });
    });

    // Handle custom ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handler
    socket.on('disconnect', reason => {
      logger.info('websocket.client.disconnected', {
        socketId: socket.id,
        user_id,
        reason,
      });
    });

    // Error handler
    socket.on('error', error => {
      logger.error('websocket.client.error', {
        socketId: socket.id,
        user_id,
        error: error.message,
        stack: error.stack,
      });
    });
  });

  // Store io instance globally for use in services
  global.io = io;

  logger.info('websocket.server.initialized', {
    cors: process.env.CORSORIGIN || '*',
  });

  return io;
}

/**
 * Emit event to a specific user
 * @param {string} user_id - User ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToUser(user_id, event, data) {
  if (!global.io) {
    logger.warn('websocket.emit.noio', { user_id, event });
    return;
  }

  global.io.to(`user:${user_id}`).emit(event, data);

  logger.debug('websocket.emit.user', {
    user_id,
    event,
    dataKeys: Object.keys(data || {}),
  });
}

/**
 * Emit event to all subscribers of a field
 * @param {string} field_id - Field ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function emitToField(field_id, event, data) {
  if (!global.io) {
    logger.warn('websocket.emit.noio', { field_id, event });
    return;
  }

  global.io.to(`field:${field_id}`).emit(event, data);

  logger.debug('websocket.emit.field', {
    field_id,
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
    logger.warn('websocket.emit.noio', { event });
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
