import { useQuery } from "@tanstack/react-query";

import type { ApiError } from "../../../shared/api";
import { dashboardKeys } from "../../../shared/query/queryKeys";
import type { DashboardMetrics } from "../api/dashboardApi";
import { getDashboardMetrics } from "../api/dashboardApi";

/**
 * useDashboard
 *
 * Fetch dashboard metrics for the current user.
 */
export const useDashboard = () =>
  useQuery<DashboardMetrics, ApiError>({
    queryKey: dashboardKeys.metrics,
    queryFn: () => getDashboardMetrics(),
    staleTime: 5 * 60_000, // 5 minutes (matches backend cache TTL)
    refetchOnWindowFocus: false,
  });
