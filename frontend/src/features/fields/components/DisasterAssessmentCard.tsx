import React from 'react';

import { Card } from '../../../shared/ui/Card';

interface DisasterAssessment {
  field_id: string;
  field_name: string;
  risk_level: string;
  disaster_types: string[];
  confidence: number;
  assessed_at: string;
}

interface DisasterAssessmentCardProps {
  assessments: DisasterAssessment[];
  available: boolean;
  highRiskCount: number;
}

export const DisasterAssessmentCard: React.FC<DisasterAssessmentCardProps> = ({
  assessments,
  available,
  highRiskCount
}) => {
  const getStatus = (highRiskCount: number): 'excellent' | 'fair' | 'poor' => {
    if (highRiskCount === 0) return 'excellent';
    if (highRiskCount <= 2) return 'fair';
    return 'poor';
  };

  const status = getStatus(highRiskCount);

  if (!available) {
    return (
      <Card title="Disaster Assessment" status="poor" showStatusStripe>
        <p className="text-sm text-gray-600">Assessment not available</p>
      </Card>
    );
  }

  return (
    <Card title="Disaster Assessment" status={status} showStatusStripe>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>High risk fields:</span>
          <span className="font-semibold">{highRiskCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total assessed:</span>
          <span className="font-semibold">{assessments.length}</span>
        </div>
        {assessments.length > 0 && (
          <div className="mt-3 space-y-1">
            {assessments.slice(0, 3).map((assessment) => (
              <div key={assessment.field_id} className="flex justify-between text-xs text-gray-600">
                <span>{assessment.field_name}:</span>
                <span className={`font-semibold ${
                  assessment.risk_level === 'high' ? 'text-red-600' :
                  assessment.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {assessment.risk_level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DisasterAssessmentCard;