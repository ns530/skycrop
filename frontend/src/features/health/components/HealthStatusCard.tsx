import React from "react";

import { Card } from "../../../shared/ui/Card";
import type { HealthSummaryLabel } from "../api/healthApi";

export interface HealthStatusCardProps {
  statusLabel: HealthSummaryLabel | null;
  latestIndex?: number;
  lastUpdated?: string;
}

const getCardStatus = (label: HealthSummaryLabel | null) => {
  if (label === "Excellent" || label === "Good") return "excellent" as const;
  if (label === "Fair") return "fair" as const;
  if (label === "Poor") return "poor" as const;
  return "default" as const;
};

const getStatusTextClass = (label: HealthSummaryLabel | null) => {
  if (label === "Excellent" || label === "Good") {
    return "text-emerald-700";
  }
  if (label === "Fair") {
    return "text-amber-700";
  }
  if (label === "Poor") {
    return "text-red-700";
  }
  return "text-gray-400";
};

/**
 * HealthStatusCard
 *
 * Renders the primary field health metric card, including:
 * - Overall health status (Excellent / Good / Fair / Poor / No data)
 * - Latest NDVI value
 * - Last updated timestamp
 */
export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({
  statusLabel,
  latestIndex,
  lastUpdated,
}) => {
  const isNoData = !statusLabel;
  const formattedIndex =
    typeof latestIndex === "number" ? latestIndex.toFixed(2) : "—";
  const formattedUpdatedAt = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : "—";

  return (
    <Card
      title="Field health"
      status={getCardStatus(statusLabel)}
      showStatusStripe={!isNoData}
      aria-label="Field health status"
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Overall status
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${getStatusTextClass(
              statusLabel,
            )}`}
          >
            {isNoData ? "No data" : statusLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Latest NDVI
            </p>
            <p className="mt-0.5 font-medium text-gray-900">{formattedIndex}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Last updated
            </p>
            <p className="mt-0.5 text-xs text-gray-600">{formattedUpdatedAt}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HealthStatusCard;
