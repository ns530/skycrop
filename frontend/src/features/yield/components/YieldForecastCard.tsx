import React from 'react';

import { Card } from '../../../shared/ui/Card';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import type { YieldForecastRequest } from '../api/yieldApi';
import { useYieldForecast } from '../hooks';

export interface YieldForecastCardProps {
  request: YieldForecastRequest;
  fieldArea?: number; // in hectares
  pricePerKg?: number; // currency per kg
  className?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
};

export const YieldForecastCard: React.FC<YieldForecastCardProps> = ({
  request,
  fieldArea = 1, // default 1 hectare
  pricePerKg = 0.5, // default $0.50 per kg
  className,
}) => {
  const { data, isLoading, error } = useYieldForecast(request);

  if (isLoading) {
    return (
      <Card title="Yield Forecast" className={className}>
        <LoadingState message="Calculating yield forecast..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Yield Forecast" className={className}>
        <ErrorState
          title="Failed to load yield forecast"
          message="Unable to calculate yield prediction. Please try again."
        />
      </Card>
    );
  }

  if (!data?.predictions?.length) {
    return (
      <Card title="Yield Forecast" className={className}>
        <div className="text-center py-8 text-gray-500">
          No yield predictions available
        </div>
      </Card>
    );
  }

  // Use the first prediction (assuming single field for now)
  const prediction = data.predictions[0];
  const yieldKgHa = prediction.yield_kg_per_ha;
  const totalYield = yieldKgHa * fieldArea;
  const revenue = totalYield * pricePerKg;

  // Calculate confidence interval (mock if not provided)
  const confidenceLower = prediction.confidence_lower ?? yieldKgHa * 0.9;
  const confidenceUpper = prediction.confidence_upper ?? yieldKgHa * 1.1;
  const confidenceRange = confidenceUpper - confidenceLower;

  return (
    <Card title="Yield Forecast" className={className}>
      <div className="space-y-4">
        {/* Main yield display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(yieldKgHa)}
            <span className="text-lg font-normal text-gray-500 ml-1">kg/ha</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Predicted yield per hectare</p>
        </div>

        {/* Confidence interval */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Confidence range:</span>
            <span className="font-medium text-gray-900">
              ±{formatNumber(confidenceRange / 2)} kg/ha
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {formatNumber(confidenceLower)} - {formatNumber(confidenceUpper)} kg/ha
          </div>
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

        {/* Field area info */}
        <div className="text-xs text-gray-500 text-center border-t pt-2">
          Based on {formatNumber(fieldArea)} ha field area at ${pricePerKg}/kg
        </div>
      </div>
    </Card>
  );
};

export default YieldForecastCard;