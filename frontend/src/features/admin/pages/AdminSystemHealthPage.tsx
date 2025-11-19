import React from 'react';

import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import type { ServiceStatusLevel } from '../api/adminApi';
import { useSystemStatus } from '../hooks/useAdmin';

/**
 * AdminSystemHealthPage
 *
 * Real-time view for /admin/system-health.
 * - Uses useSystemStatus to fetch subsystem availability
 * - Shows one card per subsystem with color-coded status badge and description
 * - Provides a manual refresh action with toast feedback
 */

const mapServiceToCardStatus = (status?: ServiceStatusLevel): 'default' | 'excellent' | 'fair' | 'poor' => {
  switch (status) {
    case 'up':
      return 'excellent';
    case 'degraded':
      return 'fair';
    case 'down':
      return 'poor';
    default:
      return 'default';
  }
};

const mapServiceToBadgeClasses = (status?: ServiceStatusLevel): string => {
  switch (status) {
    case 'up':
      return 'inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent';
    case 'degraded':
      return 'inline-flex items-center rounded-full bg-status-fair/10 px-2 py-0.5 text-xs font-medium text-status-fair';
    case 'down':
      return 'inline-flex items-center rounded-full bg-status-poor/10 px-2 py-0.5 text-xs font-medium text-status-poor';
    default:
      return 'inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500';
  }
};

const mapServiceToLabel = (status?: ServiceStatusLevel): string => {
  switch (status) {
    case 'up':
      return 'Up';
    case 'degraded':
      return 'Degraded';
    case 'down':
      return 'Down';
    default:
      return 'Unknown';
  }
};

export const AdminSystemHealthPage: React.FC = () => {
  const { showToast } = useToast();

  const { data: status, isLoading, isError, error, refetch, isFetching } = useSystemStatus();

  const handleRefresh = async () => {
    try {
      await refetch();
      showToast({
        title: 'System status refreshed',
        variant: 'success',
      });
    } catch (err) {
      const apiError = error ?? (err as Error);
      showToast({
        title: 'Failed to refresh system status',
        description: apiError?.message ?? 'Something went wrong while refreshing system health.',
        variant: 'error',
      });
    }
  };

  return (
    <section aria-labelledby="admin-system-health-heading" className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 id="admin-system-health-heading" className="text-lg font-semibold text-gray-900">
            System health
          </h1>
          <p className="text-sm text-gray-600">
            Real-time view of API, ML, and satellite ingest status. Use this to understand how SkyCrop services are
            behaving.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={isFetching}>
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </header>

      <Card>
        {isLoading && !status && (
          <p className="text-sm text-gray-500">Checking system status…</p>
        )}

        {isError && !status && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-red-600">
              Unable to load system status: {error?.message ?? 'Unknown error'}.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={isFetching}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !isError && status && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card
              title="API"
              status={mapServiceToCardStatus(status.api)}
              showStatusStripe
              className="border-0 shadow-none"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={mapServiceToBadgeClasses(status.api)}>{mapServiceToLabel(status.api)}</span>
                </div>
                <p className="text-sm text-gray-700">
                  The API provides all core platform capabilities including authentication, fields, health, and
                  recommendations.
                </p>
                {status.api === 'degraded' && (
                  <p className="text-xs text-status-fair">
                    API is degraded. Expect slower responses and occasional timeouts for farmers.
                  </p>
                )}
                {status.api === 'down' && (
                  <p className="text-xs text-status-poor">
                    API is down. Farmers may be unable to sign in or view updated field information.
                  </p>
                )}
              </div>
            </Card>

            <Card
              title="ML service"
              status={mapServiceToCardStatus(status.mlService)}
              showStatusStripe
              className="border-0 shadow-none"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={mapServiceToBadgeClasses(status.mlService)}>{mapServiceToLabel(status.mlService)}</span>
                </div>
                <p className="text-sm text-gray-700">
                  ML services power health indices, yield predictions, and recommendation models for farmer fields.
                </p>
                {status.mlService === 'degraded' && (
                  <p className="text-xs text-status-fair">
                    ML service is degraded. Health maps and recommendations may take longer to generate.
                  </p>
                )}
                {status.mlService === 'down' && (
                  <p className="text-xs text-status-poor">
                    ML service is down. New health insights or recommendations may not be available and existing ones
                    may be stale.
                  </p>
                )}
              </div>
            </Card>

            <Card
              title="Satellite ingest"
              status={mapServiceToCardStatus(status.satelliteIngest)}
              showStatusStripe
              className="border-0 shadow-none"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className={mapServiceToBadgeClasses(status.satelliteIngest)}>
                    {mapServiceToLabel(status.satelliteIngest)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  Satellite ingest handles fetching, processing, and storing new imagery used for field monitoring.
                </p>
                {status.satelliteIngest === 'degraded' && (
                  <p className="text-xs text-status-fair">
                    Ingest is degraded. Expect delays before new satellite scenes appear in field views.
                  </p>
                )}
                {status.satelliteIngest === 'down' && (
                  <p className="text-xs text-status-poor">
                    Ingest is down. No new imagery will be processed until this is resolved; health data may become
                    outdated.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {!isLoading && !isError && !status && (
          <p className="text-sm text-gray-500">System status is currently unavailable.</p>
        )}
      </Card>
    </section>
  );
};

export default AdminSystemHealthPage;