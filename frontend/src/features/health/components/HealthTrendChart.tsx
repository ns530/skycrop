/**
 * HealthTrendChart Component
 * Interactive chart showing NDVI/health index trends over time
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '../../../shared/ui/Card';
import type { FieldHealthTimeSeries } from '../api/healthApi';

interface HealthTrendChartProps {
  series: FieldHealthTimeSeries | null;
  title?: string;
  height?: number;
}

/**
 * Custom tooltip for chart
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const value = data.value;
  const status = getHealthStatus(value);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-xs font-medium text-gray-900 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.stroke }}
        />
        <p className="text-sm font-semibold" style={{ color: data.stroke }}>
          {value.toFixed(3)}
        </p>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            status === 'excellent'
              ? 'bg-green-100 text-green-800'
              : status === 'good'
              ? 'bg-blue-100 text-blue-800'
              : status === 'fair'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

/**
 * Determine health status from NDVI value
 */
const getHealthStatus = (ndvi: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (ndvi >= 0.7) return 'excellent';
  if (ndvi >= 0.6) return 'good';
  if (ndvi >= 0.4) return 'fair';
  return 'poor';
};

/**
 * Get color based on NDVI value
 */
const getLineColor = (ndvi: number): string => {
  if (ndvi >= 0.7) return '#059669'; // Dark Green
  if (ndvi >= 0.6) return '#10B981'; // Green
  if (ndvi >= 0.4) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
};

/**
 * HealthTrendChart
 * 
 * Shows NDVI/health index trends over time
 * - Interactive line chart
 * - Color-coded by health status
 * - Hover tooltips with details
 * - Reference lines for thresholds
 * - Mobile-responsive
 * 
 * @example
 * ```tsx
 * <HealthTrendChart
 *   series={healthTimeSeries}
 *   title="NDVI Trend (Last 30 Days)"
 * />
 * ```
 */
export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  series,
  title = 'Health Index Trend',
  height = 300,
}) => {
  // No data state
  if (!series || !series.points || series.points.length === 0) {
    return (
      <Card title={title}>
        <div className="text-center py-12">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-sm text-gray-600 mb-1">No trend data available</p>
          <p className="text-xs text-gray-500">
            Health data will appear here once satellite imagery is analyzed
          </p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = series.points.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: point.value,
    color: getLineColor(point.value),
  }));

  // Calculate statistics
  const values = series.points.map((p) => p.value);
  const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const latestValue = values[values.length - 1];
  const trend =
    values.length > 1 ? ((latestValue - values[0]) / values[0]) * 100 : 0;

  // Determine average line color
  const avgColor = getLineColor(avgValue);

  return (
    <Card title={title}>
      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Latest</p>
          <p className="text-lg font-semibold" style={{ color: getLineColor(latestValue) }}>
            {latestValue.toFixed(3)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-semibold" style={{ color: avgColor }}>
            {avgValue.toFixed(3)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Min / Max</p>
          <p className="text-sm font-medium text-gray-900">
            {minValue.toFixed(3)} / {maxValue.toFixed(3)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Trend</p>
          <p
            className={`text-lg font-semibold ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={{ stroke: '#E5E7EB' }}
              label={{
                value: series.indexType.toUpperCase(),
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#6B7280' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              content={() => (
                <div className="flex justify-center gap-4 text-xs mb-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span>Excellent (≥0.7)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>Good (0.6-0.7)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-600" />
                    <span>Fair (0.4-0.6)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-600" />
                    <span>Poor (&lt;0.4)</span>
                  </div>
                </div>
              )}
            />

            {/* Reference lines for thresholds */}
            <ReferenceLine
              y={0.7}
              stroke="#059669"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={0.6}
              stroke="#10B981"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={0.4}
              stroke="#F59E0B"
              strokeDasharray="3 3"
            />

            {/* Main line with gradient color */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> Higher values indicate healthier vegetation. Monitor trends to catch issues early.
        </p>
      </div>
    </Card>
  );
};

export default HealthTrendChart;

