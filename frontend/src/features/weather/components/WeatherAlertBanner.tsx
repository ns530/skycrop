import React from 'react';

import type { WeatherAlert, WeatherAlertSeverity } from '../api/weatherApi';

export interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
}

const severityRank: Record<WeatherAlertSeverity, number> = {
  severe: 3,
  warning: 2,
  info: 1,
};

const getBannerClasses = (severity: WeatherAlertSeverity): { container: string; icon: string } => {
  switch (severity) {
    case 'severe':
      return {
        container: 'border-red-300 bg-red-50 text-red-900',
        icon: 'text-red-600',
      };
    case 'warning':
      return {
        container: 'border-amber-300 bg-amber-50 text-amber-900',
        icon: 'text-amber-600',
      };
    case 'info':
    default:
      return {
        container: 'border-sky-300 bg-sky-50 text-sky-900',
        icon: 'text-sky-600',
      };
  }
};

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const sorted = [...alerts].sort(
    (a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0),
  );
  const primary = sorted[0];
  const extraCount = alerts.length - 1;
  const { container, icon } = getBannerClasses(primary.severity);

  const start = new Date(primary.startTime);
  const end = new Date(primary.endTime);

  const timeRange =
    !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? `${start.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} \u2192 ${end.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`
      : undefined;

  return (
    <section
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-xs sm:text-sm ${container}`}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0">
        <span className={`text-base sm:text-lg ${icon}`} aria-hidden="true">
          ⚠
        </span>
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide">
          {primary.severity === 'severe'
            ? 'Severe weather alert'
            : primary.severity === 'warning'
            ? 'Weather warning'
            : 'Weather information'}
        </p>
        <p className="font-medium">{primary.title}</p>
        {primary.description && (
          <p className="text-[11px] sm:text-xs opacity-90 line-clamp-3">
            {primary.description}
          </p>
        )}
        {timeRange && (
          <p className="text-[11px] sm:text-xs opacity-80">
            {timeRange}
          </p>
        )}
      </div>
      {extraCount > 0 && (
        <div className="ml-2 shrink-0">
          <span className="inline-flex items-center rounded-full bg-white/40 px-2 py-0.5 text-[10px] font-medium text-current">
            +{extraCount} more alerts
          </span>
        </div>
      )}
    </section>
  );
};

export default WeatherAlertBanner;