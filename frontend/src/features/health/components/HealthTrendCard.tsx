import React from 'react';

import { Card } from '../../../shared/ui/Card';
import type { FieldHealthTimeSeries } from '../api/healthApi';

export interface HealthTrendCardProps {
  series: FieldHealthTimeSeries | null;
}

const computeTrendLabel = (values: number[]): 'Improving' | 'Declining' | 'Stable' => {
  if (!values.length) return 'Stable';
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const threshold = 0.02;
  if (delta > threshold) return 'Improving';
  if (delta < -threshold) return 'Declining';
  return 'Stable';
};

const buildSparklinePath = (values: number[], width = 120, height = 32): string => {
  if (!values.length) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, index) => {
    const x = stepX * index;
    const normalized = (v - min) / span;
    const y = height - normalized * height;
    return `${x},${y}`;
  });

  return points.join(' ');
};

/**
 * HealthTrendCard
 *
 * Lightweight "sparkline" style visualization of index evolution over time.
 * Shows:
 * - Inline SVG sparkline
 * - Min / Max values
 * - Trend direction (Improving / Declining / Stable)
 */
export const HealthTrendCard: React.FC<HealthTrendCardProps> = ({ series }) => {
  const hasSeries = Boolean(series && series.points && series.points.length > 0);

  if (!hasSeries) {
    return (
      <Card title="Health trend">
        <p className="text-sm text-gray-600">
          Not enough data is available yet to show a trend for this index and date range.
        </p>
      </Card>
    );
  }

  const values = series!.points.map((p) => p.value);
  const dates = series!.points.map((p) => p.date);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const trendLabel = computeTrendLabel(values);
  const path = buildSparklinePath(values);

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return (
    <Card title="Health trend">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {series!.indexType} over time
            </span>
            <span className="text-xs text-gray-500">
              {firstDate} – {lastDate}
            </span>
          </div>
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text[11px] font-medium text-gray-700">
            {trendLabel}
          </span>
        </div>

        <div aria-hidden="true">
          <svg
            viewBox="0 0 120 32"
            role="presentation"
            className="h-8 w-full text-status-excellent"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={path}
            />
          </svg>
        </div>

        <dl className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-700">
          <div>
            <dt className="font-medium text-gray-900">Min</dt>
            <dd>{minValue.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-900">Max</dt>
            <dd>{maxValue.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
};

export default HealthTrendCard;