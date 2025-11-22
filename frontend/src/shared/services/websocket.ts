import { io, Socket } from 'socket.io-client';
import { env } from '../../config/env';

const API_URL = env.API_BASE_URL.replace('/api/v1', ''); // Remove /api/v1 for WebSocket connection

interface WebSocketEvents {
  health_updated: (data: any) => void;
  health_alert: (data: any) => void;
  recommendations_updated: (data: any) => void;
  recommendation_created: (data: any) => void;
  yield_prediction_ready: (data: any) => void;
  subscribed: (data: { fieldId: string }) => void;
  unsubscribed: (data: { fieldId: string }) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
}

/**
 * WebSocket Service for Real-Time Updates (Web)
 * Manages Socket.IO connection, events, and auto-reconnection
 */
class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private subscribedFields: Set<string> = new Set();
  private eventCallbacks: Map<string, Set<Function>> = new Map();

  /**
   * Connect to WebSocket server
   * @param token JWT authentication token
   */
  async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[WebSocket] Connection already in progress');
      return;
    }

    if (!token) {
      console.warn('[WebSocket] No authentication token available');
      return;
    }

    this.token = token;
    this.isConnecting = true;

    try {
      console.log('[WebSocket] Connecting to', API_URL);

      this.socket = io(API_URL, {
        auth: { token: this.token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this._setupEventListeners();
      
      this.isConnecting = false;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.subscribedFields.clear();
      this.eventCallbacks.clear();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Subscribe to field updates
   * @param fieldId Field ID to subscribe to
   */
  subscribeToField(fieldId: string): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Not connected, cannot subscribe to field');
      return;
    }

    console.log('[WebSocket] Subscribing to field:', fieldId);
    this.socket.emit('subscribe_field', fieldId);
    this.subscribedFields.add(fieldId);
  }

  /**
   * Unsubscribe from field updates
   * @param fieldId Field ID to unsubscribe from
   */
  unsubscribeFromField(fieldId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log('[WebSocket] Unsubscribing from field:', fieldId);
    this.socket.emit('unsubscribe_field', fieldId);
    this.subscribedFields.delete(fieldId);
  }

  /**
   * Register event listener
   * @param event Event name
   * @param callback Callback function
   */
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);

    // Also attach to socket if connected
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Unregister event listener
   * @param event Event name
   * @param callback Callback function
   */
  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.eventCallbacks.delete(event);
      }
    }

    // Also remove from socket
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Resubscribe to all previously subscribed fields
   * Used after reconnection
   */
  private _resubscribeToFields(): void {
    if (!this.socket?.connected || this.subscribedFields.size === 0) {
      return;
    }

    console.log('[WebSocket] Resubscribing to', this.subscribedFields.size, 'fields');
    this.subscribedFields.forEach((fieldId) => {
      this.socket?.emit('subscribe_field', fieldId);
    });
  }

  /**
   * Re-attach event listeners after reconnection
   */
  private _reattachEventListeners(): void {
    if (!this.socket) return;

    this.eventCallbacks.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback as any);
      });
    });
  }

  /**
   * Setup core event listeners
   */
  private _setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected, Socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Resubscribe to fields and re-attach event listeners after reconnection
      this._resubscribeToFields();
      this._reattachEventListeners();

      // Notify registered connect callbacks
      this._triggerCallbacks('connect', {});
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      
      // Notify registered disconnect callbacks
      this._triggerCallbacks('disconnect', { reason });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnect attempts reached');
      }

      // Notify registered error callbacks
      this._triggerCallbacks('connect_error', { error });
    });

    // Health events
    this.socket.on('health_updated', (data: any) => {
      console.log('[WebSocket] Health updated:', data);
      this._triggerCallbacks('health_updated', data);
    });

    this.socket.on('health_alert', (data: any) => {
      console.log('[WebSocket] Health alert:', data);
      this._triggerCallbacks('health_alert', data);
    });

    // Recommendation events
    this.socket.on('recommendations_updated', (data: any) => {
      console.log('[WebSocket] Recommendations updated:', data);
      this._triggerCallbacks('recommendations_updated', data);
    });

    this.socket.on('recommendation_created', (data: any) => {
      console.log('[WebSocket] Recommendation created:', data);
      this._triggerCallbacks('recommendation_created', data);
    });

    // Yield prediction events
    this.socket.on('yield_prediction_ready', (data: any) => {
      console.log('[WebSocket] Yield prediction ready:', data);
      this._triggerCallbacks('yield_prediction_ready', data);
    });

    // Subscription confirmation events
    this.socket.on('subscribed', (data: { fieldId: string }) => {
      console.log('[WebSocket] Subscribed to field:', data.fieldId);
      this._triggerCallbacks('subscribed', data);
    });

    this.socket.on('unsubscribed', (data: { fieldId: string }) => {
      console.log('[WebSocket] Unsubscribed from field:', data.fieldId);
      this._triggerCallbacks('unsubscribed', data);
    });
  }

  /**
   * Trigger registered callbacks for an event
   */
  private _triggerCallbacks(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in ${event} callback:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

