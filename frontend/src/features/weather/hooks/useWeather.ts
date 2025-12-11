import { useQuery } from "@tanstack/react-query";

import type { ApiError } from "../../../shared/api";
import { weatherKeys } from "../../../shared/query/queryKeys";
import {
  getWeatherForecast,
  getWeatherAlerts,
  type WeatherForecastResponse,
  type WeatherAlert,
} from "../api/weatherApi";

/**
 * useWeatherForecast
 *
 * Fetch multi-day weather forecast for a given location.
 */
export const useWeatherForecast = (lat: number, lon: number) =>
  useQuery<WeatherForecastResponse, ApiError>({
    queryKey: weatherKeys.forecast(lat, lon),
    queryFn: () => getWeatherForecast(lat, lon),
    enabled: Number.isFinite(lat) && Number.isFinite(lon),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

/**
 * useWeatherAlerts
 *
 * Fetch active weather alerts relevant to the current user.
 */
export const useWeatherAlerts = () =>
  useQuery<WeatherAlert[], ApiError>({
    queryKey: weatherKeys.alerts,
    queryFn: () => getWeatherAlerts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
