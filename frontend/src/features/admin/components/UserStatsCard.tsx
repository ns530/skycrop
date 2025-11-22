import React, { ReactNode } from 'react';

interface UserStatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  bgColor?: string;
}

/**
 * User Stats Card Component
 * Displays a stat card with icon, title, and value
 */
export const UserStatsCard: React.FC<UserStatsCardProps> = ({
  title,
  value,
  icon,
  bgColor = 'bg-blue-50',
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default UserStatsCard;

