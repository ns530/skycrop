/**
 * Notification Service
 *
 * Manages browser push notifications with intelligent
 * prioritization and user preference handling.
 *
 * Features:
 * - Browser Notification API integration
 * - Permission management
 * - Priority-based notifications
 * - Notification history
 * - User preferences
 * - Offline queue
 */

// --------------------
// Types
// --------------------

export type NotificationType =
  | "health-alert" // Critical field health issues
  | "weather-warning" // Severe weather alerts
  | "recommendation" // AI recommendations
  | "yield-update" // Yield predictions
  | "system" // System messages
  | "general"; // General updates

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export interface NotificationPayload {
  id?: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  tag?: string; // For replacing notifications
  requireInteraction?: boolean; // Don't auto-dismiss
  timestamp?: number;
  fieldId?: string;
  url?: string; // Navigate to this URL on click
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  doNotDisturb: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "07:00"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface StoredNotification extends NotificationPayload {
  id: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

// --------------------
// Constants
// --------------------

const NOTIFICATION_STORAGE_KEY = "skycrop_notifications";
const PREFERENCES_STORAGE_KEY = "skycrop_notification_preferences";
const MAX_STORED_NOTIFICATIONS = 50;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false, // Requires explicit permission
  types: {
    "health-alert": true,
    "weather-warning": true,
    recommendation: true,
    "yield-update": true,
    system: true,
    general: false,
  },
  doNotDisturb: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  soundEnabled: true,
  vibrationEnabled: true,
};

// Icon map for notification types
const TYPE_ICONS: Record<NotificationType, string> = {
  "health-alert": "🚨",
  "weather-warning": "🌧️",
  recommendation: "🤖",
  "yield-update": "📊",
  system: "⚙️",
  general: "📰",
};

// --------------------
// Notification Service Class
// --------------------

class NotificationService {
  private preferences: NotificationPreferences;
  private notificationQueue: NotificationPayload[] = [];

  constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Check if notifications are supported by the browser
   */
  isSupported(): boolean {
    return "Notification" in window;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return "denied";
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Notifications not supported in this browser");
    }

    if (this.getPermission() === "granted") {
      return "granted";
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        this.preferences.enabled = true;
        this.savePreferences();

        // Show welcome notification
        this.send({
          type: "system",
          priority: "low",
          title: "🎉 Notifications Enabled!",
          body: "You'll now receive important alerts about your fields.",
        });
      }

      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  /**
   * Send a notification
   *
   * @param payload - Notification data
   * @returns Notification instance or null
   */
  async send(payload: NotificationPayload): Promise<Notification | null> {
    // Check if notifications are enabled
    if (!this.canSendNotification(payload)) {
      console.log("Notification blocked by preferences:", payload.type);
      return null;
    }

    // Check quiet hours
    if (this.isQuietHours() && payload.priority !== "critical") {
      console.log("Notification queued (quiet hours):", payload.title);
      this.queueNotification(payload);
      return null;
    }

    // Create stored notification record
    const storedNotif = this.storeNotification(payload);

    // Send browser notification
    try {
      const notification = await this.createBrowserNotification(payload);

      // Emit custom event for UI updates
      this.emitNotificationEvent(storedNotif);

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  }

  /**
   * Send multiple notifications at once
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<void> {
    for (const payload of payloads) {
      await this.send(payload);
      // Small delay to avoid spam
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * Create browser notification
   */
  private async createBrowserNotification(
    payload: NotificationPayload,
  ): Promise<Notification> {
    const options: NotificationOptions & {
      image?: string;
      vibrate?: number[];
    } = {
      body: payload.body,
      icon: payload.icon || this.getDefaultIcon(payload.type),
      badge: payload.badge,
      data: payload.data,
      tag: payload.tag || `${payload.type}-${Date.now()}`,
      requireInteraction:
        payload.requireInteraction || payload.priority === "critical",
      vibrate: this.preferences.vibrationEnabled ? [200, 100, 200] : undefined,
      silent: !this.preferences.soundEnabled,
      ...(payload.image && { image: payload.image }), // Add image only if provided (not all browsers support it)
    };

    const notification = new Notification(payload.title, options);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();

      // Navigate to URL if provided
      if (payload.url) {
        window.location.href = payload.url;
      } else if (payload.fieldId) {
        window.location.href = `/fields/${payload.fieldId}`;
      }
    };

    return notification;
  }

  /**
   * Check if notification can be sent based on preferences
   */
  private canSendNotification(payload: NotificationPayload): boolean {
    // Check browser permission
    if (this.getPermission() !== "granted") {
      return false;
    }

    // Check if notifications are enabled globally
    if (!this.preferences.enabled) {
      return false;
    }

    // Check do not disturb mode (except critical)
    if (this.preferences.doNotDisturb && payload.priority !== "critical") {
      return false;
    }

    // Check if this notification type is enabled
    if (!this.preferences.types[payload.type]) {
      return false;
    }

    return true;
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.preferences.quietHoursStart || !this.preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const start = this.preferences.quietHoursStart;
    const end = this.preferences.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }

    return currentTime >= start && currentTime <= end;
  }

  /**
   * Queue notification for later (e.g., during quiet hours)
   */
  private queueNotification(payload: NotificationPayload): void {
    this.notificationQueue.push(payload);

    // Limit queue size
    if (this.notificationQueue.length > 10) {
      this.notificationQueue.shift();
    }
  }

  /**
   * Process queued notifications
   */
  async processQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) {
      return;
    }

    console.log(
      `Processing ${this.notificationQueue.length} queued notifications`,
    );

    const queue = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const payload of queue) {
      await this.send(payload);
    }
  }

  /**
   * Store notification in local storage
   */
  private storeNotification(payload: NotificationPayload): StoredNotification {
    const stored: StoredNotification = {
      ...payload,
      id:
        payload.id ||
        `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: payload.timestamp || Date.now(),
      read: false,
      dismissed: false,
    };

    const notifications = this.getStoredNotifications();
    notifications.unshift(stored);

    // Keep only recent notifications
    const trimmed = notifications.slice(0, MAX_STORED_NOTIFICATIONS);

    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(trimmed));

    return stored;
  }

  /**
   * Get all stored notifications
   */
  getStoredNotifications(): StoredNotification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading stored notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notifications = this.getStoredNotifications();
    const notification = notifications.find((n) => n.id === id);

    if (notification) {
      notification.read = true;
      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notifications),
      );
      this.emitNotificationEvent(notification);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const notifications = this.getStoredNotifications();
    notifications.forEach((n) => (n.read = true));
    localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(notifications),
    );
    this.emitNotificationEvent(null);
  }

  /**
   * Dismiss notification
   */
  dismissNotification(id: string): void {
    const notifications = this.getStoredNotifications();
    const notification = notifications.find((n) => n.id === id);

    if (notification) {
      notification.dismissed = true;
      localStorage.setItem(
        NOTIFICATION_STORAGE_KEY,
        JSON.stringify(notifications),
      );
      this.emitNotificationEvent(notification);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify([]));
    this.emitNotificationEvent(null);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.getStoredNotifications().filter((n) => !n.read && !n.dismissed)
      .length;
  }

  /**
   * Load user preferences
   */
  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
    return DEFAULT_PREFERENCES;
  }

  /**
   * Save user preferences
   */
  savePreferences(preferences?: Partial<NotificationPreferences>): void {
    if (preferences) {
      this.preferences = { ...this.preferences, ...preferences };
    }
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(this.preferences),
    );
    this.emitNotificationEvent(null);
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get default icon for notification type
   */
  private getDefaultIcon(type: NotificationType): string {
    // Return emoji as data URI (for browsers that support it)
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">${TYPE_ICONS[type]}</text></svg>`;
  }

  /**
   * Emit custom event for UI updates
   */
  private emitNotificationEvent(notification: StoredNotification | null): void {
    window.dispatchEvent(
      new CustomEvent("skycrop:notification", {
        detail: { notification, count: this.getUnreadCount() },
      }),
    );
  }

  /**
   * Initialize service (call on app startup)
   */
  async initialize(): Promise<void> {
    // Check if permission was previously granted
    if (this.getPermission() === "granted" && !this.preferences.enabled) {
      this.preferences.enabled = true;
      this.savePreferences();
    }

    // Process any queued notifications
    await this.processQueue();
  }
}

// --------------------
// Singleton Instance
// --------------------

export const notificationService = new NotificationService();

// --------------------
// Helper Functions
// --------------------

/**
 * Quick send notification (simplified API)
 */
export const sendNotification = (
  title: string,
  body: string,
  options?: Partial<NotificationPayload>,
): Promise<Notification | null> => {
  return notificationService.send({
    type: options?.type || "general",
    priority: options?.priority || "medium",
    title,
    body,
    ...options,
  });
};

/**
 * Send health alert notification
 */
export const sendHealthAlert = (
  fieldName: string,
  message: string,
  fieldId: string,
  priority: NotificationPriority = "high",
): Promise<Notification | null> => {
  return notificationService.send({
    type: "health-alert",
    priority,
    title: `🚨 ${fieldName} Health Alert`,
    body: message,
    fieldId,
    url: `/fields/${fieldId}/health`,
    requireInteraction: priority === "critical",
  });
};

/**
 * Send weather warning notification
 */
export const sendWeatherWarning = (
  title: string,
  message: string,
  priority: NotificationPriority = "high",
): Promise<Notification | null> => {
  return notificationService.send({
    type: "weather-warning",
    priority,
    title: `🌧️ ${title}`,
    body: message,
    url: "/weather",
    requireInteraction: priority === "critical",
  });
};

/**
 * Send recommendation notification
 */
export const sendRecommendationNotification = (
  fieldName: string,
  recommendation: string,
  fieldId: string,
  priority: NotificationPriority = "medium",
): Promise<Notification | null> => {
  return notificationService.send({
    type: "recommendation",
    priority,
    title: `🤖 ${fieldName} - New Recommendation`,
    body: recommendation,
    fieldId,
    url: `/fields/${fieldId}/recommendations`,
  });
};

// Initialize on module load
notificationService.initialize().catch(console.error);
