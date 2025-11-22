import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFieldYield,
  getFieldYieldHistory,
  getFieldYieldSummary,
  triggerYieldPrediction,
  recordActualYield,
  YieldPrediction,
  YieldHistory,
  YieldSummary,
} from '../api/yieldApi';

/**
 * Hook to fetch current yield prediction for a field
 */
export const useFieldYield = (fieldId: number) => {
  return useQuery<YieldPrediction, Error>({
    queryKey: ['fieldYield', fieldId],
    queryFn: () => getFieldYield(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch yield history for a field
 */
export const useFieldYieldHistory = (
  fieldId: number,
  params?: {
    limit?: number;
    start_year?: number;
    end_year?: number;
  }
) => {
  return useQuery<YieldHistory[], Error>({
    queryKey: ['fieldYieldHistory', fieldId, params],
    queryFn: () => getFieldYieldHistory(fieldId, params),
    enabled: !!fieldId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch yield summary (current + history + trends)
 */
export const useFieldYieldSummary = (fieldId: number) => {
  return useQuery<YieldSummary, Error>({
    queryKey: ['fieldYieldSummary', fieldId],
    queryFn: () => getFieldYieldSummary(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to trigger new yield prediction
 */
export const useTriggerYieldPrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: number) => triggerYieldPrediction(fieldId),
    onSuccess: (_, fieldId) => {
      // Invalidate yield queries to refetch
      queryClient.invalidateQueries({ queryKey: ['fieldYield', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fieldYieldHistory', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fieldYieldSummary', fieldId] });
    },
  });
};

/**
 * Hook to record actual yield
 */
export const useRecordActualYield = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fieldId,
      data,
    }: {
      fieldId: number;
      data: {
        actual_yield: number;
        harvest_date: string;
        crop_type: string;
        notes?: string;
      };
    }) => recordActualYield(fieldId, data),
    onSuccess: (_, { fieldId }) => {
      // Invalidate yield queries to refetch
      queryClient.invalidateQueries({ queryKey: ['fieldYield', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fieldYieldHistory', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['fieldYieldSummary', fieldId] });
    },
  });
};

