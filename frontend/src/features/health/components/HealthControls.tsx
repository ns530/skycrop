import React from "react";

import { Button } from "../../../shared/ui/Button";
import type { HealthIndexType } from "../api/healthApi";

export type HealthRangePreset = "7d" | "14d" | "30d" | "season";

export interface HealthControlsProps {
  indexType: HealthIndexType;
  onIndexChange: (index: HealthIndexType) => void;
  range: HealthRangePreset;
  onRangeChange: (range: HealthRangePreset) => void;
}

/**
 * HealthControls
 *
 * Compact control surface for choosing:
 * - Health index (NDVI / NDWI / TDVI)
 * - Date range (7 / 14 / 30 days, or Season)
 *
 * Designed to be mobile-friendly: stacks vertically on small screens and
 * uses accessible button groups.
 */
export const HealthControls: React.FC<HealthControlsProps> = ({
  indexType,
  onIndexChange,
  range,
  onRangeChange,
}) => {
  const indexOptions: { value: HealthIndexType; label: string }[] = [
    { value: "NDVI", label: "NDVI" },
    { value: "NDWI", label: "NDWI" },
    { value: "TDVI", label: "TDVI" },
  ];

  const rangeOptions: { value: HealthRangePreset; label: string }[] = [
    { value: "7d", label: "7 days" },
    { value: "14d", label: "14 days" },
    { value: "30d", label: "30 days" },
    { value: "season", label: "Season" },
  ];

  return (
    <section
      aria-label="Health index and date range selection"
      className="flex flex-col gap-3 rounded-md border border-gray-100 bg-white p-3 sm:p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Index
          </p>
          <p className="text-xs text-gray-500">
            Choose which vegetation or water index to view.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Select health index"
          className="mt-1 inline-flex flex-wrap gap-2"
        >
          {indexOptions.map((option) => {
            const isActive = option.value === indexType;
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isActive ? "primary" : "ghost"}
                aria-pressed={isActive}
                onClick={() => onIndexChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-gray-100" aria-hidden="true" />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Date range
          </p>
          <p className="text-xs text-gray-500">
            Summaries are computed for the selected lookback window.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Select health date range"
          className="mt-1 inline-flex flex-wrap gap-2"
        >
          {rangeOptions.map((option) => {
            const isActive = option.value === range;
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
                aria-pressed={isActive}
                onClick={() => onRangeChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HealthControls;
