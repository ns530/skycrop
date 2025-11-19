import React from 'react';

import type {
  Recommendation,
  RecommendationStatus,
  RecommendationPriority,
} from '../api/recommendationApi';

import { RecommendationCard } from './RecommendationCard';

export interface RecommendationsListProps {
  recommendations: Recommendation[];
  onApply(id: string): void;
  applyingId?: string;
}

const statusOrder: Record<RecommendationStatus, number> = {
  overdue: 0,
  planned: 1,
  applied: 2,
};

const priorityOrder: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const sortActive = (items: Recommendation[]): Recommendation[] => {
  return [...items].sort((a: Recommendation, b: Recommendation) => {
    const statusDiff =
      statusOrder[a.status as RecommendationStatus] -
      statusOrder[b.status as RecommendationStatus];
    if (statusDiff !== 0) return statusDiff;

    const priorityDiff =
      priorityOrder[a.priority as RecommendationPriority] -
      priorityOrder[b.priority as RecommendationPriority];
    if (priorityDiff !== 0) return priorityDiff;

    const aTime = Date.parse(a.recommendedAt);
    const bTime = Date.parse(b.recommendedAt);
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) {
      return aTime - bTime;
    }
    return 0;
  });
};

const sortHistory = (items: Recommendation[]): Recommendation[] => {
  return [...items].sort((a: Recommendation, b: Recommendation) => {
    const aTime = a.appliedAt ? Date.parse(a.appliedAt) : 0;
    const bTime = b.appliedAt ? Date.parse(b.appliedAt) : 0;
    return bTime - aTime;
  });
};

export const RecommendationsList: React.FC<RecommendationsListProps> = ({
  recommendations,
  onApply,
  applyingId,
}) => {
  const active = recommendations.filter(
    (rec: Recommendation) => rec.status === 'planned' || rec.status === 'overdue',
  );
  const history = recommendations.filter(
    (rec: Recommendation) => rec.status === 'applied',
  );

  const sortedActive = sortActive(active);
  const sortedHistory = sortHistory(history);

  const hasActive = sortedActive.length > 0;
  const hasHistory = sortedHistory.length > 0;

  if (!hasActive && !hasHistory) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
        No recommendations available yet. As health and weather signals update,
        this panel will surface prioritized actions for this field.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasActive && (
        <section aria-labelledby="upcoming-recommendations-heading" className="space-y-3">
          <header className="flex items-baseline justify-between gap-2">
            <h2
              id="upcoming-recommendations-heading"
              className="text-sm font-semibold text-gray-900"
            >
              Upcoming actions
            </h2>
            <p className="text-xs text-gray-500">
              Overdue items appear first, followed by planned actions by priority.
            </p>
          </header>
          <div className="space-y-3">
            {sortedActive.map((rec: Recommendation) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onApply={onApply}
                isApplying={applyingId === rec.id}
              />
            ))}
          </div>
        </section>
      )}

      {hasHistory && (
        <section aria-labelledby="history-recommendations-heading" className="space-y-3">
          <header className="flex items-baseline justify-between gap-2">
            <h2
              id="history-recommendations-heading"
              className="text-sm font-semibold text-gray-900"
            >
              History
            </h2>
            <p className="text-xs text-gray-500">
              Applied recommendations, with the most recent actions first.
            </p>
          </header>
          <div className="space-y-3">
            {sortedHistory.map((rec: Recommendation) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onApply={onApply}
                isApplying={applyingId === rec.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default RecommendationsList;