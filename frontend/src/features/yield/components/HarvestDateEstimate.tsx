import React from 'react';

export interface HarvestDateEstimateProps {
  harvestDate: string;
}

export const HarvestDateEstimate: React.FC<HarvestDateEstimateProps> = ({
  harvestDate,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const daysUntilHarvest = (): number => {
    const today = new Date();
    const harvest = new Date(harvestDate);
    const diffTime = harvest.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = daysUntilHarvest();

  return (
    <div className="bg-green-50 rounded-lg p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Estimated Harvest Date</span>
        <span className="font-medium text-gray-900">
          {days > 0 ? `${days} days` : 'Ready'}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {formatDate(harvestDate)}
      </div>
    </div>
  );
};

export default HarvestDateEstimate;