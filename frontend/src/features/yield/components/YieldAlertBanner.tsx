import React from 'react';

export type YieldAlertSeverity = 'critical' | 'warning' | 'info';

export interface YieldAlert {
  id: string;
  title: string;
  description: string;
  severity: YieldAlertSeverity;
  fieldId?: string;
  threshold?: number;
  predicted?: number;
}

export interface YieldAlertBannerProps {
  alerts: YieldAlert[];
}

const severityRank: Record<YieldAlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const getBannerClasses = (severity: YieldAlertSeverity): { container: string; icon: string } => {
  switch (severity) {
    case 'critical':
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

const getSeverityLabel = (severity: YieldAlertSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'Critical yield alert';
    case 'warning':
      return 'Yield warning';
    case 'info':
    default:
      return 'Yield information';
  }
};

export const YieldAlertBanner: React.FC<YieldAlertBannerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const sorted = [...alerts].sort(
    (a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0),
  );
  const primary = sorted[0];
  const extraCount = alerts.length - 1;
  const { container, icon } = getBannerClasses(primary.severity);

  return (
    <section
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-xs sm:text-sm ${container}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="mt-0.5 shrink-0">
        <span className={`text-base sm:text-lg ${icon}`} aria-hidden="true">
          ⚠
        </span>
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide">
          {getSeverityLabel(primary.severity)}
        </p>
        <p className="font-medium">{primary.title}</p>
        {primary.description && (
          <p className="text-[11px] sm:text-xs opacity-90 line-clamp-3">
            {primary.description}
          </p>
        )}
        {(primary.threshold !== undefined || primary.predicted !== undefined) && (
          <p className="text-[11px] sm:text-xs opacity-80">
            {primary.predicted !== undefined && `Predicted: ${primary.predicted.toLocaleString()} kg/ha`}
            {primary.threshold !== undefined && primary.predicted !== undefined && ' | '}
            {primary.threshold !== undefined && `Threshold: ${primary.threshold.toLocaleString()} kg/ha`}
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

export default YieldAlertBanner;