import clsx from 'clsx';
import React from 'react';

import { Button } from './Button';
import { Card } from './Card';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Headline/title for the error.
   * Defaults to a generic "Something went wrong" message.
   */
  title?: string;
  /**
   * Optional error message or description.
   * Can be derived from an ApiError or custom copy.
   */
  message?: string;
  /**
   * Optional retry handler. When provided, a retry button is shown.
   */
  onRetry?: () => void;
  /**
   * Label for the retry button. Defaults to "Retry".
   */
  retryLabel?: string;
  /**
   * When true, renders a compact inline variant without a Card wrapper.
   * Useful inside table rows or small sections.
   */
  compact?: boolean;
}

const ErrorIcon: React.FC = () => (
  <span
    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-status-poor/10 text-status-poor"
    aria-hidden="true"
  >
    <svg
      className="h-3 w-3"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 2a8 8 0 1 0 .001 16.001A8 8 0 0 0 10 2Zm0 4a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  </span>
);

/**
 * ErrorState
 *
 * Reusable error presentation component for page and section-level failures.
 * - Default: card with icon, title, message, and optional retry button
 * - Compact: inline row variant suitable for table rows or small sections
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  compact,
  className,
  ...rest
}) => {
  const descriptionId = message ? 'error-state-description' : undefined;

  if (compact) {
    return (
      <div
        className={clsx(
          'inline-flex items-center gap-2 text-sm text-red-700',
          className,
        )}
        role="alert"
        aria-live="assertive"
        aria-describedby={descriptionId}
        {...rest}
      >
        <ErrorIcon />
        <div className="flex flex-col">
          <span className="font-medium">{title}</span>
          {message && (
            <span id={descriptionId} className="text-xs text-red-600">
              {message}
            </span>
          )}
        </div>
        {onRetry && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="ml-2"
            onClick={onRetry}
            aria-label={retryLabel}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={clsx('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div
        className="flex items-start gap-3 text-sm text-gray-800"
        role="alert"
        aria-live="assertive"
        aria-describedby={descriptionId}
        {...rest}
      >
        <ErrorIcon />
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{title}</span>
          {message && (
            <span id={descriptionId} className="mt-0.5 text-xs text-gray-700">
              {message}
            </span>
          )}
        </div>
      </div>
      {onRetry && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onRetry}
            aria-label={retryLabel}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ErrorState;