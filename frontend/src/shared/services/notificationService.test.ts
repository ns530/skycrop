/**
 * Tests for Notification Service
 */

import {
  notificationService,
  sendNotification,
  sendHealthAlert,
  sendWeatherWarning,
  sendRecommendationNotification,
} from "./notificationService";

// Mock Notification API
global.Notification = jest.fn().mockImplementation((title, options) => ({
  title,
  ...options,
  close: jest.fn(),
  onclick: null,
})) as unknown as jest.Mocked<typeof Notification>;

(
  global.Notification as unknown as { permission: NotificationPermission }
).permission = "default";
(
  global.Notification as unknown as { requestPermission: jest.Mock }
).requestPermission = jest.fn().mockResolvedValue("granted");

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn();

describe("Notification Service", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();

    // Reset to default permission
    (
      global.Notification as unknown as { permission: NotificationPermission }
    ).permission = "default";
  });

  describe("isSupported", () => {
    it("should return true when Notification API is available", () => {
      expect(notificationService.isSupported()).toBe(true);
    });
  });

  describe("getPermission", () => {
    it("should return current notification permission", () => {
      (
        global.Notification as unknown as { permission: NotificationPermission }
      ).permission = "granted";
      expect(notificationService.getPermission()).toBe("granted");
    });
  });

  describe("requestPermission", () => {
    it("should request permission from user", async () => {
      const permission = await notificationService.requestPermission();

      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe("granted");
    });

    it("should enable notifications when permission granted", async () => {
      await notificationService.requestPermission();

      const preferences = notificationService.getPreferences();
      expect(preferences.enabled).toBe(true);
    });
  });

  describe("send", () => {
    beforeEach(() => {
      (
        global.Notification as unknown as { permission: NotificationPermission }
      ).permission = "granted";
      // Enable all notification types
      notificationService.savePreferences({
        enabled: true,
        types: {
          "health-alert": true,
          "weather-warning": true,
          recommendation: true,
          "yield-update": true,
          system: true,
          general: true,
        },
      });
    });

    it("should send a notification", async () => {
      const notification = await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test Notification",
        body: "This is a test",
      });

      expect(notification).toBeTruthy();
      expect(global.Notification).toHaveBeenCalledWith(
        "Test Notification",
        expect.objectContaining({
          body: "This is a test",
        }),
      );
    });

    it("should store notification in history", async () => {
      await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test",
        body: "Test body",
      });

      const stored = notificationService.getStoredNotifications();
      expect(stored.length).toBe(1);
      expect(stored[0].title).toBe("Test");
    });

    it("should not send if notifications disabled", async () => {
      notificationService.savePreferences({ enabled: false });

      const notification = await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test",
        body: "Test body",
      });

      expect(notification).toBeNull();
    });

    it("should not send if notification type disabled", async () => {
      notificationService.savePreferences({
        enabled: true,
        types: {
          "health-alert": false,
          "weather-warning": true,
          recommendation: true,
          "yield-update": true,
          system: true,
          general: false,
        },
      });

      const notification = await notificationService.send({
        type: "health-alert",
        priority: "high",
        title: "Health Alert",
        body: "Test",
      });

      expect(notification).toBeNull();
    });

    it("should send critical notifications even in Do Not Disturb mode", async () => {
      notificationService.savePreferences({
        enabled: true,
        doNotDisturb: true,
      });

      const notification = await notificationService.send({
        type: "health-alert",
        priority: "critical",
        title: "Critical Alert",
        body: "Urgent",
      });

      expect(notification).toBeTruthy();
    });
  });

  describe("markAsRead", () => {
    beforeEach(() => {
      (
        global.Notification as unknown as { permission: NotificationPermission }
      ).permission = "granted";
      notificationService.savePreferences({
        enabled: true,
        types: {
          "health-alert": true,
          "weather-warning": true,
          recommendation: true,
          "yield-update": true,
          system: true,
          general: true,
        },
      });
    });

    it("should mark notification as read", async () => {
      await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test",
        body: "Test",
      });

      const stored = notificationService.getStoredNotifications();
      expect(stored.length).toBeGreaterThan(0);
      const id = stored[0].id;

      notificationService.markAsRead(id);

      const updated = notificationService.getStoredNotifications();
      expect(updated[0].read).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    beforeEach(() => {
      (
        global.Notification as unknown as { permission: NotificationPermission }
      ).permission = "granted";
      notificationService.savePreferences({
        enabled: true,
        types: {
          "health-alert": true,
          "weather-warning": true,
          recommendation: true,
          "yield-update": true,
          system: true,
          general: true,
        },
      });
    });

    it("should mark all notifications as read", async () => {
      await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test 1",
        body: "Test",
      });

      await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test 2",
        body: "Test",
      });

      notificationService.markAllAsRead();

      const stored = notificationService.getStoredNotifications();
      expect(stored.every((n) => n.read)).toBe(true);
    });
  });

  describe("getUnreadCount", () => {
    beforeEach(() => {
      (
        global.Notification as unknown as { permission: NotificationPermission }
      ).permission = "granted";
      notificationService.savePreferences({
        enabled: true,
        types: {
          "health-alert": true,
          "weather-warning": true,
          recommendation: true,
          "yield-update": true,
          system: true,
          general: true,
        },
      });
    });

    it("should return count of unread notifications", async () => {
      // Clear any existing notifications first
      notificationService.clearAll();
      
      await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test 1",
        body: "Test",
      });

      await notificationService.send({
        type: "system",
        priority: "medium",
        title: "Test 2",
        body: "Test",
      });

      const stored = notificationService.getStoredNotifications();
      expect(stored.length).toBe(2);
      expect(notificationService.getUnreadCount()).toBe(2);

      notificationService.markAsRead(stored[0].id);

      expect(notificationService.getUnreadCount()).toBe(1);
    });
  });

  describe("helper functions", () => {
    beforeEach(() => {
      (
        global.Notification as unknown as { permission: NotificationPermission }
      ).permission = "granted";
      notificationService.savePreferences({
        enabled: true,
        types: {
          "health-alert": true,
          "weather-warning": true,
          recommendation: true,
          "yield-update": true,
          system: true,
          general: true,
        },
      });
      // Clear any existing notifications
      notificationService.clearAll();
    });

    it("sendNotification should send a notification", async () => {
      const notification = await sendNotification("Title", "Body");
      expect(notification).toBeTruthy();
      
      const stored = notificationService.getStoredNotifications();
      expect(stored.length).toBeGreaterThan(0);
    });

    it("sendHealthAlert should send health alert notification", async () => {
      const notification = await sendHealthAlert(
        "Test Field",
        "Critical issue",
        "field-1",
        "critical",
      );
      expect(notification).toBeTruthy();

      const stored = notificationService.getStoredNotifications();
      expect(stored[0].type).toBe("health-alert");
      expect(stored[0].priority).toBe("critical");
    });

    it("sendWeatherWarning should send weather warning", async () => {
      const notification = await sendWeatherWarning(
        "Heavy Rain",
        "Prepare for flooding",
        "high",
      );
      expect(notification).toBeTruthy();

      const stored = notificationService.getStoredNotifications();
      expect(stored.length).toBeGreaterThan(0);
      expect(stored[0].type).toBe("weather-warning");
    });

    it("sendRecommendationNotification should send recommendation notification", async () => {
      const notification = await sendRecommendationNotification(
        "Test Field",
        "Apply fertilizer",
        "field-1",
        "medium",
      );
      expect(notification).toBeTruthy();

      const stored = notificationService.getStoredNotifications();
      expect(stored[0].type).toBe("recommendation");
    });
  });

  describe("preferences", () => {
    it("should save and load preferences", () => {
      const prefs = {
        enabled: true,
        types: {
          "health-alert": true,
          "weather-warning": false,
          recommendation: true,
          "yield-update": false,
          system: true,
          general: false,
        },
        doNotDisturb: true,
        soundEnabled: false,
        vibrationEnabled: true,
      };

      notificationService.savePreferences(prefs);
      const loaded = notificationService.getPreferences();

      expect(loaded.enabled).toBe(true);
      expect(loaded.types["weather-warning"]).toBe(false);
      expect(loaded.doNotDisturb).toBe(true);
      expect(loaded.soundEnabled).toBe(false);
    });
  });
});
