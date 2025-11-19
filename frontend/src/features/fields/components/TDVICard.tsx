import React from 'react';

import { Card } from '../../../shared/ui/Card';

interface TDVICardProps {
  tdvi: number | null;
  totalRecords: number;
}

export const TDVICard: React.FC<TDVICardProps> = ({ tdvi, totalRecords }) => {
  const getStatus = (value: number | null): 'excellent' | 'fair' | 'poor' => {
    if (value === null) return 'poor';
    if (value <= 0.1) return 'excellent'; // Low temperature difference = healthy
    if (value <= 0.2) return 'fair';
    return 'poor'; // High temperature difference = stress
  };

  const status = getStatus(tdvi);

  return (
    <Card title="TDVI (Temperature Difference)" status={status} showStatusStripe>
      <p className="text-2xl font-semibold text-gray-900">
        {tdvi !== null ? tdvi.toFixed(3) : 'N/A'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {totalRecords} measurements • Last 30 days
      </p>
      {tdvi !== null && (
        <p className="mt-1 text-xs text-gray-500">
          {tdvi <= 0.1 ? 'Low thermal stress' : tdvi <= 0.2 ? 'Moderate stress' : 'High thermal stress'}
        </p>
      )}
    </Card>
  );
};

export default TDVICard;