import React from "react";

import { Card } from "../../../shared/ui/Card";

interface NDWICardProps {
  ndwi: number | null;
  totalRecords: number;
}

export const NDWICard: React.FC<NDWICardProps> = ({ ndwi, totalRecords }) => {
  const getStatus = (value: number | null): "excellent" | "fair" | "poor" => {
    if (value === null) return "poor";
    if (value <= -0.2) return "excellent"; // Low water content = healthy
    if (value <= 0.0) return "fair";
    return "poor"; // High water content = potential stress
  };

  const status = getStatus(ndwi);

  return (
    <Card title="NDWI (Water Index)" status={status} showStatusStripe>
      <p className="text-2xl font-semibold text-gray-900">
        {ndwi !== null ? ndwi.toFixed(3) : "N/A"}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {totalRecords} measurements • Last 30 days
      </p>
      {ndwi !== null && (
        <p className="mt-1 text-xs text-gray-500">
          {ndwi <= -0.2
            ? "Low water stress"
            : ndwi <= 0.0
              ? "Moderate moisture"
              : "High water content"}
        </p>
      )}
    </Card>
  );
};

export default NDWICard;
