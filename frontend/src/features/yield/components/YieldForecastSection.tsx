import React from "react";

import type { YieldForecastRequest } from "../api/yieldApi";

import { EnhancedYieldForecastCard } from "./EnhancedYieldForecastCard";

export interface YieldForecastSectionProps {
  request: YieldForecastRequest;
  fieldArea?: number; // in hectares
  pricePerKg?: number; // currency per kg
  className?: string;
}

export const YieldForecastSection: React.FC<YieldForecastSectionProps> = ({
  request,
  fieldArea = 1,
  pricePerKg = 0.5,
  className,
}) => {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      <h2 className="text-md font-semibold text-gray-900">Yield Forecast</h2>
      <EnhancedYieldForecastCard
        request={request}
        fieldArea={fieldArea}
        pricePerKg={pricePerKg}
      />
    </div>
  );
};

export default YieldForecastSection;
