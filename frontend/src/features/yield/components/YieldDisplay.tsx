import React from "react";

export interface YieldDisplayProps {
  yieldKgHa: number;
  totalYield: number;
  revenue: number;
  pricePerKg: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
};

export const YieldDisplay: React.FC<YieldDisplayProps> = ({
  yieldKgHa,
  totalYield,
  revenue,
  pricePerKg: _pricePerKg,
}) => {
  return (
    <div className="space-y-4">
      {/* Main yield display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900">
          {formatNumber(yieldKgHa)}
          <span className="text-lg font-normal text-gray-500 ml-1">kg/ha</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Predicted yield per hectare
        </p>
      </div>

      {/* Total yield and revenue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(totalYield)} kg
          </div>
          <p className="text-xs text-gray-600">Total yield</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {formatCurrency(revenue)}
          </div>
          <p className="text-xs text-gray-600">Expected revenue</p>
        </div>
      </div>
    </div>
  );
};

export default YieldDisplay;
