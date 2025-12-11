/**
 * DateRangeSelector Component
 * Button group for selecting predefined date ranges
 */

import React from "react";

export type DateRangePreset = "7d" | "14d" | "30d" | "90d" | "season" | "year";

interface DateRangeSelectorProps {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  options?: Array<{
    value: DateRangePreset;
    label: string;
  }>;
  className?: string;
}

const DEFAULT_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "7d", label: "7 Days" },
  { value: "14d", label: "14 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "season", label: "Season" },
];

/**
 * DateRangeSelector
 *
 * Segmented button group for selecting time periods
 * Common presets: 7d, 14d, 30d, 90d, season, year
 *
 * @example
 * ```tsx
 * <DateRangeSelector
 *   value={dateRange}
 *   onChange={setDateRange}
 * />
 * ```
 */
export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className = "",
}) => {
  return (
    <div
      className={`inline-flex rounded-lg border border-gray-300 overflow-hidden ${className}`}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-2 text-sm font-medium transition-colors
            ${index > 0 ? "border-l border-gray-300" : ""}
            ${
              value === option.value
                ? "bg-brand-blue text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }
          `}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Calculate date range from preset
 */
export const getDateRangeFromPreset = (
  preset: DateRangePreset,
): { startDate: string; endDate: string } => {
  const end = new Date();
  let days: number;

  switch (preset) {
    case "7d":
      days = 7;
      break;
    case "14d":
      days = 14;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "season":
      days = 120; // ~4 months
      break;
    case "year":
      days = 365;
      break;
    default:
      days = 30;
  }

  const start = new Date(end);
  start.setDate(start.getDate() - days);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
};

export default DateRangeSelector;
