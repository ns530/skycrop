import React from "react";

import { Card } from "../../../shared/ui/Card";

interface UserAnalyticsCardProps {
  totalFields: number;
  totalAssessments: number;
  avgHealthScore: number | null;
  lastActivity: string | null;
  activeUsersToday: number;
  sessionDurationAvg: number;
}

export const UserAnalyticsCard: React.FC<UserAnalyticsCardProps> = ({
  totalFields,
  totalAssessments,
  avgHealthScore,
  lastActivity,
  activeUsersToday,
  sessionDurationAvg,
}) => {
  const getStatus = (score: number | null): "excellent" | "fair" | "poor" => {
    if (score === null) return "poor";
    if (score >= 70) return "excellent";
    if (score >= 50) return "fair";
    return "poor";
  };

  const status = getStatus(avgHealthScore);

  return (
    <Card title="User Analytics" status={status} showStatusStripe>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total fields:</span>
          <span className="font-semibold">{totalFields}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Assessments:</span>
          <span className="font-semibold">{totalAssessments}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Avg health score:</span>
          <span className="font-semibold">
            {avgHealthScore !== null ? `${avgHealthScore.toFixed(1)}%` : "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Active today:</span>
          <span className="font-semibold">{activeUsersToday}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Last activity:</span>
          <span className="font-semibold">
            {lastActivity ? new Date(lastActivity).toLocaleDateString() : "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Avg session:</span>
          <span className="font-semibold">
            {sessionDurationAvg ? `${sessionDurationAvg.toFixed(1)}min` : "N/A"}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default UserAnalyticsCard;
