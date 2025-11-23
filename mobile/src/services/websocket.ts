/**
 * WebSocket Service - MVP Stub Version
 * 
 * This is a placeholder for MVP deployment
 * Will be fully implemented in v1.1 with Redux store integration
 */

import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';

let socket: Socket | null = null;

/**
 * Connect to WebSocket server
 */
export const connectWebSocket = (token: string): void => {
  console.log('[MVP] WebSocket connection (stub) - will be fully implemented in v1.1');
  
  try {
    const wsUrl = API_BASE_URL.replace('/api/v1', '').replace('http', 'ws');
    
    socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[MVP] WebSocket connected (stub)');
    });

    socket.on('disconnect', () => {
      console.log('[MVP] WebSocket disconnected (stub)');
    });

    socket.on('error', (error) => {
      console.error('[MVP] WebSocket error (stub):', error);
    });
  } catch (error) {
    console.error('[MVP] WebSocket connection error (stub):', error);
  }
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectWebSocket = (): void => {
  console.log('[MVP] WebSocket disconnect (stub)');
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Subscribe to field updates
 */
export const subscribeToFieldUpdates = (fieldId: string): void => {
  console.log(`[MVP] Subscribe to field ${fieldId} (stub) - will be implemented in v1.1`);
};

/**
 * Unsubscribe from field updates
 */
export const unsubscribeFromFieldUpdates = (fieldId: string): void => {
  console.log(`[MVP] Unsubscribe from field ${fieldId} (stub) - will be implemented in v1.1`);
};

/**
 * Get WebSocket connection status
 */
export const isWebSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};
