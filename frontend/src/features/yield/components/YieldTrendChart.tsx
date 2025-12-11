/**
 * YieldTrendChart Component
 * Interactive chart showing yield trends over multiple seasons
 */

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  TooltipProps,
} from "recharts";

import { Card } from "../../../shared/ui/Card";
import type { ActualYieldRecord } from "../api/yieldApi";

interface ChartDataPoint {
  date: string;
  actual: number;
  predicted: number | null;
  notes: string;
}

interface TooltipPayload {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

interface YieldTrendChartProps {
  records: ActualYieldRecord[];
  title?: string;
  height?: number;
  showPredictions?: boolean;
}

/**
 * Custom tooltip for chart
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || !payload.length) return null;

  const actualData = payload.find(
    (p: TooltipPayload) => p.dataKey === "actual",
  );
  const predictedData = payload.find(
    (p: TooltipPayload) => p.dataKey === "predicted",
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-xs font-medium text-gray-900 mb-2">{label}</p>

      {actualData && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded bg-green-600" />
          <span className="text-xs text-gray-600">Actual:</span>
          <span className="text-sm font-semibold text-green-700">
            {actualData.value.toFixed(0)} kg/ha
          </span>
        </div>
      )}

      {predictedData && predictedData.value && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-600" />
          <span className="text-xs text-gray-600">Predicted:</span>
          <span className="text-sm font-semibold text-blue-700">
            {predictedData.value.toFixed(0)} kg/ha
          </span>
        </div>
      )}

      {actualData && predictedData && predictedData.value && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Difference:{" "}
            <span
              className={`font-medium ${
                actualData.value > predictedData.value
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {actualData.value > predictedData.value ? "+" : ""}
              {(actualData.value - predictedData.value).toFixed(0)} kg/ha
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * YieldTrendChart
 *
 * Shows yield trends over multiple harvests
 * - Bar chart for actual yields
 * - Line overlay for predicted yields
 * - Comparison visualization
 * - Season-over-season growth
 *
 * @example
 * ```tsx
 * <YieldTrendChart
 *   records={yieldRecords}
 *   showPredictions
 * />
 * ```
 */
export const YieldTrendChart: React.FC<YieldTrendChartProps> = ({
  records,
  title = "Yield History",
  height = 350,
  showPredictions = true,
}) => {
  // No data state
  if (!records || records.length === 0) {
    return (
      <Card title={title}>
        <div className="text-center py-12">
          <div className="text-4xl mb-2">🌾</div>
          <p className="text-sm text-gray-600 mb-1">
            No yield data recorded yet
          </p>
          <p className="text-xs text-gray-500">
            Record your harvest yields to see trends over time
          </p>
        </div>
      </Card>
    );
  }

  // Prepare chart data (sorted by date)
  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(a.harvestDate).getTime() - new Date(b.harvestDate).getTime(),
  );

  const chartData = sortedRecords.map((record) => ({
    date: new Date(record.harvestDate).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    actual: record.actualYieldKgPerHa,
    predicted: record.predictedYieldKgPerHa || null,
    notes: record.notes,
  }));

  // Calculate statistics
  const actualYields = records.map((r) => r.actualYieldKgPerHa);
  const avgYield =
    actualYields.reduce((sum, y) => sum + y, 0) / actualYields.length;
  const minYield = Math.min(...actualYields);
  const maxYield = Math.max(...actualYields);
  const latestYield = actualYields[actualYields.length - 1];

  // Calculate growth trend
  const firstYield = actualYields[0];
  const growthRate =
    actualYields.length > 1
      ? ((latestYield - firstYield) / firstYield) * 100
      : 0;

  // Calculate prediction accuracy
  const recordsWithPredictions = records.filter((r) => r.predictedYieldKgPerHa);
  const avgAccuracy =
    recordsWithPredictions.length > 0
      ? recordsWithPredictions.reduce((sum, r) => {
          const error = Math.abs(
            r.actualYieldKgPerHa - (r.predictedYieldKgPerHa || 0),
          );
          const mape = (error / r.actualYieldKgPerHa) * 100;
          return sum + (100 - mape);
        }, 0) / recordsWithPredictions.length
      : null;

  return (
    <Card title={title}>
      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Latest</p>
          <p className="text-lg font-semibold text-gray-900">
            {latestYield.toFixed(0)}
            <span className="text-xs font-normal text-gray-600 ml-1">
              kg/ha
            </span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-semibold text-gray-900">
            {avgYield.toFixed(0)}
            <span className="text-xs font-normal text-gray-600 ml-1">
              kg/ha
            </span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Range</p>
          <p className="text-sm font-medium text-gray-900">
            {minYield.toFixed(0)} - {maxYield.toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Growth</p>
          <p
            className={`text-lg font-semibold ${
              growthRate > 0
                ? "text-green-600"
                : growthRate < 0
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
            {growthRate > 0 ? "↑" : growthRate < 0 ? "↓" : "→"}{" "}
            {Math.abs(growthRate).toFixed(1)}%
          </p>
        </div>
      </div>

      {avgAccuracy !== null && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Prediction Accuracy: {avgAccuracy.toFixed(1)}%
          </p>
          <p className="text-xs text-blue-700">
            Based on {recordsWithPredictions.length} harvest(s) with predictions
          </p>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={{ stroke: "#E5E7EB" }}
              label={{
                value: "Yield (kg/ha)",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#6B7280" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              content={() => (
                <div className="flex justify-center gap-4 text-xs mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-3 rounded bg-green-600" />
                    <span>Actual Yield</span>
                  </div>
                  {showPredictions && (
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-0.5 bg-blue-600" />
                      <span>Predicted Yield</span>
                    </div>
                  )}
                </div>
              )}
            />

            {/* Average yield reference line */}
            <ReferenceLine
              y={avgYield}
              stroke="#9CA3AF"
              strokeDasharray="3 3"
              label={{
                value: `Avg: ${avgYield.toFixed(0)}`,
                fontSize: 10,
                fill: "#6B7280",
                position: "right" as const,
              }}
            />

            {/* Actual yield bars */}
            <Bar dataKey="actual" fill="#10B981" radius={[4, 4, 0, 0]} />

            {/* Predicted yield line */}
            {showPredictions && (
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> Track your yields over time to identify
          patterns and improve farming practices.
          {avgAccuracy !== null &&
            avgAccuracy > 85 &&
            " Your predictions are highly accurate!"}
        </p>
      </div>
    </Card>
  );
};

export default YieldTrendChart;
