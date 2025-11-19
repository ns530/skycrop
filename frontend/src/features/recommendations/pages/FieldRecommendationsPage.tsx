import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useUiState } from '../../../shared/context/UiContext';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { useFieldDetail } from '../../fields/hooks/useFields';
import { RecommendationsList } from '../components/RecommendationsList';
import { useRecommendations, useApplyRecommendation } from '../hooks';

/**
 * FieldRecommendationsPage
 *
 * Map-first detail view for /fields/:fieldId/recommendations, rendered inside
 * MapFirstLayout. Fetches recommendations for the selected field and allows
 * farmers to mark actions as applied.
 */
export const FieldRecommendationsPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    state: { currentFieldId },
    setCurrentField,
  } = useUiState();
  const { isOnline } = useOnlineStatus();

  const effectiveFieldId = fieldId ?? currentFieldId ?? '';

  // Sync current field into global UI context
  useEffect(() => {
    if (fieldId) {
      setCurrentField(fieldId);
    }
  }, [fieldId, setCurrentField]);

  // Fetch base field metadata (name, area) for header context
  const {
    data: field,
    isLoading: isFieldLoading,
    isError: isFieldError,
  } = useFieldDetail(effectiveFieldId);

  // Fetch recommendations for this field
  const {
    data: recommendations,
    isLoading: isRecommendationsLoading,
    isError: isRecommendationsError,
    error: recommendationsError,
    refetch: refetchRecommendations,
    isFetching: isRecommendationsFetching,
  } = useRecommendations(effectiveFieldId);

  const { mutate: applyRecommendationMutate } = useApplyRecommendation();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const hasRecommendations = (recommendations?.length ?? 0) > 0;

  const handleRetryRecommendations = () => {
    void refetchRecommendations();
    showToast({
      title: 'Retrying recommendations',
      description: 'Attempting to reload recommendations for this field.',
      variant: 'default',
    });
  };

  const handleApplyRecommendation = (id: string) => {
    if (!effectiveFieldId) {
      showToast({
        title: 'No field selected',
        description:
          'Unable to apply this recommendation because the field could not be determined.',
        variant: 'error',
      });
      return;
    }

    const appliedAt = new Date().toISOString();
    setApplyingId(id);

    applyRecommendationMutate(
      { id, fieldId: effectiveFieldId, payload: { appliedAt } },
      {
        onSuccess: () => {
          const rec = (recommendations ?? []).find(
            (item) => item.id === id,
          );
          const recTitle = rec?.title ?? 'Recommendation';
          showToast({
            title: 'Recommendation applied',
            description: `"${recTitle}" was marked as applied.`,
            variant: 'success',
          });
        },
        onError: (err) => {
          const message =
            (err as Error)?.message ?? 'Failed to apply recommendation.';
          showToast({
            title: 'Could not apply recommendation',
            description: message,
            variant: 'error',
          });
        },
        onSettled: () => {
          setApplyingId(null);
        },
      },
    );
  };

  if (!fieldId) {
    return (
      <section
        aria-labelledby="field-recommendations-heading"
        className="space-y-4"
      >
        <header className="space-y-1">
          <h1
            id="field-recommendations-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Field not found
          </h1>
          <p className="text-sm text-gray-600">
            The requested field could not be identified from the URL. Please
            return to your fields list and try again.
          </p>
        </header>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/fields')}
        >
          Back to fields
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="field-recommendations-heading"
      className="space-y-4"
    >
      <header className="space-y-1">
        <h1
          id="field-recommendations-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Recommendations
        </h1>
        <p className="text-sm text-gray-600">
          These actions are tailored to your field’s current health and recent
          weather conditions. Use them to plan irrigation, fertilization, and
          risk mitigation.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {field && !isFieldLoading && !isFieldError && (
            <>
              <span className="font-medium text-gray-700">
                {field.name}
              </span>
              <span>Area: {field.areaHa.toFixed(2)} ha</span>
            </>
          )}
          {isRecommendationsFetching && <span>Refreshing…</span>}
        </div>
      </header>

      {!isOnline && (
        <p className="flex items-center gap-2 text-xs text-amber-700">
          <span
            className="inline-block h-2 w-2 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          {hasRecommendations
            ? 'You are offline. Showing the last loaded recommendations.'
            : 'You are offline and have no cached recommendations yet.'}
        </p>
      )}

      {isRecommendationsLoading && !hasRecommendations && (
        <LoadingState message="Loading recommendations for this field…" />
      )}

      {isRecommendationsError && (
        <ErrorState
          title="Unable to load recommendations"
          message={
            recommendationsError?.message ??
            'Something went wrong while loading recommendations for this field.'
          }
          onRetry={handleRetryRecommendations}
        />
      )}

      {!isRecommendationsLoading &&
        !isRecommendationsError &&
        !hasRecommendations && (
          <Card title="No recommendations yet">
            <p className="text-sm text-gray-700">
              There are no active recommendations for this field yet. As health
              and weather signals update, prioritized actions will appear here.
            </p>
          </Card>
        )}

      {hasRecommendations && (
        <RecommendationsList
          recommendations={recommendations ?? []}
          onApply={handleApplyRecommendation}
          applyingId={applyingId ?? undefined}
        />
      )}
    </section>
  );
};

export default FieldRecommendationsPage;