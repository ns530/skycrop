import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

import { Notification } from '../components/NotificationBell';
import { useToast } from '../hooks/useToast';
import { websocketService } from '../services/websocket';

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

interface YieldPredictionReadyEvent {
  fieldId: string;
  fieldName: string;
  message: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
}

/**
 * Notifications Provider
 * Manages notification state and WebSocket integration
 */
export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { showToast } = useToast();

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  // Mark as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    const handleHealthUpdated = (data: HealthUpdatedEvent) => {
      addNotification({
        type: 'health',
        title: 'Field Health Updated',
        message: `${data.fieldName}: Health score ${data.health?.score || 'N/A'} (${data.health?.status || 'unknown'})`,
        timestamp: new Date().toISOString(),
        read: false,
        fieldId: data.fieldId,
        fieldName: data.fieldName,
      });
    };

    const handleHealthAlert = (data: HealthAlertEvent) => {
      addNotification({
        type: 'alert',
        title: `${data.severity?.toUpperCase() || 'ALERT'}: Field Health Alert`,
        message: `${data.fieldName}: ${data.message}`,
        timestamp: new Date().toISOString(),
        read: false,
        fieldId: data.fieldId,
        fieldName: data.fieldName,
        priority: data.severity === 'critical' ? 'high' : 'medium',
      });

      // Show toast for critical alerts
      if (data.severity === 'critical') {
        showToast({
          variant: 'error',
          title: 'Critical Field Health Alert',
          description: `${data.fieldName}: ${data.message}`,
        });
      }
    };

    const handleRecommendationCreated = (data: RecommendationCreatedEvent) => {
      addNotification({
        type: 'recommendation',
        title: 'New Recommendations',
        message: `${data.fieldName}: ${data.message}`,
        timestamp: new Date().toISOString(),
        read: false,
        fieldId: data.fieldId,
        fieldName: data.fieldName,
        priority: data.recommendations?.some((r) => r.priority === 'critical') ? 'high' : 'medium',
      });
    };

    const handleYieldPredictionReady = (data: YieldPredictionReadyEvent) => {
      addNotification({
        type: 'yield',
        title: 'Yield Prediction Ready',
        message: `${data.fieldName}: ${data.message}`,
        timestamp: new Date().toISOString(),
        read: false,
        fieldId: data.fieldId,
        fieldName: data.fieldName,
      });
    };

    const handleDisconnect = (data: { reason: string }) => {
      if (data.reason !== 'io client disconnect') {
        addNotification({
          type: 'system',
          title: 'Connection Lost',
          message: 'Real-time updates temporarily unavailable',
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
    };

    const handleConnect = () => {
      addNotification({
        type: 'system',
        title: 'Connected',
        message: 'Real-time updates enabled',
        timestamp: new Date().toISOString(),
        read: false,
      });
    };

    websocketService.on('health_updated', handleHealthUpdated);
    websocketService.on('health_alert', handleHealthAlert);
    websocketService.on('recommendation_created', handleRecommendationCreated);
    websocketService.on('yield_prediction_ready', handleYieldPredictionReady);
    websocketService.on('disconnect', handleDisconnect);
    websocketService.on('connect', handleConnect);

    return () => {
      websocketService.off('health_updated', handleHealthUpdated);
      websocketService.off('health_alert', handleHealthAlert);
      websocketService.off('recommendation_created', handleRecommendationCreated);
      websocketService.off('yield_prediction_ready', handleYieldPredictionReady);
      websocketService.off('disconnect', handleDisconnect);
      websocketService.off('connect', handleConnect);
    };
  }, [addNotification, showToast]);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

/**
 * Hook to use notifications context
 */
export const useNotifications = (): NotificationsContextValue => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

export default NotificationsProvider;

