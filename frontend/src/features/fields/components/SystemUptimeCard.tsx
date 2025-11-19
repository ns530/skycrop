import React from 'react';

import { Card } from '../../../shared/ui/Card';

interface SystemUptimeCardProps {
  uptimeHours: number;
}

export const SystemUptimeCard: React.FC<SystemUptimeCardProps> = ({ uptimeHours }) => {
  const getStatus = (hours: number): 'excellent' | 'fair' | 'poor' => {
    if (hours >= 168) return 'excellent'; // 1 week
    if (hours >= 24) return 'fair'; // 1 day
    return 'poor';
  };

  const status = getStatus(uptimeHours);
  const days = Math.floor(uptimeHours / 24);
  const remainingHours = Math.floor(uptimeHours % 24);

  return (
    <Card title="System Uptime" status={status} showStatusStripe>
      <p className="text-2xl font-semibold text-gray-900">
        {days}d {remainingHours}h
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Continuous operation
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {uptimeHours >= 168 ? 'Excellent reliability' : uptimeHours >= 24 ? 'Good uptime' : 'Recent restart'}
      </p>
    </Card>
  );
};

export default SystemUptimeCard;