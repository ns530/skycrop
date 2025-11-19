import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '../../../shared/api';
import { yieldKeys } from '../../../shared/query/queryKeys';
import {
  getYieldForecast,
  getYieldHistory,
  type YieldForecastRequest,
  type YieldForecastResponse,
  type YieldPrediction,
} from '../api/yieldApi';

/**
 * useYieldForecast
 *
 * Fetch yield forecast for given features/rows.
 */
export const useYieldForecast = (request: YieldForecastRequest) =>
  useQuery<YieldForecastResponse, ApiError>({
    queryKey: yieldKeys.forecast(request),
    queryFn: () => getYieldForecast(request),
    enabled: Boolean(request.features?.length || request.rows?.length),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

/**
 * useYieldHistory
 *
 * Fetch yield history for a field.
 */
export const useYieldHistory = (fieldId: string) =>
  useQuery<YieldPrediction[], ApiError>({
    queryKey: yieldKeys.history(fieldId),
    queryFn: () => getYieldHistory(fieldId),
    enabled: Boolean(fieldId),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });