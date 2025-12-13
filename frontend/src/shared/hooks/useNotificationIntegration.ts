/**
 * useNotificationIntegration Hook
 *
 * Automatically sends notifications based on field data changes
 */

import { useEffect, useRef } from "react";

import type { FieldDetail } from "../../features/fields/api/fieldsApi";
import {
  sendHealthAlert,
  sendRecommendationNotification,
} from "../services/notificationService";

interface NotificationTriggers {
  fieldData?: FieldDetail;
  enableHealthAlerts?: boolean;
  enableWeatherAlerts?: boolean;
  enableRecommendationAlerts?: boolean;
}

/**
 * Hook to integrate notifications with field data
 *
 * Automatically sends notifications when:
 * - Field health deteriorates
 * - Weather warnings are issued
 * - New recommendations are available
 */
export const useNotificationIntegration = ({
  fieldData,
  enableHealthAlerts = true,
  enableWeatherAlerts = true,
  enableRecommendationAlerts = true,
}: NotificationTriggers = {}) => {
  const previousHealthStatus = useRef<string | null>(null);
  const _previousWeatherAlert = useRef<string | null>(null);
  const _notifiedRecommendations = useRef<Set<string>>(new Set());

  // Monitor field health
  useEffect(() => {
    if (!fieldData || !enableHealthAlerts) return;

    const currentStatus = fieldData.latestHealthStatus;

    // Check if health has deteriorated
    if (previousHealthStatus.current && currentStatus) {
      const healthOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
      const prevLevel =
        healthOrder[previousHealthStatus.current as keyof typeof healthOrder] ||
        1;
      const currentLevel =
        healthOrder[currentStatus as keyof typeof healthOrder] || 1;

      if (currentLevel > prevLevel && currentLevel >= 2) {
        // Health has declined to fair or poor
        const priority = currentStatus === "poor" ? "critical" : "high";
        sendHealthAlert(
          fieldData.name,
          `Field health has declined to ${currentStatus}. Immediate attention recommended.`,
          fieldData.id,
          priority,
        ).catch(console.error);
      }
    }

    previousHealthStatus.current = currentStatus || null;
  }, [fieldData, enableHealthAlerts]);

  // Monitor weather warnings
  useEffect(() => {
    if (!enableWeatherAlerts) return;

    // This would integrate with weather API to detect warnings
    // For now, it's a placeholder for when weather warnings are available
    const checkWeatherWarnings = async () => {
      // TODO: Integrate with weather warning API
      // Example:
      // const warnings = await getWeatherWarnings();
      // if (warnings.length > 0) {
      //   sendWeatherWarning(warnings[0].title, warnings[0].description, 'high');
      // }
    };

    checkWeatherWarnings().catch(console.error);
  }, [enableWeatherAlerts]);

  return {
    // Status
    isHealthMonitored: enableHealthAlerts,
    isWeatherMonitored: enableWeatherAlerts,
    isRecommendationsMonitored: enableRecommendationAlerts,
  };
};

/**
 * Hook to send notification when a new recommendation is generated
 */
export const useRecommendationNotification = (
  fieldId: string,
  fieldName: string,
  recommendationTitle?: string,
) => {
  const hasNotified = useRef(false);

  useEffect(() => {
    if (recommendationTitle && !hasNotified.current) {
      sendRecommendationNotification(
        fieldName,
        recommendationTitle,
        fieldId,
        "medium",
      ).catch(console.error);

      hasNotified.current = true;
    }
  }, [recommendationTitle, fieldId, fieldName]);
};
