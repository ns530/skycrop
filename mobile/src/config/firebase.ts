/**
 * Firebase Configuration
 * 
 * Initialize Firebase services for push notifications and analytics
 */

import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted:', authStatus);
    }

    return enabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Subscribe to topic
 */
export const subscribeToTopic = async (topic: string): Promise<void> => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
};

/**
 * Unsubscribe from topic
 */
export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
  }
};

/**
 * Log analytics event
 */
export const logEvent = async (eventName: string, params?: { [key: string]: any }): Promise<void> => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = async (properties: { [key: string]: string }): Promise<void> => {
  try {
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, value);
    }
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
};

