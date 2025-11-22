import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFieldHealth,
  getFieldHealthHistory,
  getFieldHealthSummary,
  triggerHealthAnalysis,
  HealthAnalysis,
  HealthHistory,
  HealthSummary,
} from '../api/healthApi';

/**
 * Hook to fetch current health analysis for a field
 */
export const useFieldHealth = (fieldId: number) => {
  return useQuery<HealthAnalysis, Error>({
    queryKey: ['fieldHealth', fieldId],
    queryFn: () => getFieldHealth(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch health history for a field
 */
export const useFieldHealthHistory = (
  fieldId: number,
  params?: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  }
) => {
  return useQuery<HealthHistory[], Error>({
    queryKey: ['fieldHealthHistory', fieldId, params],
    queryFn: () => getFieldHealthHistory(fieldId, params),
    enabled: !!fieldId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch health summary (current + history + trends)
 */
export const useFieldHealthSummary = (fieldId: number) => {
  return useQuery<HealthSummary, Error>({
    queryKey: ['fieldHealthSummary', fieldId],
    queryFn: () => getFieldHealthSummary(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to trigger new health analysis
 */
export const useTriggerHealthAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: number) => triggerHealthAnalysis(fieldId),
    onSuccess: (_, fieldId) => {
      // Invalidate health queries to refetch
      queryClient.invalidateQueries({ queryKey: ['fieldHealth', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fieldHealthHistory', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fieldHealthSummary', fieldId] });
    },
  });
};

