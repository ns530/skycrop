import React, { useMemo } from "react";

import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import type { ServiceStatusLevel } from "../api/adminApi";
import {
  useAdminUsers,
  useAdminContent,
  useSystemStatus,
} from "../hooks/useAdmin";

/**
 * AdminOverviewPage
 *
 * High-level admin dashboard for the /admin route.
 * - Surfaces key metrics (users, content) using admin APIs
 * - Shows aggregate system health for API, ML, and satellite ingest services
 */
const mapServiceToCardStatus = (
  status?: ServiceStatusLevel,
): "default" | "excellent" | "fair" | "poor" => {
  switch (status) {
    case "up":
      return "excellent";
    case "degraded":
      return "fair";
    case "down":
      return "poor";
    default:
      return "default";
  }
};

const mapServiceToLabel = (status?: ServiceStatusLevel): string => {
  switch (status) {
    case "up":
      return "OK";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "Unknown";
  }
};

const mapServiceToBadgeClasses = (status?: ServiceStatusLevel): string => {
  switch (status) {
    case "up":
      return "inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent";
    case "degraded":
      return "inline-flex items-center rounded-full bg-status-fair/10 px-2 py-0.5 text-xs font-medium text-status-fair";
    case "down":
      return "inline-flex items-center rounded-full bg-status-poor/10 px-2 py-0.5 text-xs font-medium text-status-poor";
    default:
      return "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500";
  }
};

export const AdminOverviewPage: React.FC = () => {
  const { showToast } = useToast();

  const {
    data: systemStatus,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchSystemStatus,
    isFetching: isStatusFetching,
  } = useSystemStatus();

  // Use lightweight list queries primarily to derive counts.
  const { data: usersData, isLoading: isUsersLoading } = useAdminUsers({
    page: 1,
    pageSize: 1,
  });

  const { data: contentData, isLoading: isContentLoading } = useAdminContent({
    page: 1,
    pageSize: 1,
  });

  const activeFarmersCount = useMemo(() => {
    if (!usersData || isUsersLoading) return undefined;
    // Backend list endpoint does not currently expose filtering by status/role;
    // we use total user count as a placeholder for "Active farmers".
    return usersData.pagination.total;
  }, [usersData, isUsersLoading]);

  const contentItemsCount = useMemo(() => {
    if (!contentData || isContentLoading) return undefined;
    return contentData.pagination.total;
  }, [contentData, isContentLoading]);

  const handleRetrySystemStatus = async () => {
    try {
      await refetchSystemStatus();
      showToast({
        title: "System status refreshed",
        variant: "success",
      });
    } catch (err) {
      const apiError = statusError ?? (err as Error);
      showToast({
        title: "Failed to refresh system status",
        description:
          apiError?.message ??
          "Something went wrong while checking system status.",
        variant: "error",
      });
    }
  };

  const renderSystemSummary = () => {
    if (isStatusLoading && !systemStatus) {
      return <p className="text-sm text-gray-500">Checking system status…</p>;
    }

    if (isStatusError && !systemStatus) {
      return (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-red-600">Unable to load system status.</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRetrySystemStatus}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (!systemStatus) {
      return (
        <p className="text-sm text-gray-500">
          System status is currently unavailable.
        </p>
      );
    }

    return (
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-gray-600">API</dt>
          <dd className={mapServiceToBadgeClasses(systemStatus.api)}>
            {mapServiceToLabel(systemStatus.api)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-gray-600">ML service</dt>
          <dd className={mapServiceToBadgeClasses(systemStatus.mlService)}>
            {mapServiceToLabel(systemStatus.mlService)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-gray-600">Satellite ingest</dt>
          <dd
            className={mapServiceToBadgeClasses(systemStatus.satelliteIngest)}
          >
            {mapServiceToLabel(systemStatus.satelliteIngest)}
          </dd>
        </div>
      </dl>
    );
  };

  return (
    <section aria-labelledby="admin-overview-heading" className="space-y-4">
      <header className="space-y-1">
        <h1
          id="admin-overview-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Admin overview
        </h1>
        <p className="text-sm text-gray-600">
          System status and key metrics for SkyCrop. Use this dashboard to
          monitor platform health and activity.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Active farmers" showStatusStripe status="excellent">
          <p className="text-2xl font-semibold text-gray-900">
            {activeFarmersCount ?? "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Approximated using total user count. Filtering by role/status will
            be wired in a future iteration.
          </p>
        </Card>

        <Card title="Fields monitored" showStatusStripe status="fair">
          <p className="text-2xl font-semibold text-gray-900">—</p>
          <p className="mt-1 text-xs text-gray-500">
            Placeholder metric. Will be derived from field inventories in a
            future iteration.
          </p>
        </Card>

        <Card title="Content items" showStatusStripe status="excellent">
          <p className="text-2xl font-semibold text-gray-900">
            {contentItemsCount ?? "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Total news and articles currently managed in the system.
          </p>
        </Card>

        <Card
          title="System health"
          showStatusStripe
          status={mapServiceToCardStatus(systemStatus?.api)}
        >
          {renderSystemSummary()}
          {isStatusFetching && (
            <p className="mt-2 text-xs text-gray-500">Refreshing status…</p>
          )}
        </Card>
      </div>

      <Card title="Detailed system status" className="mt-2">
        {isStatusLoading && !systemStatus && (
          <p className="text-sm text-gray-500">Checking system status…</p>
        )}

        {isStatusError && !systemStatus && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-red-600">
              Unable to load system status:{" "}
              {statusError?.message ?? "Unknown error"}.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRetrySystemStatus}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isStatusLoading && !isStatusError && systemStatus && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              title="API"
              status={mapServiceToCardStatus(systemStatus.api)}
              showStatusStripe
              className="border-0 shadow-none"
            >
              <p className="text-sm text-gray-700">
                {systemStatus.api === "up" &&
                  "Core APIs are responding within expected latency."}
                {systemStatus.api === "degraded" &&
                  "API is degraded. Expect slower responses and occasional timeouts."}
                {systemStatus.api === "down" &&
                  "API is currently unavailable. Farmers may not be able to access latest data."}
              </p>
            </Card>

            <Card
              title="ML service"
              status={mapServiceToCardStatus(systemStatus.mlService)}
              showStatusStripe
              className="border-0 shadow-none"
            >
              <p className="text-sm text-gray-700">
                {systemStatus.mlService === "up" &&
                  "Model predictions for health and yield are running normally."}
                {systemStatus.mlService === "degraded" &&
                  "ML service is degraded. Recommendations may be slower than usual."}
                {systemStatus.mlService === "down" &&
                  "ML service is unavailable. Health insights and recommendations may be stale."}
              </p>
            </Card>

            <Card
              title="Satellite ingest"
              status={mapServiceToCardStatus(systemStatus.satelliteIngest)}
              showStatusStripe
              className="border-0 shadow-none"
            >
              <p className="text-sm text-gray-700">
                {systemStatus.satelliteIngest === "up" &&
                  "Satellite scenes are being ingested and processed as expected."}
                {systemStatus.satelliteIngest === "degraded" &&
                  "Satellite ingest is degraded. Expect delays before new imagery appears."}
                {systemStatus.satelliteIngest === "down" &&
                  "Satellite ingest is down. New acquisitions will not be processed until this is resolved."}
              </p>
            </Card>
          </div>
        )}
      </Card>

      <Card title="Quick admin actions">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary">
            Manage users
          </Button>
          <Button size="sm" variant="secondary">
            Review content
          </Button>
          <Button size="sm" variant="ghost" onClick={handleRetrySystemStatus}>
            Refresh system status
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default AdminOverviewPage;
