import React from "react";

import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ForecastStrip } from "../components/ForecastStrip";
import { WeatherAlertBanner } from "../components/WeatherAlertBanner";
import { useWeatherForecast, useWeatherAlerts } from "../hooks";

// Simple regional default for Sri Lanka-ish centroid; can be refined later.
const DEFAULT_REGION_LAT = 7.5;
const DEFAULT_REGION_LON = 80.7;

/**
 * WeatherOverviewPage
 *
 * Route: /weather
 * Farmer-level overview of regional conditions and active alerts.
 */
export const WeatherOverviewPage: React.FC = () => {
  const { showToast } = useToast();

  const {
    data: alerts,
    isLoading: isAlertsLoading,
    isError: isAlertsError,
    error: alertsError,
    refetch: refetchAlerts,
    isFetching: isAlertsFetching,
  } = useWeatherAlerts();

  const {
    data: regionalForecast,
    isLoading: isForecastLoading,
    isError: isForecastError,
    error: forecastError,
    refetch: refetchForecast,
    isFetching: isForecastFetching,
  } = useWeatherForecast(DEFAULT_REGION_LAT, DEFAULT_REGION_LON);

  const hasAlerts = (alerts?.length ?? 0) > 0;
  const hasForecastDays = (regionalForecast?.daily?.length ?? 0) > 0;

  const handleRetryAlerts = () => {
    void refetchAlerts();
    showToast({
      title: "Retrying weather alerts",
      description:
        alertsError?.message ?? "Attempting to reload active weather alerts.",
      variant: "default",
    });
  };

  const handleRetryForecast = () => {
    void refetchForecast();
    showToast({
      title: "Retrying regional forecast",
      description:
        forecastError?.message ??
        "Attempting to reload the regional 7-day forecast.",
      variant: "default",
    });
  };

  return (
    <section aria-labelledby="weather-overview-heading" className="space-y-4">
      <header className="space-y-1">
        <h1
          id="weather-overview-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Weather overview
        </h1>
        <p className="text-sm text-gray-600">
          Region-wide 7-day outlook and active alerts that may affect your
          fields.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>
            Regional centroid: {DEFAULT_REGION_LAT.toFixed(2)},{" "}
            {DEFAULT_REGION_LON.toFixed(2)}
          </span>
          {(isAlertsFetching || isForecastFetching) && <span>Refreshing…</span>}
        </div>
      </header>

      {/* Alerts banner */}
      {!isAlertsLoading && !isAlertsError && hasAlerts && (
        <WeatherAlertBanner alerts={alerts ?? []} />
      )}

      {isAlertsLoading && (
        <Card>
          <p className="text-sm text-gray-600">Loading weather alerts…</p>
        </Card>
      )}

      {isAlertsError && (
        <Card
          title="Unable to load weather alerts"
          status="poor"
          showStatusStripe
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              {alertsError?.message ??
                "Something went wrong while loading active weather alerts."}
            </p>
            <Button size="sm" variant="secondary" onClick={handleRetryAlerts}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Alerts list */}
      {!isAlertsLoading && !isAlertsError && (
        <Card title="Active alerts">
          {hasAlerts ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left font-medium text-gray-700"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left font-medium text-gray-700"
                    >
                      Severity
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left font-medium text-gray-700"
                    >
                      Start
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left font-medium text-gray-700"
                    >
                      End
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-left font-medium text-gray-700"
                    >
                      Related fields
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {alerts?.map((alert) => {
                    const start = new Date(alert.startTime);
                    const end = new Date(alert.endTime);
                    const relatedCount = alert.relatedFieldIds?.length ?? 0;

                    const startLabel = !Number.isNaN(start.getTime())
                      ? start.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    const endLabel = !Number.isNaN(end.getTime())
                      ? end.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={alert.id}>
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium text-gray-900">
                            {alert.title}
                          </div>
                          {alert.description && (
                            <div className="mt-0.5 text-[11px] sm:text-xs text-gray-600 line-clamp-2">
                              {alert.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top text-gray-700">
                          {startLabel}
                        </td>
                        <td className="px-3 py-2 align-top text-gray-700">
                          {endLabel}
                        </td>
                        <td className="px-3 py-2 align-top text-gray-700">
                          {relatedCount > 0 ? `${relatedCount} field(s)` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-700">
              There are currently no active weather alerts for your region.
            </p>
          )}
        </Card>
      )}

      {/* Regional forecast */}
      {!isForecastLoading &&
        !isForecastError &&
        hasForecastDays &&
        regionalForecast && (
          <Card title="Regional 7-day forecast">
            <ForecastStrip forecast={regionalForecast} alerts={alerts ?? []} />
          </Card>
        )}

      {isForecastLoading && (
        <Card>
          <p className="text-sm text-gray-600">Loading regional forecast…</p>
        </Card>
      )}

      {isForecastError && (
        <Card
          title="Unable to load regional forecast"
          status="poor"
          showStatusStripe
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              {forecastError?.message ??
                "Something went wrong while loading the regional forecast."}
            </p>
            <Button size="sm" variant="secondary" onClick={handleRetryForecast}>
              Retry
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
};

export default WeatherOverviewPage;
