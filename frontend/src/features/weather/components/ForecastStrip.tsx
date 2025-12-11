import React from "react";

import type {
  WeatherForecastResponse,
  WeatherAlert,
  DailyForecast,
} from "../api/weatherApi";

import { DailyForecastCard } from "./DailyForecastCard";

export interface ForecastStripProps {
  forecast: WeatherForecastResponse;
  /**
   * All active alerts; will be filtered per day based on time overlap.
   */
  alerts?: WeatherAlert[];
}

const RAIN_RISK_THRESHOLD_MM = 20;
const HEAT_RISK_THRESHOLD_C = 35;

const isSameDay = (a: Date, b: Date): boolean => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const getDayRange = (dateStr: string): { start: Date; end: Date } | null => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getAlertsForDay = (
  alerts: WeatherAlert[],
  dateStr: string,
): WeatherAlert[] => {
  const range = getDayRange(dateStr);
  if (!range) return [];

  const { start, end } = range;

  return alerts.filter((alert) => {
    const alertStart = new Date(alert.startTime);
    const alertEnd = new Date(alert.endTime);

    if (
      Number.isNaN(alertStart.getTime()) ||
      Number.isNaN(alertEnd.getTime())
    ) {
      return false;
    }

    // Overlap check: alert intersects [start, end]
    return alertStart <= end && alertEnd >= start;
  });
};

export const ForecastStrip: React.FC<ForecastStripProps> = (
  props: ForecastStripProps,
) => {
  const { forecast, alerts } = props;
  const alertsList: WeatherAlert[] = alerts ?? [];
  const today = new Date();

  if (!forecast?.daily || forecast.daily.length === 0) {
    return null;
  }

  return (
    <section aria-label="7-day forecast" className="space-y-2">
      <div
        className="
          grid gap-3
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          lg:grid-cols-4
          xl:grid-cols-5
          2xl:grid-cols-7
        "
      >
        {forecast.daily.map((day: DailyForecast) => {
          const date = new Date(day.date);
          const isToday =
            !Number.isNaN(date.getTime()) && isSameDay(date, today);
          const isRisky =
            day.precipMm >= RAIN_RISK_THRESHOLD_MM ||
            day.maxTempC >= HEAT_RISK_THRESHOLD_C;
          const dayAlerts =
            alertsList.length > 0 ? getAlertsForDay(alertsList, day.date) : [];

          return (
            <DailyForecastCard
              key={day.date}
              forecast={day}
              isToday={isToday}
              isRisky={isRisky}
              alerts={dayAlerts}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ForecastStrip;
