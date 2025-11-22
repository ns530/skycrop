import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateFieldHealth, addHealthAlert } from '../store/slices/healthSlice';
import { addRecommendation, updateRecommendationCount } from '../store/slices/recommendationsSlice';
import { addYieldPrediction } from '../store/slices/yieldSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
 * WebSocket Service for Real-Time Updates
 * Manages Socket.IO connection, events, and auto-reconnection
 */
class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private subscribedFields: Set<string> = new Set();

  /**
   * Connect to WebSocket server
   * @param token JWT authentication token
   */
  async connect(token?: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[WebSocket] Connection already in progress');
      return;
    }

    // Get token from AsyncStorage if not provided
    if (!token) {
      token = await AsyncStorage.getItem('auth_token');
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
   * Setup event listeners
   */
  private _setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected, Socket ID:', this.socket?.id);
      this.reconnectAttempts = 0;
      
      // Resubscribe to fields after reconnection
      this._resubscribeToFields();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      
      // Dispatch notification to UI
      store.dispatch(
        addNotification({
          id: `disconnect-${Date.now()}`,
          type: 'system',
          title: 'Connection Lost',
          message: 'Real-time updates temporarily unavailable',
          timestamp: new Date().toISOString(),
          read: false,
        })
      );
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnect attempts reached');
        store.dispatch(
          addNotification({
            id: `reconnect-failed-${Date.now()}`,
            type: 'error',
            title: 'Connection Failed',
            message: 'Unable to establish real-time connection',
            timestamp: new Date().toISOString(),
            read: false,
          })
        );
      }
    });

    // Field health events
    this.socket.on('health_updated', (data: any) => {
      console.log('[WebSocket] Health updated:', data);
      store.dispatch(updateFieldHealth(data));
      
      store.dispatch(
        addNotification({
          id: `health-${data.fieldId}-${Date.now()}`,
          type: 'health',
          title: 'Field Health Updated',
          message: `${data.fieldName}: Health score ${data.health.score} (${data.health.status})`,
          timestamp: new Date().toISOString(),
          read: false,
          fieldId: data.fieldId,
        })
      );
    });

    this.socket.on('health_alert', (data: any) => {
      console.log('[WebSocket] Health alert:', data);
      store.dispatch(addHealthAlert(data));
      
      store.dispatch(
        addNotification({
          id: `health-alert-${data.fieldId}-${Date.now()}`,
          type: 'alert',
          title: `${data.severity.toUpperCase()}: Field Health Alert`,
          message: `${data.fieldName}: ${data.message}`,
          timestamp: new Date().toISOString(),
          read: false,
          fieldId: data.fieldId,
          priority: data.severity === 'critical' ? 'high' : 'medium',
        })
      );
    });

    // Recommendation events
    this.socket.on('recommendations_updated', (data: any) => {
      console.log('[WebSocket] Recommendations updated:', data);
      store.dispatch(updateRecommendationCount(data));
    });

    this.socket.on('recommendation_created', (data: any) => {
      console.log('[WebSocket] Recommendation created:', data);
      store.dispatch(addRecommendation(data));
      
      store.dispatch(
        addNotification({
          id: `recommendation-${data.fieldId}-${Date.now()}`,
          type: 'recommendation',
          title: 'New Recommendations',
          message: `${data.fieldName}: ${data.message}`,
          timestamp: new Date().toISOString(),
          read: false,
          fieldId: data.fieldId,
          priority: data.recommendations?.some((r: any) => r.priority === 'critical') ? 'high' : 'medium',
        })
      );
    });

    // Yield prediction events
    this.socket.on('yield_prediction_ready', (data: any) => {
      console.log('[WebSocket] Yield prediction ready:', data);
      store.dispatch(addYieldPrediction(data));
      
      store.dispatch(
        addNotification({
          id: `yield-${data.fieldId}-${Date.now()}`,
          type: 'yield',
          title: 'Yield Prediction Ready',
          message: `${data.fieldName}: ${data.message}`,
          timestamp: new Date().toISOString(),
          read: false,
          fieldId: data.fieldId,
        })
      );
    });

    // Subscription confirmation events
    this.socket.on('subscribed', (data: { fieldId: string }) => {
      console.log('[WebSocket] Subscribed to field:', data.fieldId);
    });

    this.socket.on('unsubscribed', (data: { fieldId: string }) => {
      console.log('[WebSocket] Unsubscribed from field:', data.fieldId);
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;

