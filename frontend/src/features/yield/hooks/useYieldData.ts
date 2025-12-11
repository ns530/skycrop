/**
 * useYieldData Hook
 * Manages yield predictions and actual yield submissions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "../../../shared/api";
import {
  getActualYieldRecords,
  submitActualYield,
  deleteYieldRecord,
  type ActualYieldRecord,
  type SubmitYieldPayload,
} from "../api/yieldApi";

/**
 * Query keys for yield data
 */
export const yieldKeys = {
  all: ["yield"] as const,
  records: (fieldId: string) => ["yield", "records", fieldId] as const,
  predictions: (fieldId: string) => ["yield", "predictions", fieldId] as const,
};

/**
 * useYieldRecords
 *
 * Fetch actual yield records for a field
 *
 * @param fieldId - Field ID
 * @returns Query result with yield records
 */
export const useYieldRecords = (fieldId: string) => {
  return useQuery<ActualYieldRecord[], ApiError>({
    queryKey: yieldKeys.records(fieldId),
    queryFn: () => getActualYieldRecords(fieldId),
    enabled: !!fieldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useSubmitYield
 *
 * Submit actual yield data after harvest
 * Invalidates and refetches yield records on success
 *
 * @returns Mutation function and state
 */
export const useSubmitYield = () => {
  const queryClient = useQueryClient();

  return useMutation<ActualYieldRecord, ApiError, SubmitYieldPayload>({
    mutationFn: submitActualYield,
    onSuccess: (data: ActualYieldRecord) => {
      // Invalidate and refetch yield records for this field
      void queryClient.invalidateQueries({
        queryKey: yieldKeys.records(data.fieldId),
      });
    },
  });
};

/**
 * useDeleteYieldRecord
 *
 * Delete a yield record
 * Invalidates and refetches yield records on success
 *
 * @returns Mutation function and state
 */
export const useDeleteYieldRecord = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { recordId: string; fieldId: string }>({
    mutationFn: ({ recordId }: { recordId: string; fieldId: string }) =>
      deleteYieldRecord(recordId),
    onSuccess: (
      _data: void,
      variables: { recordId: string; fieldId: string },
    ) => {
      // Invalidate and refetch yield records for this field
      void queryClient.invalidateQueries({
        queryKey: yieldKeys.records(variables.fieldId),
      });
    },
  });
};
