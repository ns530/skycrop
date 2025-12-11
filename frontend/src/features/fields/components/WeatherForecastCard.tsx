import React from "react";

import { Card } from "../../../shared/ui/Card";

interface WeatherForecastData {
  date: string;
  rain_mm: number;
  tmin: number;
  tmax: number;
  wind: number;
}

interface WeatherForecastCardProps {
  forecast: WeatherForecastData[];
  totals: {
    rain_3d_mm: number;
    rain_7d_mm: number;
  };
}

export const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({
  forecast,
  totals,
}) => {
  const getStatus = (rain7d: number): "excellent" | "fair" | "poor" => {
    if (rain7d < 10) return "poor"; // Dry
    if (rain7d < 50) return "fair"; // Moderate
    return "excellent"; // Good rainfall
  };

  const status = getStatus(totals.rain_7d_mm);

  return (
    <Card title="7-Day Weather Forecast" status={status} showStatusStripe>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Next 7 days:</span>
          <span className="font-semibold">
            {totals.rain_7d_mm.toFixed(1)}mm rain
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Next 3 days:</span>
          <span className="font-semibold">
            {totals.rain_3d_mm.toFixed(1)}mm rain
          </span>
        </div>
        <div className="mt-3 space-y-1">
          {forecast.slice(0, 3).map((day, index) => (
            <div
              key={day.date}
              className="flex justify-between text-xs text-gray-600"
            >
              <span>Day {index + 1}:</span>
              <span>
                {day.rain_mm.toFixed(1)}mm • {day.tmin}°-{day.tmax}°C
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default WeatherForecastCard;
