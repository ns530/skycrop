import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFieldRecommendations,
  getRecommendationById,
  getRecommendationsSummary,
  updateRecommendationStatus,
  generateRecommendations,
  Recommendation,
  RecommendationSummary,
} from '../api/recommendationsApi';

/**
 * Hook to fetch recommendations for a field
 */
export const useFieldRecommendations = (
  fieldId: number,
  params?: {
    category?: string;
    priority?: string;
    status?: string;
    limit?: number;
  }
) => {
  return useQuery<Recommendation[], Error>({
    queryKey: ['fieldRecommendations', fieldId, params],
    queryFn: () => getFieldRecommendations(fieldId, params),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a specific recommendation
 */
export const useRecommendation = (fieldId: number, recommendationId: number) => {
  return useQuery<Recommendation, Error>({
    queryKey: ['recommendation', fieldId, recommendationId],
    queryFn: () => getRecommendationById(fieldId, recommendationId),
    enabled: !!fieldId && !!recommendationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch recommendations summary
 */
export const useRecommendationsSummary = (fieldId: number) => {
  return useQuery<RecommendationSummary, Error>({
    queryKey: ['recommendationsSummary', fieldId],
    queryFn: () => getRecommendationsSummary(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update recommendation status
 */
export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fieldId,
      recommendationId,
      status,
    }: {
      fieldId: number;
      recommendationId: number;
      status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
    }) => updateRecommendationStatus(fieldId, recommendationId, status),
    onSuccess: (_, { fieldId }) => {
      // Invalidate recommendations queries to refetch
      queryClient.invalidateQueries({ queryKey: ['fieldRecommendations', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['recommendationsSummary', fieldId] });
    },
  });
};

/**
 * Hook to generate new recommendations
 */
export const useGenerateRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: number) => generateRecommendations(fieldId),
    onSuccess: (_, fieldId) => {
      // Invalidate recommendations queries to refetch
      queryClient.invalidateQueries({ queryKey: ['fieldRecommendations', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['recommendationsSummary', fieldId] });
    },
  });
};

