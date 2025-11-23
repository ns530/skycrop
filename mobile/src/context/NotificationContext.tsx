/**
 * NotificationContext - MVP Stub Version
 * 
 * This is a no-op version for MVP deployment without push notifications
 * Will be replaced with full Firebase/Notifee integration in v1.1
 */

import React, { createContext, useContext, useState } from 'react';

interface NotificationContextType {
  fcmToken: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  unregisterDevice: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fcmToken] = useState<string | null>(null);
  const [hasPermission] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    console.log('[MVP] Notification permission (stub) - will be added in v1.1');
    return false;
  };

  const unregisterDevice = async () => {
    console.log('[MVP] Unregister device (stub) - will be added in v1.1');
  };

  const value: NotificationContextType = {
    fcmToken,
    hasPermission,
    requestPermission,
    unregisterDevice,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
