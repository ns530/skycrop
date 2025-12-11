import React from "react";

export interface ProgressBarVsOptimalProps {
  currentYield: number;
  optimalYield: number;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
};

export const ProgressBarVsOptimal: React.FC<ProgressBarVsOptimalProps> = ({
  currentYield,
  optimalYield,
}) => {
  const percentage = Math.min((currentYield / optimalYield) * 100, 100);
  const isAboveOptimal = currentYield >= optimalYield;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Progress vs Optimal Yield</span>
        <span className="font-medium text-gray-900">
          {formatNumber(percentage)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAboveOptimal ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Current: {formatNumber(currentYield)} kg/ha</span>
        <span>Optimal: {formatNumber(optimalYield)} kg/ha</span>
      </div>
    </div>
  );
};

export default ProgressBarVsOptimal;
