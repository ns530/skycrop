import { useEffect, useCallback, useRef } from 'react';

import { websocketService } from '../services/websocket';

import { useToast } from './useToast';

interface HealthUpdatedEvent {
  fieldId: string;
  fieldName: string;
  health: {
    score: number;
    status: string;
  };
}

interface HealthAlertEvent {
  fieldId: string;
  fieldName: string;
  message: string;
  severity: string;
}

interface RecommendationCreatedEvent {
  fieldId: string;
  fieldName: string;
  message: string;
  recommendations: Array<{
    priority: string;
  }>;
}

interface RecommendationsUpdatedEvent {
  fieldId: string;
  fieldName: string;
  message: string;
}

interface YieldPredictionReadyEvent {
  fieldId: string;
  fieldName: string;
  message: string;
}

interface UseWebSocketOptions {
  onHealthUpdated?: (data: HealthUpdatedEvent) => void;
  onHealthAlert?: (data: HealthAlertEvent) => void;
  onRecommendationsUpdated?: (data: RecommendationsUpdatedEvent) => void;
  onRecommendationCreated?: (data: RecommendationCreatedEvent) => void;
  onYieldPredictionReady?: (data: YieldPredictionReadyEvent) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  showToasts?: boolean; // Show toast notifications for events
}

/**
 * React Hook for WebSocket Real-Time Updates
 * Manages connection lifecycle and event subscriptions
 * 
 * @example
 * ```tsx
 * const { subscribeToField, unsubscribeFromField, isConnected } = useWebSocket({
 *   onHealthUpdated: (data) => {
 *     console.log('Health updated:', data);
 *     // Update UI or state
 *   },
 *   onRecommendationCreated: (data) => {
 *     console.log('New recommendation:', data);
 *   },
 *   showToasts: true,
 * });
 * 
 * // Subscribe to field when viewing field details
 * useEffect(() => {
 *   if (fieldId) {
 *     subscribeToField(fieldId);
 *     return () => unsubscribeFromField(fieldId);
 *   }
 * }, [fieldId]);
 * ```
 */
export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { showToast } = useToast();
  const callbacksRef = useRef(options);

  // Update callbacks ref when options change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Setup event listeners
  useEffect(() => {
    const {
      onHealthUpdated,
      onHealthAlert,
      onRecommendationsUpdated,
      onRecommendationCreated,
      onYieldPredictionReady,
      onConnect,
      onDisconnect,
      onError,
      showToasts = false,
    } = callbacksRef.current;

    // Health events
    if (onHealthUpdated) {
      const handler = (data: any) => {
        onHealthUpdated(data);
        if (showToasts) {
          showToast({
            variant: 'success',
            title: 'Field Health Updated',
            description: `${data.fieldName}: Health score ${data.health.score}`,
          });
        }
      };
      websocketService.on('health_updated', handler);
    }

    if (onHealthAlert) {
      const handler = (data: any) => {
        onHealthAlert(data);
        if (showToasts) {
          showToast({
            variant: data.severity === 'critical' ? 'error' : 'warning',
            title: 'Field Health Alert',
            description: `${data.fieldName}: ${data.message}`,
          });
        }
      };
      websocketService.on('health_alert', handler);
    }

    // Recommendation events
    if (onRecommendationsUpdated) {
      const handler = (data: any) => {
        onRecommendationsUpdated(data);
      };
      websocketService.on('recommendations_updated', handler);
    }

    if (onRecommendationCreated) {
      const handler = (data: any) => {
        onRecommendationCreated(data);
        if (showToasts) {
          showToast({
            variant: 'success',
            title: 'New Recommendations',
            description: `${data.fieldName}: ${data.message}`,
          });
        }
      };
      websocketService.on('recommendation_created', handler);
    }

    // Yield prediction events
    if (onYieldPredictionReady) {
      const handler = (data: any) => {
        onYieldPredictionReady(data);
        if (showToasts) {
          showToast({
            variant: 'success',
            title: 'Yield Prediction Ready',
            description: `${data.fieldName}: ${data.message}`,
          });
        }
      };
      websocketService.on('yield_prediction_ready', handler);
    }

    // Connection events
    if (onConnect) {
      const handler = () => {
        onConnect();
        if (showToasts) {
          showToast({
            variant: 'success',
            title: 'Connected',
            description: 'Real-time updates enabled',
          });
        }
      };
      websocketService.on('connect', handler);
    }

    if (onDisconnect) {
      const handler = (data: { reason: string }) => {
        onDisconnect(data.reason);
        if (showToasts && data.reason !== 'io client disconnect') {
          showToast({
            variant: 'warning',
            title: 'Connection Lost',
            description: 'Real-time updates temporarily unavailable',
          });
        }
      };
      websocketService.on('disconnect', handler);
    }

    if (onError) {
      const handler = (data: { error: Error }) => {
        onError(data.error);
      };
      websocketService.on('connect_error', handler);
    }

    // Cleanup: Remove event listeners on unmount
    return () => {
      if (onHealthUpdated) websocketService.off('health_updated', onHealthUpdated);
      if (onHealthAlert) websocketService.off('health_alert', onHealthAlert);
      if (onRecommendationsUpdated) websocketService.off('recommendations_updated', onRecommendationsUpdated);
      if (onRecommendationCreated) websocketService.off('recommendation_created', onRecommendationCreated);
      if (onYieldPredictionReady) websocketService.off('yield_prediction_ready', onYieldPredictionReady);
      if (onConnect) websocketService.off('connect', onConnect);
      if (onDisconnect) websocketService.off('disconnect', onDisconnect);
      if (onError) websocketService.off('connect_error', onError);
    };
  }, []); // Only run once on mount

  const subscribeToField = useCallback((fieldId: string) => {
    websocketService.subscribeToField(fieldId);
  }, []);

  const unsubscribeFromField = useCallback((fieldId: string) => {
    websocketService.unsubscribeFromField(fieldId);
  }, []);

  const isConnected = useCallback(() => {
    return websocketService.isConnected();
  }, []);

  return {
    subscribeToField,
    unsubscribeFromField,
    isConnected,
  };
};

export default useWebSocket;

