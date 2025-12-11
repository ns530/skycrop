import React from "react";

/**
 * PageLoader Component
 *
 * Enhanced loading spinner with skeleton UI for better perceived performance
 * Used as Suspense fallback for lazy-loaded pages
 */
export const PageLoader: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-blue"
          role="status"
          aria-label={message}
        >
          <span className="sr-only">{message}</span>
        </div>

        {/* Loading message */}
        <p className="text-sm text-gray-600 font-medium">{message}</p>

        {/* Skeleton content hint */}
        <div className="mt-8 w-full max-w-2xl space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * InlineLoader Component
 *
 * Smaller inline loader for content that's part of a larger page
 */
export const InlineLoader: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-2">
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-brand-blue"
          role="status"
          aria-label={message}
        >
          <span className="sr-only">{message}</span>
        </div>
        {message && <p className="text-xs text-gray-500">{message}</p>}
      </div>
    </div>
  );
};

export default PageLoader;
