import React from "react";

import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import { useYieldHistory } from "../hooks";

export interface YieldHistoryChartProps {
  fieldId: string;
  className?: string;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const YieldHistoryChart: React.FC<YieldHistoryChartProps> = ({
  fieldId,
  className,
}) => {
  const { data: history, isLoading, error } = useYieldHistory(fieldId);

  if (isLoading) {
    return (
      <Card title="Yield History" className={className}>
        <LoadingState message="Loading yield history..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Yield History" className={className}>
        <ErrorState
          title="Failed to load yield history"
          message="Unable to retrieve historical yield data."
        />
      </Card>
    );
  }

  if (!history?.length) {
    return (
      <Card title="Yield History" className={className}>
        <div className="text-center py-8 text-gray-500">
          No historical yield data available
        </div>
      </Card>
    );
  }

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Data processing
  const yields = history.map((h) => h.yield_kg_per_ha);
  const minYield = Math.min(...yields);
  const maxYield = Math.max(...yields);
  const range = maxYield - minYield || 1;

  // Scale functions
  const xScale = (index: number) =>
    padding + (index / (history.length - 1)) * chartWidth;
  const yScale = (value: number) =>
    height - padding - ((value - minYield) / range) * chartHeight;

  // Generate path for predicted yields
  const predictedPath = history
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${xScale(index)} ${yScale(point.yield_kg_per_ha)}`,
    )
    .join(" ");

  // Generate confidence band (simplified)
  const confidenceBand = history
    .flatMap((point, index) => {
      const lower = point.confidence_lower ?? point.yield_kg_per_ha * 0.9;
      const upper = point.confidence_upper ?? point.yield_kg_per_ha * 1.1;
      const x = xScale(index);
      const yLower = yScale(lower);
      const yUpper = yScale(upper);

      if (index === 0) {
        return [`M ${x} ${yUpper}`, `L ${x} ${yLower}`];
      } else if (index === history.length - 1) {
        return [`L ${x} ${yUpper}`, `L ${x} ${yLower}`, "Z"];
      } else {
        return [`L ${x} ${yUpper}`, `L ${x} ${yLower}`];
      }
    })
    .join(" ");

  return (
    <Card title="Yield History & Predictions" className={className}>
      <div className="space-y-4">
        <svg width={width} height={height} className="w-full h-auto">
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 20"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Confidence band */}
          <path
            d={confidenceBand}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="none"
          />

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#6b7280"
            strokeWidth="1"
          />

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#6b7280"
            strokeWidth="1"
          />

          {/* Predicted yield line */}
          <path
            d={predictedPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {history.map((point, index) => (
            <circle
              key={index}
              cx={xScale(index)}
              cy={yScale(point.yield_kg_per_ha)}
              r="4"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          {/* Y-axis labels */}
          <text
            x={padding - 10}
            y={padding + 5}
            textAnchor="end"
            className="text-xs fill-gray-600"
          >
            {formatNumber(maxYield)}
          </text>
          <text
            x={padding - 10}
            y={height - padding + 5}
            textAnchor="end"
            className="text-xs fill-gray-600"
          >
            {formatNumber(minYield)}
          </text>

          {/* X-axis labels */}
          <text
            x={padding}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            Past
          </text>
          <text
            x={width - padding}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            Future
          </text>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Predicted Yield</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span className="text-gray-600">Confidence Range</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-gray-900">
              {formatNumber(Math.max(...yields))} kg/ha
            </div>
            <div className="text-gray-600">Peak</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {formatNumber(yields.reduce((a, b) => a + b, 0) / yields.length)}{" "}
              kg/ha
            </div>
            <div className="text-gray-600">Average</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{history.length}</div>
            <div className="text-gray-600">Data points</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default YieldHistoryChart;
