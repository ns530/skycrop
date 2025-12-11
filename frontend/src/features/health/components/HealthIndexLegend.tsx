import React from "react";

import { Card } from "../../../shared/ui/Card";
import type { HealthIndexType } from "../api/healthApi";

export interface HealthIndexLegendProps {
  indexType: HealthIndexType;
}

type LegendRow = {
  label: "Excellent" | "Good" | "Fair" | "Poor";
  rangeHint: string;
  colorClass: string;
};

const BASE_LEGEND: LegendRow[] = [
  {
    label: "Excellent",
    rangeHint: "0.8 – 1.0",
    colorClass: "bg-status-excellent",
  },
  {
    label: "Good",
    rangeHint: "0.6 – 0.8",
    colorClass: "bg-status-excellent/80",
  },
  {
    label: "Fair",
    rangeHint: "0.4 – 0.6",
    colorClass: "bg-status-fair",
  },
  {
    label: "Poor",
    rangeHint: "0.0 – 0.4",
    colorClass: "bg-status-poor",
  },
];

const getIndexDescription = (indexType: HealthIndexType): string => {
  switch (indexType) {
    case "NDVI":
      return "NDVI (Normalized Difference Vegetation Index) approximates green biomass and vigor. Higher values usually indicate healthier vegetation.";
    case "NDWI":
      return "NDWI (Normalized Difference Water Index) highlights leaf water content and surface moisture. Higher values may indicate wetter conditions.";
    case "TDVI":
      return "TDVI (Transformed Difference Vegetation Index) is a variation of NDVI that can be more robust in certain lighting or soil conditions.";
    default:
      return "Vegetation index values are normalized between 0 and 1. These ranges will align with the colors used on the map overlay.";
  }
};

/**
 * HealthIndexLegend
 *
 * Describes the semantic color buckets for the current health index
 * (NDVI / NDWI / TDVI). This legend is intended to match the map overlay.
 */
export const HealthIndexLegend: React.FC<HealthIndexLegendProps> = ({
  indexType,
}) => {
  return (
    <Card title={`${indexType} legend`}>
      <div className="space-y-3">
        <p className="text-xs text-gray-600">
          {getIndexDescription(indexType)}
        </p>
        <ul
          className="space-y-2 text-xs text-gray-700"
          aria-label={`${indexType} color legend`}
        >
          {BASE_LEGEND.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-3 w-3 rounded-full ${row.colorClass}`}
                  aria-hidden="true"
                />
                <span className="font-medium">{row.label}</span>
              </div>
              <span className="tabular-nums text-gray-500">
                {row.rangeHint}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default HealthIndexLegend;
