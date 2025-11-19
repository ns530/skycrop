import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useUiState } from '../../../shared/context/UiContext';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { useFieldDetail } from '../../fields/hooks/useFields';
import type {
  FieldHealthResponse,
  FieldHealthTimeSeries,
  HealthIndexType,
  HealthSummaryBucket,
} from '../api/healthApi';
import {
  HealthControls,
  type HealthRangePreset,
} from '../components/HealthControls';
import { HealthIndexLegend } from '../components/HealthIndexLegend';
import { HealthStatusCard } from '../components/HealthStatusCard';
import { HealthSummaryBuckets } from '../components/HealthSummaryBuckets';
import { HealthTrendCard } from '../components/HealthTrendCard';
import { HealthTrendChart } from '../components/HealthTrendChart';
import { useFieldHealth, useHealthIndicesMetadata } from '../hooks';

/**
 * Pick the bucket with the largest percentage area as the primary status label.
 */
const getDominantStatusLabel = (
  summary?: HealthSummaryBucket[],
): HealthSummaryBucket['label'] | null => {
  if (!summary || summary.length === 0) return null;
  let maxBucket = summary[0];
  for (const bucket of summary) {
    if (bucket.percentageArea > maxBucket.percentageArea) {
      maxBucket = bucket;
    }
  }
  return maxBucket.label;
};

const subtractDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
};

const formatAsIsoDate = (date: Date): string =>
  date.toISOString().split('T')[0];

const getDateRangeForPreset = (
  preset: HealthRangePreset,
): { startDate: string; endDate: string } => {
  const end = new Date();
  let days: number;

  switch (preset) {
    case '7d':
      days = 7;
      break;
    case '14d':
      days = 14;
      break;
    case '30d':
      days = 30;
      break;
    case 'season':
      // Simple proxy for a season-length window for now
      days = 90;
      break;
    default:
      days = 30;
  }

  const start = subtractDays(end, days);
  return {
    startDate: formatAsIsoDate(start),
    endDate: formatAsIsoDate(end),
  };
};

const selectSeriesForIndex = (
  response: FieldHealthResponse | undefined,
  indexType: HealthIndexType,
): FieldHealthTimeSeries | null => {
  if (!response || !response.timeSeries || response.timeSeries.length === 0) {
    return null;
  }
  const exact = response.timeSeries.find(
    (series: FieldHealthTimeSeries) => series.indexType === indexType,
  );
  return exact ?? response.timeSeries[0];
};

/**
 * FieldHealthPage
 *
 * Map-first detail view for /fields/:fieldId/health, rendered inside MapFirstLayout.
 * Focuses on the side-panel content: controls, health status, area breakdown,
 * trend stub, and index legend.
 */
export const FieldHealthPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const { showToast } = useToast();

  const {
    state: { currentFieldId, defaultHealthIndex, defaultHealthRange },
    setCurrentField,
    setHealthIndex,
    setHealthRange,
  } = useUiState();
  const { isOnline } = useOnlineStatus();

  const effectiveFieldId = fieldId ?? currentFieldId ?? '';

  // Sync current field into global UI context
  useEffect(() => {
    if (fieldId) {
      setCurrentField(fieldId);
    }
  }, [fieldId, setCurrentField]);

  // Fetch base field metadata (name, area) for header context
  const {
    data: field,
    isLoading: isFieldLoading,
    isError: isFieldError,
  } = useFieldDetail(effectiveFieldId);

  // Derive date range from UI preset
  const { startDate, endDate } = useMemo(
    () => getDateRangeForPreset(defaultHealthRange),
    [defaultHealthRange],
  );

  const healthParams = useMemo(
    () => ({
      startDate,
      endDate,
      indexType: defaultHealthIndex,
    }),
    [startDate, endDate, defaultHealthIndex],
  );

  const {
    data: health,
    isLoading: isHealthLoading,
    isError: isHealthError,
    error: healthError,
    refetch: refetchHealth,
    isFetching: isHealthFetching,
  } = useFieldHealth(effectiveFieldId, healthParams);

  // Fetch metadata once for potential future copy/tooltips
  useHealthIndicesMetadata();

  const selectedSeries = useMemo(
    () => selectSeriesForIndex(health, defaultHealthIndex),
    [health, defaultHealthIndex],
  );

  const statusLabel = useMemo(
    () => getDominantStatusLabel(health?.summary),
    [health],
  );

  const latestIndex = useMemo(() => {
    if (typeof health?.latestIndex === 'number') {
      return health.latestIndex;
    }
    if (!selectedSeries || !selectedSeries.points.length) return undefined;
    return selectedSeries.points[selectedSeries.points.length - 1]?.value;
  }, [health, selectedSeries]);

  const lastUpdated = useMemo(() => {
    if (!selectedSeries || !selectedSeries.points.length) return undefined;
    const lastPoint =
      selectedSeries.points[selectedSeries.points.length - 1];
    return lastPoint.date;
  }, [selectedSeries]);

  const hasAnyHealthData =
    Boolean(health?.summary && health.summary.length > 0) ||
    Boolean(selectedSeries && selectedSeries.points.length > 0);

  const handleRetryHealth = () => {
    void refetchHealth();
    showToast({
      title: 'Retrying health data',
      description: 'Attempting to reload field health metrics.',
      variant: 'default',
    });
  };

  if (!fieldId) {
    return (
      <section
        aria-labelledby="field-health-heading"
        className="space-y-4"
      >
        <header className="space-y-1">
          <h1
            id="field-health-heading"
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

  return (
    <section
      aria-labelledby="field-health-heading"
      className="space-y-4"
    >
      <header className="space-y-1">
        <h1
          id="field-health-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Field health
        </h1>
        <p className="text-sm text-gray-600">
          Health overview for the selected field, summarizing vegetation
          indices, area breakdown, and recent trends.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {field && !isFieldLoading && !isFieldError && (
            <>
              <span className="font-medium text-gray-700">
                {field.name}
              </span>
              <span>Area: {field.areaHa.toFixed(2)} ha</span>
            </>
          )}
          <span>
            Range: {startDate} – {endDate}
          </span>
          {isHealthFetching && <span>Refreshing…</span>}
        </div>
      </header>

      {!isOnline && (
        <p className="flex items-center gap-2 text-xs text-amber-700">
          <span
            className="inline-block h-2 w-2 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          {health
            ? 'You are offline. Showing the last loaded health data.'
            : 'You are offline and have no cached health data yet.'}
        </p>
      )}

      {/* Controls: index + date range */}
      <HealthControls
        indexType={defaultHealthIndex}
        onIndexChange={setHealthIndex}
        range={defaultHealthRange}
        onRangeChange={setHealthRange}
      />

      {/* Health data states */}
      {isHealthLoading && !health && (
        <LoadingState message="Loading health data for this field…" />
      )}

      {isHealthError && (
        <ErrorState
          title="Unable to load health data"
          message={
            healthError?.message ??
            'Something went wrong while loading health metrics for this field.'
          }
          onRetry={handleRetryHealth}
        />
      )}

      {!isHealthLoading && !isHealthError && !hasAnyHealthData && (
        <Card title="No health data available">
          <p className="text-sm text-gray-700">
            There is no health data available for this field and date range
            yet. Try expanding the date range or check back after the next
            satellite pass.
          </p>
        </Card>
      )}

      {hasAnyHealthData && (
        <div className="space-y-4">
          <HealthStatusCard
            statusLabel={statusLabel}
            latestIndex={latestIndex}
            lastUpdated={lastUpdated}
          />

          <Card title="Area by health status">
            <HealthSummaryBuckets buckets={health?.summary ?? []} />
          </Card>

          {/* Interactive Trend Chart */}
          <HealthTrendChart
            series={selectedSeries}
            title={`${defaultHealthIndex.toUpperCase()} Trend (${defaultHealthRange})`}
          />

          <HealthTrendCard series={selectedSeries} />

          <HealthIndexLegend indexType={defaultHealthIndex} />
        </div>
      )}
    </section>
  );
};

export default FieldHealthPage;