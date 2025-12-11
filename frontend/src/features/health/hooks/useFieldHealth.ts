import { useQuery } from "@tanstack/react-query";

import type { ApiError } from "../../../shared/api";
import { healthKeys } from "../../../shared/query/queryKeys";
import {
  getFieldHealth,
  getHealthIndicesMetadata,
  type FieldHealthResponse,
  type HealthIndexType,
  type HealthIndicesDictionary,
} from "../api/healthApi";

export interface FieldHealthParams {
  startDate: string;
  endDate: string;
  indexType?: HealthIndexType;
}

/**
 * useFieldHealth
 *
 * Fetch health summary and time series for a field within a date range.
 */
export const useFieldHealth = (fieldId: string, params: FieldHealthParams) =>
  useQuery<FieldHealthResponse, ApiError>({
    queryKey: healthKeys.field(fieldId, params),
    queryFn: () => getFieldHealth(fieldId, params),
    enabled:
      Boolean(fieldId) && Boolean(params.startDate) && Boolean(params.endDate),
  });

/**
 * useHealthIndicesMetadata
 *
 * Fetch metadata describing available health indices.
 */
export const useHealthIndicesMetadata = () =>
  useQuery<HealthIndicesDictionary, ApiError>({
    queryKey: healthKeys.indices,
    queryFn: () => getHealthIndicesMetadata(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
