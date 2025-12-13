/**
 * NotificationSettingsPage
 *
 * Configure notification preferences
 */

import React, { useState, useEffect } from "react";

import { useToast } from "../../../shared/hooks/useToast";
import {
  notificationService,
  type NotificationPreferences,
  type NotificationType,
} from "../../../shared/services/notificationService";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

export const NotificationSettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences(),
  );
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationService.getPermission(),
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Refresh preferences on mount
    setPreferences(notificationService.getPreferences());
    setPermission(notificationService.getPermission());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await notificationService.requestPermission();
      setPermission(result);

      if (result === "granted") {
        showToast({
          title: "Notifications enabled",
          description: "You will now receive important alerts.",
          variant: "success",
        });
        setPreferences(notificationService.getPreferences());
      } else {
        showToast({
          title: "Permission denied",
          description: "You can enable notifications in your browser settings.",
          variant: "error",
        });
      }
    } catch {
      showToast({
        title: "Error",
        description: "Could not request notification permission.",
        variant: "error",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggleEnabled = () => {
    if (!preferences.enabled && permission !== "granted") {
      handleRequestPermission();
    } else {
      const newPrefs = { ...preferences, enabled: !preferences.enabled };
      setPreferences(newPrefs);
      notificationService.savePreferences(newPrefs);
      showToast({
        title: newPrefs.enabled
          ? "Notifications enabled"
          : "Notifications disabled",
        description: newPrefs.enabled
          ? "You will receive important alerts."
          : "Notifications have been turned off.",
        variant: newPrefs.enabled ? "success" : "default",
      });
    }
  };

  const handleToggleType = (type: NotificationType) => {
    const newTypes = { ...preferences.types, [type]: !preferences.types[type] };
    const newPrefs = { ...preferences, types: newTypes };
    setPreferences(newPrefs);
    notificationService.savePreferences(newPrefs);
  };

  const handleToggleDoNotDisturb = () => {
    const newPrefs = {
      ...preferences,
      doNotDisturb: !preferences.doNotDisturb,
    };
    setPreferences(newPrefs);
    notificationService.savePreferences(newPrefs);
    showToast({
      title: newPrefs.doNotDisturb
        ? "Do Not Disturb enabled"
        : "Do Not Disturb disabled",
      description: newPrefs.doNotDisturb
        ? "Only critical notifications will be shown."
        : "All notifications will be shown.",
      variant: "default",
    });
  };

  const handleToggleSound = () => {
    const newPrefs = {
      ...preferences,
      soundEnabled: !preferences.soundEnabled,
    };
    setPreferences(newPrefs);
    notificationService.savePreferences(newPrefs);
  };

  const handleToggleVibration = () => {
    const newPrefs = {
      ...preferences,
      vibrationEnabled: !preferences.vibrationEnabled,
    };
    setPreferences(newPrefs);
    notificationService.savePreferences(newPrefs);
  };

  const handleQuietHoursChange = (
    field: "quietHoursStart" | "quietHoursEnd",
    value: string,
  ) => {
    const newPrefs = { ...preferences, [field]: value };
    setPreferences(newPrefs);
    notificationService.savePreferences(newPrefs);
  };

  const handleTestNotification = () => {
    notificationService.send({
      type: "system",
      priority: "low",
      title: "🔔 Test Notification",
      body: "This is a test notification from SkyCrop. If you see this, notifications are working!",
    });
  };

  const notificationTypes: Array<{
    type: NotificationType;
    label: string;
    description: string;
  }> = [
    {
      type: "health-alert",
      label: "Health Alerts",
      description: "Critical field health issues",
    },
    {
      type: "weather-warning",
      label: "Weather Warnings",
      description: "Severe weather alerts",
    },
    {
      type: "recommendation",
      label: "AI Recommendations",
      description: "New recommendations from AI",
    },
    {
      type: "yield-update",
      label: "Yield Updates",
      description: "Yield prediction changes",
    },
    {
      type: "system",
      label: "System Messages",
      description: "Important system updates",
    },
    {
      type: "general",
      label: "General News",
      description: "General updates and news",
    },
  ];

  const isNotificationsSupported = notificationService.isSupported();

  return (
    <section
      aria-labelledby="notification-settings-heading"
      className="space-y-6"
    >
      <header className="space-y-2">
        <h1
          id="notification-settings-heading"
          className="text-2xl font-bold text-gray-900"
        >
          🔔 Notification Settings
        </h1>
        <p className="text-sm text-gray-600">
          Manage how and when you receive notifications from SkyCrop
        </p>
      </header>

      {!isNotificationsSupported && (
        <Card>
          <div className="text-center py-6">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Notifications not supported
            </p>
            <p className="text-xs text-gray-600">
              Your browser does not support push notifications. Please use a
              modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </Card>
      )}

      {/* Master Toggle */}
      <Card title="Enable Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Master switch</p>
              <p className="text-xs text-gray-600">
                {permission === "denied"
                  ? "Permission denied. Enable in browser settings."
                  : "Turn all notifications on or off"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleEnabled}
              disabled={permission === "denied" || isRequesting}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${preferences.enabled ? "bg-blue-600" : "bg-gray-200"}
                ${permission === "denied" || isRequesting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${preferences.enabled ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>

          {permission === "default" && !preferences.enabled && (
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isRequesting ? "Requesting..." : "Enable Notifications"}
            </Button>
          )}

          {preferences.enabled && (
            <Button
              onClick={handleTestNotification}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              Send Test Notification
            </Button>
          )}
        </div>
      </Card>

      {/* Notification Types */}
      <Card title="Notification Types">
        <div className="space-y-3">
          <p className="text-xs text-gray-600 mb-4">
            Choose which types of notifications you want to receive
          </p>

          {notificationTypes.map(({ type, label, description }) => (
            <div key={type} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-600">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleType(type)}
                disabled={!preferences.enabled}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${preferences.types[type] ? "bg-blue-600" : "bg-gray-200"}
                  ${!preferences.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${preferences.types[type] ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Do Not Disturb */}
      <Card title="Do Not Disturb">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Do Not Disturb mode
              </p>
              <p className="text-xs text-gray-600">
                Only show critical notifications
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleDoNotDisturb}
              disabled={!preferences.enabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${preferences.doNotDisturb ? "bg-blue-600" : "bg-gray-200"}
                ${!preferences.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${preferences.doNotDisturb ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-3 pt-2 border-t">
            <p className="text-sm font-medium text-gray-900">Quiet Hours</p>
            <p className="text-xs text-gray-600">
              Don&apos;t send non-critical notifications during these hours
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-time"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Start time
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={preferences.quietHoursStart || "22:00"}
                  onChange={(e) =>
                    handleQuietHoursChange("quietHoursStart", e.target.value)
                  }
                  disabled={!preferences.enabled}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="end-time"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  End time
                </label>
                <input
                  id="end-time"
                  type="time"
                  value={preferences.quietHoursEnd || "07:00"}
                  onChange={(e) =>
                    handleQuietHoursChange("quietHoursEnd", e.target.value)
                  }
                  disabled={!preferences.enabled}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sound & Vibration */}
      <Card title="Sound & Vibration">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Sound</p>
              <p className="text-xs text-gray-600">
                Play sound with notifications
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              disabled={!preferences.enabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${preferences.soundEnabled ? "bg-blue-600" : "bg-gray-200"}
                ${!preferences.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${preferences.soundEnabled ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Vibration</p>
              <p className="text-xs text-gray-600">Vibrate on mobile devices</p>
            </div>
            <button
              type="button"
              onClick={handleToggleVibration}
              disabled={!preferences.enabled}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${preferences.vibrationEnabled ? "bg-blue-600" : "bg-gray-200"}
                ${!preferences.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${preferences.vibrationEnabled ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default NotificationSettingsPage;
