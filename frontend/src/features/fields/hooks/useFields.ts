import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  ApiError,
  ListParams,
  PaginatedResponse,
} from "../../../shared/api";
import { fieldKeys } from "../../../shared/query/queryKeys";
import type { FieldGeometry } from "../../../shared/types/geojson";
import type {
  FieldDetail,
  FieldSummary,
  CreateFieldPayload,
  UpdateFieldPayload,
  DetectBoundaryPayload,
} from "../api/fieldsApi";
import {
  listFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
  detectFieldBoundary,
} from "../api/fieldsApi";

/**
 * useFields
 *
 * Fetch a paginated list of fields for the current user.
 * Uses placeholderData for smoother pagination UX.
 */
export const useFields = (params?: ListParams) =>
  useQuery<PaginatedResponse<FieldSummary>, ApiError>({
    queryKey: fieldKeys.list(params),
    queryFn: () => listFields(params),
    staleTime: 60_000, // 60 seconds
    placeholderData: (previousData) => previousData,
  });

/**
 * useFieldDetail
 *
 * Fetch a single field by ID.
 */
export const useFieldDetail = (fieldId: string) =>
  useQuery<FieldDetail, ApiError>({
    queryKey: fieldKeys.detail(fieldId),
    queryFn: () => getFieldById(fieldId),
    enabled: Boolean(fieldId),
  });

/**
 * useCreateField
 *
 * Create a new field and invalidate field list queries on success.
 */
export const useCreateField = () => {
  const queryClient = useQueryClient();

  return useMutation<FieldDetail, ApiError, CreateFieldPayload>({
    mutationFn: (payload: CreateFieldPayload) => createField(payload),
    onSuccess: () => {
      // Refresh all field lists
      void queryClient.invalidateQueries({ queryKey: fieldKeys.all });
    },
  });
};

/**
 * useUpdateField
 *
 * Update field metadata and refresh detail + list queries on success.
 */
export const useUpdateField = (fieldId: string) => {
  const queryClient = useQueryClient();

  return useMutation<FieldDetail, ApiError, UpdateFieldPayload>({
    mutationFn: (payload: UpdateFieldPayload) => updateField(fieldId, payload),
    onSuccess: (updated: FieldDetail) => {
      queryClient.setQueryData<FieldDetail>(fieldKeys.detail(fieldId), updated);
      void queryClient.invalidateQueries({ queryKey: fieldKeys.all });
    },
  });
};

type DeleteFieldVariables = {
  fieldId: string;
};

type DeleteFieldContext = {
  previousLists: [unknown, PaginatedResponse<FieldSummary> | undefined][];
};

/**
 * useDeleteField
 *
 * Delete a field with optional optimistic update of list caches.
 */
export const useDeleteField = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, DeleteFieldVariables, DeleteFieldContext>({
    mutationFn: ({ fieldId }: DeleteFieldVariables) => deleteField(fieldId),
    onMutate: async ({ fieldId }: DeleteFieldVariables) => {
      await queryClient.cancelQueries({ queryKey: fieldKeys.all });

      const previousLists = queryClient.getQueriesData<
        PaginatedResponse<FieldSummary>
      >({
        queryKey: fieldKeys.all,
      });

      previousLists.forEach(
        ([queryKey, value]: [
          unknown,
          PaginatedResponse<FieldSummary> | undefined,
        ]) => {
          if (!value) return;
          queryClient.setQueryData<PaginatedResponse<FieldSummary>>(
            queryKey as readonly unknown[],
            {
              ...value,
              data: value.data.filter(
                (field: FieldSummary) => field.id !== fieldId,
              ),
            },
          );
        },
      );

      return { previousLists };
    },
    onError: (
      _error: ApiError,
      _variables: DeleteFieldVariables,
      context?: DeleteFieldContext,
    ) => {
      // Roll back optimistic update
      if (!context) return;
      context.previousLists.forEach(
        ([queryKey, value]: [
          unknown,
          PaginatedResponse<FieldSummary> | undefined,
        ]) => {
          queryClient.setQueryData(queryKey as readonly unknown[], value);
        },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: fieldKeys.all });
    },
  });
};

type BoundaryDetectionVariables = {
  fieldId: string;
  payload: DetectBoundaryPayload;
};

/**
 * useFieldBoundaryDetection
 *
 * Trigger ML-powered boundary detection for an existing field.
 * On success, updates the field detail cache with the new geometry.
 */
export const useFieldBoundaryDetection = () => {
  const queryClient = useQueryClient();

  return useMutation<FieldGeometry, ApiError, BoundaryDetectionVariables>({
    mutationFn: ({ fieldId, payload }: BoundaryDetectionVariables) =>
      detectFieldBoundary(fieldId, payload),
    onSuccess: (
      geometry: FieldGeometry,
      { fieldId }: BoundaryDetectionVariables,
    ) => {
      queryClient.setQueryData<FieldDetail | undefined>(
        fieldKeys.detail(fieldId),
        (prev: FieldDetail | undefined) =>
          prev
            ? {
                ...prev,
                geometry,
              }
            : prev,
      );
    },
  });
};
