/**
 * NotificationContext - Push Notification Management
 * 
 * Handles Firebase Cloud Messaging and local notifications
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  fcmToken: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  unregisterDevice: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const FCM_TOKEN_KEY = 'skycrop_fcm_token';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    initializeNotifications();
    setupNotificationHandlers();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Check existing permission
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        setHasPermission(true);
        await getFCMToken();
      }

      // Request permission on Android
      if (Platform.OS === 'android') {
        await requestAndroidPermission();
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const requestAndroidPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      // iOS permission request
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          setHasPermission(true);
          await getFCMToken();
          return true;
        }
      }

      // Android permission request
      if (Platform.OS === 'android') {
        const granted = await requestAndroidPermission();
        if (granted) {
          setHasPermission(true);
          await getFCMToken();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const getFCMToken = async () => {
    try {
      // Get FCM token
      const token = await messaging().getToken();
      
      if (token) {
        setFcmToken(token);
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('FCM Token:', token);
        
        // TODO: Send token to backend for registration
        // await notificationApi.registerDevice(token);
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  };

  const unregisterDevice = async () => {
    try {
      if (fcmToken) {
        // TODO: Unregister from backend
        // await notificationApi.unregisterDevice(fcmToken);
        
        await messaging().deleteToken();
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        setFcmToken(null);
      }
    } catch (error) {
      console.error('Error unregistering device:', error);
    }
  };

  const setupNotificationHandlers = () => {
    // Foreground message handler
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      
      // Display notification using Notifee
      await displayNotification(remoteMessage);
    });

    // Background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      await displayNotification(remoteMessage);
    });

    // Token refresh handler
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('Token refreshed:', newToken);
      setFcmToken(newToken);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      
      // TODO: Update token on backend
      // await notificationApi.updateToken(newToken);
    });

    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  };

  const displayNotification = async (remoteMessage: any) => {
    try {
      // Create notification channel (Android only)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display notification
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'SkyCrop',
        body: remoteMessage.notification?.body || '',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
        data: remoteMessage.data,
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
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

