/**
 * useFields Hook - React Query hooks for fields data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fieldsApi, type Field, type FieldSummary, type CreateFieldPayload, type UpdateFieldPayload, type ListFieldsParams } from '../api/fieldsApi';
import { handleApiError, type ApiError } from '../api/client';

// Query keys
export const fieldKeys = {
  all: ['fields'] as const,
  lists: () => [...fieldKeys.all, 'list'] as const,
  list: (params?: ListFieldsParams) => [...fieldKeys.lists(), params] as const,
  details: () => [...fieldKeys.all, 'detail'] as const,
  detail: (id: string) => [...fieldKeys.details(), id] as const,
  health: (id: string) => [...fieldKeys.detail(id), 'health'] as const,
  recommendations: (id: string) => [...fieldKeys.detail(id), 'recommendations'] as const,
};

/**
 * Hook to fetch list of fields
 */
export const useFields = (params?: ListFieldsParams) => {
  return useQuery({
    queryKey: fieldKeys.list(params),
    queryFn: () => fieldsApi.listFields(params),
    staleTime: 60_000, // 1 minute
  });
};

/**
 * Hook to fetch single field details
 */
export const useFieldDetail = (fieldId: string) => {
  return useQuery({
    queryKey: fieldKeys.detail(fieldId),
    queryFn: () => fieldsApi.getFieldById(fieldId),
    enabled: !!fieldId,
    staleTime: 60_000,
  });
};

/**
 * Hook to create new field
 */
export const useCreateField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFieldPayload) => fieldsApi.createField(payload),
    onSuccess: () => {
      // Invalidate fields list
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
    },
  });
};

/**
 * Hook to update field
 */
export const useUpdateField = (fieldId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateFieldPayload) => fieldsApi.updateField(fieldId, payload),
    onSuccess: () => {
      // Invalidate specific field and list
      queryClient.invalidateQueries({ queryKey: fieldKeys.detail(fieldId) });
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
    },
  });
};

/**
 * Hook to delete field
 */
export const useDeleteField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: string) => fieldsApi.deleteField(fieldId),
    onSuccess: () => {
      // Invalidate fields list
      queryClient.invalidateQueries({ queryKey: fieldKeys.lists() });
    },
  });
};

/**
 * Hook to fetch field health summary
 */
export const useFieldHealth = (fieldId: string) => {
  return useQuery({
    queryKey: fieldKeys.health(fieldId),
    queryFn: () => fieldsApi.getFieldHealthSummary(fieldId),
    enabled: !!fieldId,
    staleTime: 300_000, // 5 minutes
  });
};

/**
 * Hook to fetch field recommendations
 */
export const useFieldRecommendations = (fieldId: string) => {
  return useQuery({
    queryKey: fieldKeys.recommendations(fieldId),
    queryFn: () => fieldsApi.getFieldRecommendations(fieldId),
    enabled: !!fieldId,
    staleTime: 300_000, // 5 minutes
  });
};

