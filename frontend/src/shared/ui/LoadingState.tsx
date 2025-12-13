// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import React from "react";

import { Card } from "./Card";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Primary loading message.
   * Defaults to a generic "Loading…" label.
   */
  message?: string;
  /**
   * Optional supporting description, e.g. what is being loaded.
   */
  description?: string;
  /**
   * When true, renders a compact inline variant without a Card wrapper.
   * Useful inside table rows or small sections.
   */
  compact?: boolean;
}

const Spinner: React.FC = () => (
  <span
    className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-gray-300 border-t-brand-blue animate-spin"
    aria-hidden="true"
  />
);

/**
 * LoadingState
 *
 * Reusable loading presentation component for page and section-level states.
 * - Default: centered content inside a Card
 * - Compact: inline row (spinner + text) without Card wrapper
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading…",
  description,
  compact,
  className,
  ...rest
}) => {
  const descriptionId = description ? "loading-description" : undefined;

  if (compact) {
    return (
      <div
        className={clsx(
          "inline-flex items-center gap-2 text-sm text-gray-600",
          className,
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-describedby={descriptionId}
        {...rest}
      >
        <Spinner />
        <div className="flex flex-col">
          <span>{message}</span>
          {description && (
            <span id={descriptionId} className="text-xs text-gray-500">
              {description}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={clsx("flex items-center justify-center", className)}>
      <div
        className="flex items-center gap-3 text-sm text-gray-700"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-describedby={descriptionId}
        {...rest}
      >
        <Spinner />
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{message}</span>
          {description && (
            <span id={descriptionId} className="mt-0.5 text-xs text-gray-600">
              {description}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LoadingState;
