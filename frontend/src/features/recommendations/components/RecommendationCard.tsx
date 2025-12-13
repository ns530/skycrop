// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import React from "react";

import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import type {
  Recommendation,
  RecommendationStatus,
  RecommendationPriority,
} from "../api/recommendationApi";

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onApply?(id: string): void;
  isApplying?: boolean;
}

const statusStyles: Record<
  RecommendationStatus,
  { label: string; className: string }
> = {
  planned: {
    label: "Planned",
    className: "bg-blue-50 text-blue-800 border border-blue-100",
  },
  applied: {
    label: "Applied",
    className: "bg-green-50 text-green-800 border border-green-100",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-50 text-red-800 border border-red-100",
  },
};

const priorityStyles: Record<
  RecommendationPriority,
  { label: string; className: string }
> = {
  high: {
    label: "High",
    className: "bg-red-50 text-red-800 border border-red-100",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-50 text-amber-800 border border-amber-100",
  },
  low: {
    label: "Low",
    className: "bg-slate-50 text-slate-700 border border-slate-200",
  },
};

const formatDate = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString();
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApply,
  isApplying = false,
}) => {
  const {
    id,
    title,
    description,
    status,
    priority,
    recommendedAt,
    applyBefore,
    appliedAt,
    weatherHint,
  } = recommendation;

  const statusConfig = statusStyles[status];
  const priorityConfig = priorityStyles[priority];

  const titleId = `recommendation-${id}-title`;

  const recommendedOnLabel = formatDate(recommendedAt);
  const applyBeforeLabel = formatDate(applyBefore);
  const appliedAtLabel = formatDate(appliedAt);

  const canApply =
    (status === "planned" || status === "overdue") && Boolean(onApply);

  const handleApplyClick = () => {
    if (!onApply) return;
    onApply(id);
  };

  return (
    <article aria-labelledby={titleId} className="flex flex-col">
      <Card className="h-full">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 id={titleId} className="text-sm font-semibold text-gray-900">
              {title}
            </h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
                statusConfig.className,
              )}
            >
              Status: {statusConfig.label}
            </span>
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
                priorityConfig.className,
              )}
            >
              Priority: {priorityConfig.label}
            </span>
          </div>
        </header>

        <div className="mt-3 space-y-2 text-xs text-gray-600">
          {recommendedOnLabel && (
            <p>
              <span className="font-medium text-gray-700">Recommended on:</span>{" "}
              {recommendedOnLabel}
            </p>
          )}
          {applyBeforeLabel && (
            <p>
              <span className="font-medium text-gray-700">Apply before:</span>{" "}
              {applyBeforeLabel}
            </p>
          )}
          {appliedAtLabel && (
            <p>
              <span className="font-medium text-gray-700">Applied on:</span>{" "}
              {appliedAtLabel}
            </p>
          )}
        </div>

        {weatherHint && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-800">
              <span aria-hidden="true">☁</span>
              <span className="uppercase tracking-wide">Weather hint</span>
              <span className="sr-only">:</span>
              <span className="normal-case font-normal">{weatherHint}</span>
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            {status === "applied"
              ? "This recommendation has been marked as applied."
              : "Review and apply this recommendation when appropriate."}
          </p>
          {canApply && (
            <Button
              size="sm"
              variant={status === "overdue" ? "primary" : "secondary"}
              onClick={handleApplyClick}
              disabled={isApplying}
              aria-label={
                isApplying
                  ? `Saving application for recommendation "${title}"`
                  : `Mark recommendation "${title}" as applied`
              }
            >
              {isApplying ? "Saving…" : "Mark as applied"}
            </Button>
          )}
        </div>
      </Card>
    </article>
  );
};

export default RecommendationCard;
