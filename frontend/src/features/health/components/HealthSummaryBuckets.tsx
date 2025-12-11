import React from "react";

import type { HealthSummaryBucket } from "../api/healthApi";

export interface HealthSummaryBucketsProps {
  buckets: HealthSummaryBucket[];
}

const getBucketColorClass = (label: HealthSummaryBucket["label"]) => {
  switch (label) {
    case "Excellent":
    case "Good":
      return "bg-status-excellent";
    case "Fair":
      return "bg-status-fair";
    case "Poor":
      return "bg-status-poor";
    default:
      return "bg-gray-200";
  }
};

/**
 * HealthSummaryBuckets
 *
 * Accessible visualization of how much of the field area falls into each
 * health bucket (Excellent/Good/Fair/Poor).
 */
export const HealthSummaryBuckets: React.FC<HealthSummaryBucketsProps> = ({
  buckets,
}) => {
  if (!buckets || buckets.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No area breakdown is available for this period.
      </p>
    );
  }

  const total =
    buckets.reduce<number>((sum, bucket) => sum + bucket.percentageArea, 0) ||
    1;

  return (
    <div className="space-y-3" aria-label="Field area by health status">
      {/* Horizontal stacked bar */}
      <div
        className="flex h-3 overflow-hidden rounded-full bg-gray-100"
        role="img"
        aria-label="Health bucket distribution"
      >
        {buckets.map((bucket) => {
          const width = `${(bucket.percentageArea / total) * 100}%`;
          return (
            <div
              key={bucket.label}
              className={`${getBucketColorClass(bucket.label)} first:rounded-l-full last:rounded-r-full`}
              style={{ width }}
            >
              <span className="sr-only">
                {bucket.label}: {bucket.percentageArea.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend list */}
      <ul
        className="grid grid-cols-1 gap-2 text-xs text-gray-700 sm:grid-cols-2"
        aria-label="Health bucket legend"
      >
        {buckets.map((bucket) => (
          <li
            key={bucket.label}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${getBucketColorClass(bucket.label)}`}
                aria-hidden="true"
              />
              <span className="font-medium">{bucket.label}</span>
            </div>
            <span aria-label={`${bucket.label} area percentage`}>
              {bucket.percentageArea.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HealthSummaryBuckets;
