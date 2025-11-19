import React from 'react';

import { Card } from '../../../shared/ui/Card';

interface NDVICardProps {
  ndvi: number | null;
  totalRecords: number;
}

export const NDVICard: React.FC<NDVICardProps> = ({ ndvi, totalRecords }) => {
  const getStatus = (value: number | null): 'excellent' | 'fair' | 'poor' => {
    if (value === null) return 'poor';
    if (value >= 0.6) return 'excellent';
    if (value >= 0.4) return 'fair';
    return 'poor';
  };

  const status = getStatus(ndvi);

  return (
    <Card title="NDVI (Vegetation Index)" status={status} showStatusStripe>
      <p className="text-2xl font-semibold text-gray-900">
        {ndvi !== null ? ndvi.toFixed(3) : 'N/A'}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        {totalRecords} measurements • Last 30 days
      </p>
      {ndvi !== null && (
        <p className="mt-1 text-xs text-gray-500">
          {ndvi >= 0.6 ? 'Healthy vegetation' : ndvi >= 0.4 ? 'Moderate health' : 'Poor vegetation'}
        </p>
      )}
    </Card>
  );
};

export default NDVICard;