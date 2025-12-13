import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useUiState } from "../../../shared/context/UiContext";
import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { useFieldDetail } from "../../fields/hooks/useFields";
import { ForecastStrip } from "../components/ForecastStrip";
import { WeatherAlertBanner } from "../components/WeatherAlertBanner";
import { useWeatherForecast, useWeatherAlerts } from "../hooks";

/**
 * FieldWeatherPage
 *
 * Map-first detail view for /fields/:fieldId/weather, rendered inside
 * MapFirstLayout. Fetches a 7-day forecast for the field centroid and
 * surfaces relevant weather alerts.
 */
export const FieldWeatherPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    state: { currentFieldId },
    setCurrentField,
  } = useUiState();

  const effectiveFieldId = fieldId ?? currentFieldId ?? "";

  // Sync current field into global UI context
  useEffect(() => {
    if (fieldId) {
      setCurrentField(fieldId);
    }
  }, [fieldId, setCurrentField]);

  // Fetch base field metadata (name, area, centroid) for header and location
  const {
    data: field,
    isLoading: isFieldLoading,
    isError: isFieldError,
  } = useFieldDetail(effectiveFieldId);

  const lat = field?.centroidLatLon?.lat ?? Number.NaN;
  const lon = field?.centroidLatLon?.lon ?? Number.NaN;
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lon);

  const {
    data: forecast,
    isLoading: isForecastLoading,
    isError: isForecastError,
    error: forecastError,
    refetch: refetchForecast,
    isFetching: isForecastFetching,
  } = useWeatherForecast(lat, lon);

  const {
    data: alerts,
    isLoading: isAlertsLoading,
    isError: isAlertsError,
    error: alertsError,
    refetch: refetchAlerts,
    isFetching: isAlertsFetching,
  } = useWeatherAlerts();

  const hasForecastDays = (forecast?.daily?.length ?? 0) > 0;
  const hasAlerts = (alerts?.length ?? 0) > 0;

  const handleRetryForecast = () => {
    void refetchForecast();
    showToast({
      title: "Retrying weather forecast",
      description:
        forecastError?.message ??
        "Attempting to reload weather forecast for this field.",
      variant: "default",
    });
  };

  const handleRetryAlerts = () => {
    void refetchAlerts();
    showToast({
      title: "Retrying weather alerts",
      description:
        alertsError?.message ?? "Attempting to reload active weather alerts.",
      variant: "default",
    });
  };

  if (!fieldId) {
    return (
      <section aria-labelledby="field-weather-heading" className="space-y-4">
        <header className="space-y-1">
          <h1
            id="field-weather-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Field not found
          </h1>
          <p className="text-sm text-gray-600">
            The requested field could not be identified from the URL. Please
            return to your fields list and try again.
          </p>
        </header>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate("/fields")}
        >
          Back to fields
        </Button>
      </section>
    );
  }

  const showLocationMissingMessage =
    !isFieldLoading && !isFieldError && field != null && !hasLocation;

  return (
    <section aria-labelledby="field-weather-heading" className="space-y-4">
      <header className="space-y-1">
        <h1
          id="field-weather-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Weather
        </h1>
        <p className="text-sm text-gray-600">
          7-day forecast and active weather alerts for this field&apos;s location.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {field && !isFieldLoading && !isFieldError && (
            <>
              <span className="font-medium text-gray-700">{field.name}</span>
              <span>Area: {field.areaHa.toFixed(2)} ha</span>
              {hasLocation && (
                <span>
                  Lat/Lon: {lat.toFixed(3)}, {lon.toFixed(3)}
                </span>
              )}
            </>
          )}
          {(isForecastFetching || isAlertsFetching) && <span>Refreshing…</span>}
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

      {showLocationMissingMessage && (
        <Card title="Weather unavailable">
          <p className="text-sm text-gray-700">
            Weather forecast is unavailable because this field does not have a
            valid location. Edit the field boundary to enable location-based
            forecasts.
          </p>
        </Card>
      )}

      {!showLocationMissingMessage && hasLocation && (
        <>
          {isForecastLoading && !hasForecastDays && (
            <Card>
              <p className="text-sm text-gray-600">Loading weather forecast…</p>
            </Card>
          )}

          {isForecastError && (
            <Card
              title="Unable to load weather forecast"
              status="poor"
              showStatusStripe
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  {forecastError?.message ??
                    "Something went wrong while loading the weather forecast for this field."}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleRetryForecast}
                >
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {!isForecastLoading &&
            !isForecastError &&
            hasForecastDays &&
            forecast && (
              <Card title="7-day forecast">
                <ForecastStrip forecast={forecast} alerts={alerts ?? []} />
              </Card>
            )}

          {!isForecastLoading &&
            !isForecastError &&
            !hasForecastDays &&
            forecast && (
              <Card title="No forecast available">
                <p className="text-sm text-gray-700">
                  There is no forecast data available for this field yet. Try
                  again later.
                </p>
              </Card>
            )}
        </>
      )}
    </section>
  );
};

export default FieldWeatherPage;
