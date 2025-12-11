import React from "react";

export interface ComparisonToPreviousSeasonProps {
  currentYield: number;
  previousYield: number;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
};

export const ComparisonToPreviousSeason: React.FC<
  ComparisonToPreviousSeasonProps
> = ({ currentYield, previousYield }) => {
  const difference = currentYield - previousYield;
  const percentageChange = (difference / previousYield) * 100;
  const isIncrease = difference > 0;

  return (
    <div className="bg-blue-50 rounded-lg p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">vs Previous Season</span>
        <span
          className={`font-medium ${isIncrease ? "text-green-600" : "text-red-600"}`}
        >
          {isIncrease ? "+" : ""}
          {formatNumber(percentageChange)}%
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Current: {formatNumber(currentYield)} kg/ha • Previous:{" "}
        {formatNumber(previousYield)} kg/ha
      </div>
    </div>
  );
};

export default ComparisonToPreviousSeason;
