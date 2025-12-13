/**
 * BoundaryDetectionProgress Component
 * Progress indicator for AI boundary detection
 */

import React from "react";

interface BoundaryDetectionProgressProps {
  progress: number; // 0-100
  currentStep: string;
  estimatedTime: number; // seconds remaining
}

/**
 * BoundaryDetectionProgress
 *
 * Full-screen progress modal during AI boundary detection
 * Shows progress bar, current step, and estimated time
 *
 * Steps:
 * 1. Retrieving satellite image (0-25%)
 * 2. Analyzing field boundaries (25-50%)
 * 3. Detecting edges (50-75%)
 * 4. Calculating area (75-95%)
 * 5. Finalizing (95-100%)
 */
export const BoundaryDetectionProgress: React.FC<
  BoundaryDetectionProgressProps
> = ({ progress, currentStep, estimatedTime }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue/10 rounded-full mb-3">
            <span className="text-3xl">🛰️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Detecting Field Boundary
          </h2>
          <p className="text-sm text-gray-600">
            Analyzing satellite imagery with AI
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-blue to-blue-500 transition-all duration-500 ease-out rounded-full flex items-center justify-end pr-2"
              style={{ width: `${progress}%` }}
            >
              {progress > 10 && (
                <span className="text-[10px] font-bold text-white drop-shadow">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-center mt-2 text-xs font-medium text-gray-700">
            {Math.round(progress)}% Complete
          </p>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
            <div className="shrink-0">
              <div className="animate-spin h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentStep}
              </p>
            </div>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            Estimated time remaining:{" "}
            <span className="font-semibold text-gray-900">
              {estimatedTime}s
            </span>
          </p>
        </div>

        {/* Progress Steps Indicator */}
        <div className="space-y-2 mb-6">
          <ProgressStep
            label="Retrieve satellite image"
            isComplete={progress > 25}
            isActive={progress <= 25}
          />
          <ProgressStep
            label="Analyze field boundaries"
            isComplete={progress > 50}
            isActive={progress > 25 && progress <= 50}
          />
          <ProgressStep
            label="Detect edges"
            isComplete={progress > 75}
            isActive={progress > 50 && progress <= 75}
          />
          <ProgressStep
            label="Calculate area"
            isComplete={progress > 95}
            isActive={progress > 75 && progress <= 95}
          />
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-900">
            <strong>💡 Tip:</strong> This process usually takes 30-60 seconds.
            We&apos;re using satellite imagery from Sentinel to accurately detect
            your field boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Individual progress step indicator
 */
interface ProgressStepProps {
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

const ProgressStep: React.FC<ProgressStepProps> = ({
  label,
  isComplete,
  isActive,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs
          ${
            isComplete
              ? "bg-green-500 text-white"
              : isActive
                ? "bg-brand-blue text-white animate-pulse"
                : "bg-gray-200 text-gray-400"
          }
        `}
      >
        {isComplete ? "✓" : isActive ? "●" : "○"}
      </div>
      <p
        className={`
          text-xs
          ${
            isComplete
              ? "text-green-700 font-medium"
              : isActive
                ? "text-gray-900 font-medium"
                : "text-gray-500"
          }
        `}
      >
        {label}
      </p>
    </div>
  );
};

export default BoundaryDetectionProgress;
