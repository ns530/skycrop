import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import type {
  Recommendation,
  RecommendationStatus,
} from "../api/recommendationApi";

import { RecommendationCard } from "./RecommendationCard";

const createRecommendation = (
  overrides: Partial<Recommendation> = {},
): Recommendation => ({
  id: "rec-1",
  fieldId: "field-1",
  title: "Irrigate north block",
  description: "Apply 20mm irrigation in next 24h.",
  status: "planned",
  priority: "high",
  recommendedAt: "2025-01-01T00:00:00.000Z",
  applyBefore: "2025-01-02T00:00:00.000Z",
  appliedAt: undefined,
  weatherHint: "Apply before heavy rain.",
  ...overrides,
});

describe("RecommendationCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["planned", "overdue"] as RecommendationStatus[])(
    'renders "Mark as applied" button and calls onApply when status=%s',
    (status) => {
      const recommendation = createRecommendation({ status });
      const onApply = jest.fn();

      render(
        <RecommendationCard
          recommendation={recommendation}
          onApply={onApply}
          isApplying={false}
        />,
      );

      expect(screen.getByText(recommendation.title)).toBeInTheDocument();

      const applyButton = screen.getByRole("button", {
        name: /mark recommendation/i,
      });

      expect(applyButton).toBeEnabled();

      fireEvent.click(applyButton);

      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onApply).toHaveBeenCalledWith(recommendation.id);
    },
  );

  it("shows saving state and disables button when isApplying is true", () => {
    const recommendation = createRecommendation({ status: "planned" });
    const onApply = jest.fn();

    render(
      <RecommendationCard
        recommendation={recommendation}
        onApply={onApply}
        isApplying={true}
      />,
    );

    const applyButton = screen.getByRole("button", {
      name: /saving application/i,
    });

    expect(applyButton).toBeDisabled();
    expect(applyButton).toHaveTextContent(/saving…/i);
  });

  it("does not render apply button when status is applied", () => {
    const recommendation = createRecommendation({
      status: "applied",
      appliedAt: "2025-01-03T00:00:00.000Z",
    });

    const onApply = jest.fn();

    render(
      <RecommendationCard
        recommendation={recommendation}
        onApply={onApply}
        isApplying={false}
      />,
    );

    expect(screen.getByText(/status:\s*applied/i)).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /mark recommendation/i,
      }),
    ).not.toBeInTheDocument();
  });
});
