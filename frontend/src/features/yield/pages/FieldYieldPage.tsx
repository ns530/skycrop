import React, { useMemo } from "react";
import { useParams } from "react-router-dom";

import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import { useFieldDetail } from "../../fields/hooks/useFields";
import {
  YieldForecastCard,
  YieldHistoryChart,
  YieldAlertBanner,
} from "../components";
import type { YieldAlert } from "../components/YieldAlertBanner";
import { useYieldForecast, useYieldHistory } from "../hooks";

/**
 * FieldYieldPage
 *
 * Yield prediction and history view for /fields/:fieldId/yield
 */
export const FieldYieldPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();

  // Fetch field details
  const {
    data: field,
    isLoading: isFieldLoading,
    isError: isFieldError,
  } = useFieldDetail(fieldId ?? "");

  // Mock yield request - in real implementation, this would come from field features or user input
  const yieldRequest = useMemo(() => {
    if (!fieldId) return null;
    return {
      features: [
        {
          field_id: fieldId,
          // Mock features - in real implementation, these would be calculated from satellite data
          ndvi: 0.7,
          ndwi: 0.2,
          temperature: 25,
          rainfall: 150,
        },
      ],
    };
  }, [fieldId]);

  const {
    data: forecast,
    isLoading: isForecastLoading,
    isError: isForecastError,
  } = useYieldForecast(yieldRequest ?? {});

  const { data: history, isLoading: isHistoryLoading } = useYieldHistory(
    fieldId ?? "",
  );

  // Generate mock alerts based on forecast
  const alerts: YieldAlert[] = useMemo(() => {
    if (!forecast?.predictions?.length) return [];

    const prediction = forecast.predictions[0];
    const alerts: YieldAlert[] = [];

    // Low yield warning
    if (prediction.yield_kg_per_ha < 4000) {
      alerts.push({
        id: "low-yield-warning",
        title: "Low yield prediction detected",
        description:
          "The predicted yield is below the typical threshold. Consider reviewing irrigation and fertilization practices.",
        severity: "warning",
        fieldId,
        predicted: prediction.yield_kg_per_ha,
        threshold: 4000,
      });
    }

    // Very low yield critical alert
    if (prediction.yield_kg_per_ha < 3000) {
      alerts.push({
        id: "critical-yield-alert",
        title: "Critical yield prediction",
        description:
          "Yield prediction indicates potential crop failure. Immediate intervention recommended.",
        severity: "critical",
        fieldId,
        predicted: prediction.yield_kg_per_ha,
        threshold: 3000,
      });
    }

    return alerts;
  }, [forecast, fieldId]);

  if (!fieldId) {
    return (
      <section aria-labelledby="field-yield-heading" className="space-y-4">
        <header className="space-y-1">
          <h1
            id="field-yield-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Field not found
          </h1>
          <p className="text-sm text-gray-600">
            The requested field could not be identified from the URL. Please
            return to your fields list and try again.
          </p>
        </header>
      </section>
    );
  }

  const isLoading = isFieldLoading || isForecastLoading || isHistoryLoading;
  const hasError = isFieldError || isForecastError;

  return (
    <section aria-labelledby="field-yield-heading" className="space-y-4">
      <header className="space-y-1">
        <h1
          id="field-yield-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Yield predictions
        </h1>
        <p className="text-sm text-gray-600">
          AI-powered yield forecasting and historical analysis for optimal
          harvest planning.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {field && !isFieldLoading && !isFieldError && (
            <>
              <span className="font-medium text-gray-700">{field.name}</span>
              <span>Area: {field.areaHa.toFixed(2)} ha</span>
            </>
          )}
        </div>
      </header>

      {/* Yield alerts */}
      <YieldAlertBanner alerts={alerts} />

      {/* Loading state */}
      {isLoading && !forecast && !history && (
        <LoadingState message="Loading yield data..." />
      )}

      {/* Error state */}
      {hasError && (
        <ErrorState
          title="Unable to load yield data"
          message="Something went wrong while loading yield predictions and history."
        />
      )}

      {/* Yield content */}
      {!isLoading && !hasError && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Forecast Card */}
          <div className="lg:col-span-1">
            {yieldRequest && (
              <YieldForecastCard
                request={yieldRequest}
                fieldArea={field?.areaHa}
                pricePerKg={0.5} // Mock price - in real implementation, this would be configurable
              />
            )}
          </div>

          {/* History Chart */}
          <div className="lg:col-span-1">
            <YieldHistoryChart fieldId={fieldId} />
          </div>
        </div>
      )}

      {/* Additional info */}
      <Card title="About yield predictions">
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            Yield predictions are generated using machine learning models
            trained on satellite imagery, weather data, and historical yield
            records. Predictions include confidence intervals to help with
            decision making.
          </p>
          <p>
            <strong>Note:</strong> These predictions are estimates and actual
            yields may vary due to unforeseen factors such as weather events,
            pest infestations, or changes in farming practices.
          </p>
        </div>
      </Card>
    </section>
  );
};

export default FieldYieldPage;
