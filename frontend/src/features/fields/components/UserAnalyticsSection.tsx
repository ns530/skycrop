import React from 'react';

import { UserAnalyticsCard } from './UserAnalyticsCard';

interface UserAnalyticsSectionProps {
  totalFields: number;
  totalAssessments: number;
  avgHealthScore: number | null;
  lastActivity: string | null;
  activeUsersToday: number;
  sessionDurationAvg: number;
}

export const UserAnalyticsSection: React.FC<UserAnalyticsSectionProps> = (props) => {
  return (
    <section className="space-y-4">
      <h2 className="text-md font-semibold text-gray-900">User Analytics</h2>
      <UserAnalyticsCard {...props} />
    </section>
  );
};

export default UserAnalyticsSection;