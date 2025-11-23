/**
 * Firebase Configuration - MVP Stub Version
 * 
 * This is a no-op version for MVP deployment without Firebase
 * Will be replaced with full Firebase integration in v1.1
 */

/**
 * Request notification permission (stub)
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  console.log('[MVP] Notification permission (stub) - will be added in v1.1');
  return false;
};

/**
 * Get FCM token (stub)
 */
export const getFCMToken = async (): Promise<string | null> => {
  console.log('[MVP] FCM Token (stub) - will be added in v1.1');
  return null;
};

/**
 * Subscribe to topic (stub)
 */
export const subscribeToTopic = async (topic: string): Promise<void> => {
  console.log(`[MVP] Subscribe to topic ${topic} (stub) - will be added in v1.1`);
};

/**
 * Unsubscribe from topic (stub)
 */
export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  console.log(`[MVP] Unsubscribe from topic ${topic} (stub) - will be added in v1.1`);
};

/**
 * Log analytics event (stub)
 */
export const logEvent = async (eventName: string, params?: { [key: string]: any }): Promise<void> => {
  console.log(`[MVP] Analytics event ${eventName} (stub) - will be added in v1.1`, params);
};

/**
 * Set user properties (stub)
 */
export const setUserProperties = async (properties: { [key: string]: string }): Promise<void> => {
  console.log('[MVP] Set user properties (stub) - will be added in v1.1', properties);
};
