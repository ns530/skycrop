/**
 * YieldHistoryCard Component
 * Displays historical yield records for a field
 */

import React from "react";

import { Card } from "../../../shared/ui/Card";

export interface YieldRecord {
  id: string;
  harvestDate: string; // ISO date string
  predictedYieldKgPerHa?: number;
  actualYieldKgPerHa: number;
  totalYieldKg?: number;
  accuracy?: number; // Percentage error (MAPE)
  notes?: string;
  createdAt: string;
}

interface YieldHistoryCardProps {
  records: YieldRecord[];
  isLoading?: boolean;
  fieldAreaHa: number;
}

/**
 * YieldHistoryCard
 *
 * Shows table of historical yield entries
 * Compares predicted vs actual yields
 * Calculates accuracy metrics
 *
 * @example
 * ```tsx
 * <YieldHistoryCard
 *   records={yieldHistory}
 *   fieldAreaHa={2.5}
 * />
 * ```
 */
export const YieldHistoryCard: React.FC<YieldHistoryCardProps> = ({
  records,
  isLoading,
  fieldAreaHa,
}) => {
  if (isLoading) {
    return (
      <Card title="Yield History">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card title="Yield History">
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🌾</div>
          <p className="text-sm text-gray-600 mb-1">
            No yield data recorded yet
          </p>
          <p className="text-xs text-gray-500">
            After each harvest, record your actual yield to help improve
            predictions
          </p>
        </div>
      </Card>
    );
  }

  // Calculate average yields
  const avgActual =
    records.reduce((sum, r) => sum + r.actualYieldKgPerHa, 0) / records.length;
  const avgPredicted =
    records
      .filter((r) => r.predictedYieldKgPerHa)
      .reduce((sum, r) => sum + (r.predictedYieldKgPerHa || 0), 0) /
    records.filter((r) => r.predictedYieldKgPerHa).length;

  const avgAccuracy =
    records
      .filter((r) => r.accuracy !== undefined)
      .reduce((sum, r) => sum + (r.accuracy || 0), 0) /
    records.filter((r) => r.accuracy !== undefined).length;

  return (
    <Card title="Yield History">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Actual</p>
          <p className="text-lg font-semibold text-gray-900">
            {avgActual.toFixed(0)}
            <span className="text-xs font-normal text-gray-600 ml-1">
              kg/ha
            </span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Predicted</p>
          <p className="text-lg font-semibold text-gray-900">
            {!isNaN(avgPredicted) ? avgPredicted.toFixed(0) : "—"}
            <span className="text-xs font-normal text-gray-600 ml-1">
              {!isNaN(avgPredicted) && "kg/ha"}
            </span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Accuracy</p>
          <p
            className={`text-lg font-semibold ${
              !isNaN(avgAccuracy) && avgAccuracy < 15
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {!isNaN(avgAccuracy) ? `${(100 - avgAccuracy).toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 px-2 font-medium text-gray-700">
                Harvest Date
              </th>
              <th className="py-2 px-2 font-medium text-gray-700 text-right">
                Predicted
              </th>
              <th className="py-2 px-2 font-medium text-gray-700 text-right">
                Actual
              </th>
              <th className="py-2 px-2 font-medium text-gray-700 text-right">
                Diff
              </th>
              <th className="py-2 px-2 font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const difference = record.predictedYieldKgPerHa
                ? record.actualYieldKgPerHa - record.predictedYieldKgPerHa
                : null;

              return (
                <tr
                  key={record.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(record.harvestDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                      {record.totalYieldKg && (
                        <p className="text-xs text-gray-500">
                          {record.totalYieldKg.toFixed(0)} kg total
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {record.predictedYieldKgPerHa ? (
                      <span className="text-gray-700">
                        {record.predictedYieldKgPerHa.toFixed(0)}
                        <span className="text-xs text-gray-500 ml-1">
                          kg/ha
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-medium text-gray-900">
                      {record.actualYieldKgPerHa.toFixed(0)}
                      <span className="text-xs text-gray-600 font-normal ml-1">
                        kg/ha
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {difference !== null ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          difference >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {difference >= 0 ? "+" : ""}
                        {difference.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {record.notes ? (
                      <span className="text-xs text-gray-600 line-clamp-2">
                        {record.notes}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          💡 <strong>Tip:</strong> Green differences mean you harvested more
          than predicted. This data helps improve future predictions.
        </p>
      </div>
    </Card>
  );
};

export default YieldHistoryCard;
