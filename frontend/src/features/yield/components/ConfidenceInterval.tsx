import React from "react";

export interface ConfidenceIntervalProps {
  confidenceLower: number;
  confidenceUpper: number;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
};

export const ConfidenceInterval: React.FC<ConfidenceIntervalProps> = ({
  confidenceLower,
  confidenceUpper,
}) => {
  const confidenceRange = confidenceUpper - confidenceLower;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">95% Confidence interval:</span>
        <span className="font-medium text-gray-900">
          ±{formatNumber(confidenceRange / 2)} kg/ha
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {formatNumber(confidenceLower)} - {formatNumber(confidenceUpper)} kg/ha
      </div>
    </div>
  );
};

export default ConfidenceInterval;
