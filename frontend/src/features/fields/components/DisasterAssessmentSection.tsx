import React from "react";

import { DisasterAssessmentCard } from "./DisasterAssessmentCard";

interface DisasterAssessment {
  field_id: string;
  field_name: string;
  risk_level: string;
  disaster_types: string[];
  confidence: number;
  assessed_at: string;
}

interface DisasterAssessmentSectionProps {
  assessments: DisasterAssessment[];
  available: boolean;
  highRiskCount: number;
}

export const DisasterAssessmentSection: React.FC<
  DisasterAssessmentSectionProps
> = (props) => {
  return (
    <section className="space-y-4">
      <h2 className="text-md font-semibold text-gray-900">
        Disaster Assessment
      </h2>
      <DisasterAssessmentCard {...props} />
    </section>
  );
};

export default DisasterAssessmentSection;
