import React from "react";

import { WeatherForecastCard } from "./WeatherForecastCard";

interface WeatherForecastSectionProps {
  forecast: Array<{
    date: string;
    rain_mm: number;
    tmin: number;
    tmax: number;
    wind: number;
  }>;
  totals: {
    rain_3d_mm: number;
    rain_7d_mm: number;
  };
}

export const WeatherForecastSection: React.FC<WeatherForecastSectionProps> = ({
  forecast,
  totals,
}) => {
  return (
    <section className="space-y-4">
      <h2 className="text-md font-semibold text-gray-900">Weather Forecast</h2>
      <WeatherForecastCard forecast={forecast} totals={totals} />
    </section>
  );
};

export default WeatherForecastSection;
