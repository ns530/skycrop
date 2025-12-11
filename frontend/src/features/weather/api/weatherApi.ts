import { httpClient, normalizeApiError } from "../../../shared/api";

export type WeatherCondition = string;

export interface DailyForecast {
  date: string;
  minTempC: number;
  maxTempC: number;
  precipMm: number;
  condition: WeatherCondition;
}

export interface WeatherForecastResponse {
  lat: number;
  lon: number;
  daily: DailyForecast[];
}

export type WeatherAlertSeverity = "info" | "warning" | "severe";

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: WeatherAlertSeverity;
  startTime: string;
  endTime: string;
  relatedFieldIds?: string[];
}

// --------------------
// Backend envelopes (internal)
// --------------------

interface BackendWeatherForecastEnvelope {
  success: boolean;
  data: WeatherForecastResponse;
  meta?: Record<string, unknown>;
}

interface BackendWeatherAlertsEnvelope {
  success: boolean;
  data: WeatherAlert[];
  meta?: Record<string, unknown>;
}

// --------------------
// Public API
// --------------------

/**
 * Get multi-day forecast for a location.
 *
 * GET /api/v1/weather/forecast?lat=&lon=
 */
export const getWeatherForecast = async (
  lat: number,
  lon: number,
): Promise<WeatherForecastResponse> => {
  try {
    const res = await httpClient.get<BackendWeatherForecastEnvelope>(
      "/weather/forecast",
      {
        params: { lat, lon },
      },
    );
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Get active weather alerts relevant to the current user.
 *
 * GET /api/v1/weather/alerts
 */
export const getWeatherAlerts = async (): Promise<WeatherAlert[]> => {
  try {
    const res =
      await httpClient.get<BackendWeatherAlertsEnvelope>("/weather/alerts");
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};
