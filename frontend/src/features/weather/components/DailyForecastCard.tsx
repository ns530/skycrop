import React from 'react';

import type { DailyForecast, WeatherAlert } from '../api/weatherApi';

export interface DailyForecastCardProps {
  forecast: DailyForecast;
  isToday?: boolean;
  isRisky?: boolean;
  /**
   * Alerts that overlap the day represented by this forecast.
   */
  alerts?: WeatherAlert[];
}

const formatDayLabel = (dateStr: string, isToday?: boolean): string => {
  if (isToday) {
    return 'Today';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
  });
};

const getConditionEmoji = (condition: string): string => {
  const normalized = condition.toLowerCase();

  if (normalized.includes('thunder') || normalized.includes('storm')) return '⛈️';
  if (normalized.includes('rain') || normalized.includes('shower')) return '🌧️';
  if (normalized.includes('snow')) return '❄️';
  if (normalized.includes('cloud')) return '☁️';
  if (normalized.includes('fog') || normalized.includes('mist')) return '🌫️';
  if (normalized.includes('sun') || normalized.includes('clear')) return '☀️';

  return '🌤️';
};

const getRiskLabel = (forecast: DailyForecast, isRisky?: boolean): string | null => {
  if (!isRisky) return null;

  if (forecast.precipMm >= 20) {
    return 'Heavy rain';
  }
  if (forecast.maxTempC >= 35) {
    return 'Heat';
  }

  return 'Risky conditions';
};

const getAlertSeverityClasses = (severity: WeatherAlert['severity']): string => {
  switch (severity) {
    case 'severe':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'info':
    default:
      return 'bg-sky-100 text-sky-800 border-sky-200';
  }
};

export const DailyForecastCard: React.FC<DailyForecastCardProps> = (props: DailyForecastCardProps) => {
  const { forecast, isToday = false, isRisky = false, alerts } = props;
  const alertsList: WeatherAlert[] = alerts ?? [];

  const dayLabel = formatDayLabel(forecast.date, isToday);
  const emoji = getConditionEmoji(forecast.condition);
  const riskLabel = getRiskLabel(forecast, isRisky);

  const primaryAlert = alertsList[0];
  const extraAlertsCount = alertsList.length > 1 ? alertsList.length - 1 : 0;

  return (
    <article
      className="flex h-full flex-col rounded-lg border border-gray-100 bg-white p-3 text-xs shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-brand-blue focus-within:ring-offset-2 sm:text-sm"
      aria-label={`${dayLabel} forecast`}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">{dayLabel}</p>
          {isToday && (
            <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-blue">
              Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-right text-xs text-gray-600">
          <span aria-hidden="true" className="text-base sm:text-lg">
            {emoji}
          </span>
          <span className="line-clamp-1">{forecast.condition}</span>
        </div>
      </header>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Temperature</p>
          <p className="text-sm font-semibold text-gray-900">
            {Math.round(forecast.maxTempC)}° / {Math.round(forecast.minTempC)}°
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Rain</p>
          <p className="text-sm font-semibold text-gray-900">{forecast.precipMm.toFixed(1)} mm</p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {riskLabel && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
            <span aria-hidden="true">⚠</span>
            <span>{riskLabel}</span>
          </span>
        )}

        {primaryAlert && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${getAlertSeverityClasses(
              primaryAlert.severity,
            )}`}
          >
            <span aria-hidden="true">⚠</span>
            <span>{primaryAlert.title || 'Weather alert'}</span>
          </span>
        )}

        {extraAlertsCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            +{extraAlertsCount} more
          </span>
        )}
      </div>
    </article>
  );
};

export default DailyForecastCard;