import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '../../../shared/api';
import { recommendationKeys } from '../../../shared/query/queryKeys';
import {
  getRecommendationsForField,
  applyRecommendation,
  type Recommendation,
  type RecommendationStatus,
} from '../api/recommendationApi';

/**
 * useRecommendations
 *
 * Fetch recommendations for a given field.
 */
export const useRecommendations = (fieldId: string) =>
  useQuery<Recommendation[], ApiError>({
    queryKey: recommendationKeys.field(fieldId),
    queryFn: () => getRecommendationsForField(fieldId),
    enabled: Boolean(fieldId),
  });

type ApplyRecommendationVariables = {
  id: string;
  fieldId: string;
  payload?: {
    appliedAt?: string;
  };
};

type ApplyRecommendationContext = {
  previousRecommendations?: Recommendation[];
};

/**
 * useApplyRecommendation
 *
 * Apply a recommendation with optimistic UI update.
 */
export const useApplyRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation<Recommendation, ApiError, ApplyRecommendationVariables, ApplyRecommendationContext>({
    mutationFn: ({ id, payload }: ApplyRecommendationVariables) => applyRecommendation(id, payload),
    onMutate: async ({ fieldId, id, payload }: ApplyRecommendationVariables) => {
      await queryClient.cancelQueries({ queryKey: recommendationKeys.field(fieldId) });

      const previousRecommendations =
        queryClient.getQueryData<Recommendation[]>(recommendationKeys.field(fieldId));

      const appliedAt = payload?.appliedAt ?? new Date().toISOString();

      if (previousRecommendations) {
        const next: Recommendation[] = previousRecommendations.map((rec: Recommendation) =>
          rec.id === id
            ? {
                ...rec,
                status: 'applied' as RecommendationStatus,
                appliedAt,
              }
            : rec,
        );
        queryClient.setQueryData<Recommendation[]>(recommendationKeys.field(fieldId), next);
      }

      return { previousRecommendations };
    },
    onError: (_error: ApiError, { fieldId }: ApplyRecommendationVariables, context?: ApplyRecommendationContext) => {
      // Roll back optimistic update
      if (context?.previousRecommendations) {
        queryClient.setQueryData<Recommendation[]>(
          recommendationKeys.field(fieldId),
          context.previousRecommendations,
        );
      }
    },
    onSettled: (_data: Recommendation | undefined, _error: ApiError | null, { fieldId }: ApplyRecommendationVariables) => {
      void queryClient.invalidateQueries({ queryKey: recommendationKeys.field(fieldId) });
    },
  });
};