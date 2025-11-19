/**
 * useBoundaryDetection Hook
 * Manages boundary detection with progress simulation
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { detectFieldBoundary } from '../api/fieldsApi';
import type { DetectBoundaryPayload } from '../api/fieldsApi';
import type { FieldGeometry } from '../../../shared/types/geojson';

interface BoundaryDetectionState {
  progress: number;
  currentStep: string;
  estimatedTime: number;
}

interface UseBoundaryDetectionParams {
  fieldId: string;
  location: {
    lat: number;
    lng: number;
  };
}

/**
 * useBoundaryDetection
 * 
 * Hook for detecting field boundaries with AI
 * Provides progress tracking and step-by-step updates
 * 
 * @example
 * ```tsx
 * const { detect, isDetecting, progress, currentStep } = useBoundaryDetection({
 *   fieldId: 'field-123',
 *   location: { lat: 7.94, lng: 81.02 }
 * });
 * 
 * await detect();
 * ```
 */
export const useBoundaryDetection = ({
  fieldId,
  location,
}: UseBoundaryDetectionParams) => {
  const [state, setState] = useState<BoundaryDetectionState>({
    progress: 0,
    currentStep: 'Initializing...',
    estimatedTime: 60,
  });

  const mutation = useMutation<FieldGeometry, Error, void>({
    mutationFn: async () => {
      // Create payload with bounding box around the location
      // Using a ~2km x 2km box (approximately 0.018 degrees at Sri Lanka latitude)
      const offset = 0.009; // ~1km
      const payload: DetectBoundaryPayload = {
        bbox: [
          location.lng - offset, // minLon
          location.lat - offset, // minLat
          location.lng + offset, // maxLon
          location.lat + offset, // maxLat
        ],
      };

      return detectFieldBoundary(fieldId, payload);
    },
  });

  /**
   * Simulate progress during detection
   * Backend detection takes 30-60s, so we show realistic progress
   */
  const simulateProgress = useCallback(() => {
    let progress = 0;
    let intervalId: NodeJS.Timeout;

    const steps = [
      { at: 0, step: 'Retrieving satellite image...', time: 60 },
      { at: 15, step: 'Loading Sentinel-2 data...', time: 50 },
      { at: 25, step: 'Analyzing field boundaries...', time: 45 },
      { at: 40, step: 'Detecting crop patterns...', time: 35 },
      { at: 50, step: 'Identifying field edges...', time: 30 },
      { at: 65, step: 'Refining boundary...', time: 20 },
      { at: 75, step: 'Calculating area...', time: 15 },
      { at: 85, step: 'Validating results...', time: 10 },
      { at: 95, step: 'Finalizing...', time: 5 },
    ];

    const updateProgress = () => {
      progress += 1.5; // Increment by 1.5% each interval

      const currentStepData =
        steps
          .slice()
          .reverse()
          .find((s) => progress >= s.at) || steps[0];

      setState({
        progress: Math.min(progress, 98), // Never reach 100 until actual completion
        currentStep: currentStepData.step,
        estimatedTime: Math.max(0, Math.ceil(currentStepData.time * (1 - progress / 100))),
      });

      if (progress >= 98) {
        clearInterval(intervalId);
      }
    };

    intervalId = setInterval(updateProgress, 500); // Update every 500ms

    return () => clearInterval(intervalId);
  }, []);

  /**
   * Start detection and progress simulation
   */
  const detect = useCallback(async () => {
    // Reset state
    setState({
      progress: 0,
      currentStep: 'Initializing...',
      estimatedTime: 60,
    });

    // Start progress simulation
    const cleanup = simulateProgress();

    try {
      const result = await mutation.mutateAsync();

      // Complete progress
      setState({
        progress: 100,
        currentStep: 'Complete!',
        estimatedTime: 0,
      });

      cleanup();
      return result;
    } catch (error) {
      cleanup();
      throw error;
    }
  }, [mutation, simulateProgress]);

  return {
    detect,
    isDetecting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    progress: state.progress,
    currentStep: state.currentStep,
    estimatedTime: state.estimatedTime,
  };
};

export default useBoundaryDetection;

