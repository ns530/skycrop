import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useUiState } from "../../../shared/context/UiContext";
import { useOnlineStatus } from "../../../shared/hooks/useOnlineStatus";
import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { ErrorState } from "../../../shared/ui/ErrorState";
import { LoadingState } from "../../../shared/ui/LoadingState";
import type { FieldSummary } from "../api/fieldsApi";
import { useFields } from "../hooks/useFields";

/**
 * FieldsListPage
 *
 * Paginated list of fields for the /fields route.
 * - Uses react-query via useFields for data fetching
 * - Manages local pagination state
 * - Integrates with UiContext to set the current field selection
 * - Provides navigation shortcuts into field detail and map-first views
 */
export const FieldsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    state: { currentFieldId },
    setCurrentField,
  } = useUiState();
  const { isOnline } = useOnlineStatus();

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const { data, isLoading, isError, error, refetch, isFetching } = useFields({
    page,
    pageSize,
  });

  const fields = data?.data ?? [];
  const pagination = data?.pagination;
  const hasAnyData = Boolean(data);

  const canGoPrevious = useMemo(
    () => (pagination ? pagination.page > 1 : page > 1),
    [pagination, page],
  );
  const canGoNext = useMemo(() => {
    if (!pagination) return false;
    const { page: currentPage, pageSize: currentPageSize, total } = pagination;
    return currentPage * currentPageSize < total;
  }, [pagination]);

  const handleNavigateToField = (fieldId: string, pathSuffix: string = "") => {
    setCurrentField(fieldId);
    const basePath = `/fields/${fieldId}`;
    navigate(pathSuffix ? `${basePath}/${pathSuffix}` : basePath);
  };

  const handleAddField = () => {
    setCurrentField(undefined);
    navigate("/fields/create");
  };

  const handleRetry = async () => {
    try {
      await refetch();
    } catch (err) {
      const apiError = error ?? (err as Error);
      showToast({
        title: "Failed to load fields",
        description:
          apiError?.message ?? "Something went wrong while fetching fields.",
        variant: "error",
      });
    }
  };

  const renderRow = (field: FieldSummary) => {
    const isSelected = currentFieldId === field.id;

    return (
      <tr
        key={field.id}
        className={
          isSelected
            ? "bg-blue-50/60 hover:bg-blue-50 text-gray-900"
            : "hover:bg-gray-50 text-gray-900"
        }
      >
        <td className="px-4 py-3 text-sm font-medium">{field.name}</td>
        <td className="px-4 py-3 text-xs text-gray-700">
          {field.areaHa.toFixed(2)} ha
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          <span className="block">
            Created: {new Date(field.createdAt).toLocaleDateString()}
          </span>
          <span className="block">
            Updated: {new Date(field.updatedAt).toLocaleDateString()}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-700">
          {field.status ?? "—"}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleNavigateToField(field.id)}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleNavigateToField(field.id, "health")}
            >
              Health
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleNavigateToField(field.id, "recommendations")}
            >
              Recommendations
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleNavigateToField(field.id, "weather")}
            >
              Weather
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section aria-labelledby="fields-list-heading" className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            id="fields-list-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Your fields
          </h1>
          <p className="text-sm text-gray-600">
            Manage your registered fields, jump into health maps, and open
            recommendations.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={handleAddField}>
          Add field
        </Button>
      </header>

      {!isOnline && (
        <p className="flex items-center gap-2 text-xs text-amber-700">
          <span
            className="inline-block h-2 w-2 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          {hasAnyData
            ? "You are offline. Showing the last loaded data."
            : "You are offline and have no cached data yet."}
        </p>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Area
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Activity
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    <LoadingState compact message="Loading fields…" />
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center">
                    <ErrorState
                      compact
                      title="Unable to load your fields"
                      message={
                        error?.message ??
                        "Something went wrong while fetching fields."
                      }
                      onRetry={handleRetry}
                    />
                  </td>
                </tr>
              )}

              {!isLoading && !isError && fields.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    You haven&apos;t added any fields yet. Use the Add field button
                    to register your first field.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && fields.map(renderRow)}
            </tbody>
          </table>
        </div>

        <footer className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
          <div>
            {pagination ? (
              <span>
                Page {pagination.page} · Showing {fields.length} of{" "}
                {pagination.total} fields
              </span>
            ) : (
              <span>{isFetching ? "Refreshing fields…" : "Fields list"}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!canGoPrevious || isLoading || isFetching}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!canGoNext || isLoading || isFetching}
            >
              Next
            </Button>
          </div>
        </footer>
      </Card>
    </section>
  );
};

export default FieldsListPage;
