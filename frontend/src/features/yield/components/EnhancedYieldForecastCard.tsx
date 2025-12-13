import React from "react";

import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import type { YieldForecastRequest } from "../api/yieldApi";
import { useYieldForecast } from "../hooks";

import { ComparisonToPreviousSeason } from "./ComparisonToPreviousSeason";
import { ConfidenceInterval } from "./ConfidenceInterval";
import { HarvestDateEstimate } from "./HarvestDateEstimate";
import { ProgressBarVsOptimal } from "./ProgressBarVsOptimal";
import { WhatsAppShareButton } from "./WhatsAppShareButton";
import { YieldDisplay } from "./YieldDisplay";

export interface EnhancedYieldForecastCardProps {
  request: YieldForecastRequest;
  fieldArea?: number; // in hectares
  pricePerKg?: number; // currency per kg
  className?: string;
}

const _formatCurrency = (amount: number): string => {
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

export const EnhancedYieldForecastCard: React.FC<
  EnhancedYieldForecastCardProps
> = ({ request, fieldArea = 1, pricePerKg = 0.5, className }) => {
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

  const optimalYield = prediction.optimal_yield ?? 5500;
  const previousSeasonYield = prediction.previous_season_yield ?? 4800;
  const harvestDate = prediction.harvest_date ?? "2025-03-15";

  return (
    <Card title="Yield Forecast" className={className}>
      <div className="space-y-6">
        {/* Main yield display */}
        <YieldDisplay
          yieldKgHa={yieldKgHa}
          totalYield={totalYield}
          revenue={revenue}
          pricePerKg={pricePerKg}
        />

        {/* Confidence interval */}
        <ConfidenceInterval
          confidenceLower={confidenceLower}
          confidenceUpper={confidenceUpper}
        />

        {/* Progress bar vs optimal */}
        <ProgressBarVsOptimal
          currentYield={yieldKgHa}
          optimalYield={optimalYield}
        />

        {/* Comparison to previous season */}
        <ComparisonToPreviousSeason
          currentYield={yieldKgHa}
          previousYield={previousSeasonYield}
        />

        {/* Harvest date estimate */}
        <HarvestDateEstimate harvestDate={harvestDate} />

        {/* WhatsApp share button */}
        <WhatsAppShareButton
          yieldKgHa={yieldKgHa}
          totalYield={totalYield}
          revenue={revenue}
          harvestDate={harvestDate}
        />

        {/* Field area info */}
        <div className="text-xs text-gray-500 text-center border-t pt-2">
          Based on {formatNumber(fieldArea)} ha field area at ${pricePerKg}/kg
        </div>
      </div>
    </Card>
  );
};

export default EnhancedYieldForecastCard;
