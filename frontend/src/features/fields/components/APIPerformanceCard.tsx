import React from 'react';

import { Card } from '../../../shared/ui/Card';

interface APIPerformanceCardProps {
  avgResponseTimeMs: number | null;
}

export const APIPerformanceCard: React.FC<APIPerformanceCardProps> = ({ avgResponseTimeMs }) => {
  const getStatus = (ms: number | null): 'excellent' | 'fair' | 'poor' => {
    if (ms === null) return 'poor';
    if (ms <= 200) return 'excellent'; // Fast
    if (ms <= 500) return 'fair'; // Acceptable
    return 'poor'; // Slow
  };

  const status = getStatus(avgResponseTimeMs);

  return (
    <Card title="API Performance" status={status} showStatusStripe>
      <p className="text-2xl font-semibold text-gray-900">
        {avgResponseTimeMs !== null ? `${avgResponseTimeMs}ms` : 'N/A'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Average response time • Last hour
      </p>
      {avgResponseTimeMs !== null && (
        <p className="mt-1 text-xs text-gray-500">
          {avgResponseTimeMs <= 200 ? 'Excellent performance' : avgResponseTimeMs <= 500 ? 'Good performance' : 'Needs optimization'}
        </p>
      )}
    </Card>
  );
};

export default APIPerformanceCard;