import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useUiState } from '../../../shared/context/UiContext';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { ErrorState } from '../../../shared/ui/ErrorState';
import { LoadingState } from '../../../shared/ui/LoadingState';
import { Modal } from '../../../shared/ui/Modal';
import { FieldForm, type FieldFormValues } from '../components/FieldForm';
import { useFieldDetail, useUpdateField, useDeleteField } from '../hooks/useFields';
import { YieldEntryForm, type YieldEntryValues } from '../../yield/components/YieldEntryForm';
import { YieldHistoryCard } from '../../yield/components/YieldHistoryCard';
import { YieldTrendChart } from '../../yield/components/YieldTrendChart';
import { useYieldRecords, useSubmitYield } from '../../yield/hooks/useYieldData';

/**
 * FieldDetailPage
 *
 * Field-centric detail view for /fields/:fieldId.
 * - Loads field metadata via useFieldDetail
 * - Integrates with UiContext to set the current field
 * - Supports editing basic details via FieldForm
 * - Provides delete with confirmation modal
 * - Offers quick navigation into health, recommendations, and weather views
 */
export const FieldDetailPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    state: { currentFieldId },
    setCurrentField,
  } = useUiState();
  const { isOnline } = useOnlineStatus();

  const effectiveFieldId = fieldId ?? '';

  useEffect(() => {
    if (fieldId) {
      setCurrentField(fieldId);
    }
  }, [fieldId, setCurrentField]);

  const { data: field, isLoading, isError, error, refetch, isFetching } = useFieldDetail(effectiveFieldId);
  const { mutateAsync: updateField, isPending: isUpdating } = useUpdateField(effectiveFieldId);
  const { mutateAsync: deleteField, isPending: isDeleting } = useDeleteField();
  
  // Yield data management
  const { data: yieldRecords, isLoading: isLoadingYield } = useYieldRecords(effectiveFieldId);
  const { mutateAsync: submitYield, isPending: isSubmittingYield } = useSubmitYield();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isYieldEntryOpen, setIsYieldEntryOpen] = useState(false);

  const handleEditSubmit = async (values: FieldFormValues) => {
    try {
      await updateField({
        name: values.name,
        cropType: values.cropType,
        notes: values.notes,
      });
      setIsEditing(false);
      showToast({
        title: 'Field updated',
        description: 'Your field details were saved successfully.',
        variant: 'success',
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Failed to update field details.';
      showToast({
        title: 'Could not update field',
        description: message,
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!field) return;

    try {
      await deleteField({ fieldId: field.id });
      setIsDeleteOpen(false);
      if (currentFieldId === field.id) {
        setCurrentField(undefined);
      }
      showToast({
        title: 'Field deleted',
        description: 'The field has been deleted. Historical analytics may still be available separately.',
        variant: 'success',
      });
      navigate('/fields');
    } catch (err) {
      const message = (err as Error)?.message ?? 'Failed to delete field.';
      showToast({
        title: 'Could not delete field',
        description: message,
        variant: 'error',
      });
    }
  };

  const handleNavigateTo = (suffix: 'health' | 'recommendations' | 'weather') => {
    if (!field) return;
    setCurrentField(field.id);
    navigate(`/fields/${field.id}/${suffix}`);
  };

  const handleYieldSubmit = async (values: YieldEntryValues) => {
    if (!field) return;

    try {
      await submitYield({
        fieldId: field.id,
        harvestDate: values.harvestDate,
        actualYieldKgPerHa: values.actualYieldKgPerHa,
        totalYieldKg: values.totalYieldKg,
        notes: values.notes,
      });
      
      setIsYieldEntryOpen(false);
      showToast({
        title: 'Yield data saved',
        description: 'Your harvest yield has been recorded successfully.',
        variant: 'success',
      });
    } catch (err) {
      const message = (err as Error)?.message ?? 'Failed to save yield data.';
      showToast({
        title: 'Could not save yield data',
        description: message,
        variant: 'error',
      });
    }
  };

  if (!fieldId) {
    return (
      <section aria-labelledby="field-detail-heading" className="space-y-4">
        <header className="space-y-1">
          <h1 id="field-detail-heading" className="text-lg font-semibold text-gray-900">
            Field not found
          </h1>
          <p className="text-sm text-gray-600">
            The requested field could not be identified from the URL. Please return to your fields list and try again.
          </p>
        </header>
        <Button size="sm" variant="secondary" onClick={() => navigate('/fields')}>
          Back to fields
        </Button>
      </section>
    );
  }

  if (isLoading && !field) {
    return (
      <section aria-labelledby="field-detail-heading" className="space-y-4">
        <header className="space-y-1">
          <h1 id="field-detail-heading" className="text-lg font-semibold text-gray-900">
            Loading field…
          </h1>
          <p className="text-sm text-gray-600">Fetching the latest details for your field.</p>
        </header>
        <LoadingState message="Loading field summary…" />
      </section>
    );
  }

  if (isError && !field) {
    return (
      <section aria-labelledby="field-detail-heading" className="space-y-4">
        <header className="space-y-1">
          <h1 id="field-detail-heading" className="text-lg font-semibold text-gray-900">
            Unable to load field
          </h1>
        </header>
        <div className="flex flex-col gap-3">
          <ErrorState
            title="Unable to load field"
            message={error?.message ?? 'Something went wrong while loading this field. Please try again.'}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/fields')}>
              Back to fields
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!field) {
    return null;
  }

  const isCurrent = currentFieldId === field.id;

  const initialFormValues: FieldFormValues = {
    name: field.name,
    // cropType and notes are forward-compatible; not yet exposed by API
    cropType: undefined,
    notes: undefined,
  };

  return (
    <section aria-labelledby="field-detail-heading" className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="field-detail-heading" className="text-lg font-semibold text-gray-900">
            {field.name}
          </h1>
          <p className="text-sm text-gray-600">
            Detailed view for this field. Use the actions below to edit details, manage its boundary, or explore health,
            recommendations, and weather insights.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            <span>Area: {field.areaHa.toFixed(2)} ha</span>
            <span>Status: {field.status ?? '—'}</span>
            <span>Created: {new Date(field.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(field.updatedAt).toLocaleDateString()}</span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                Offline – showing last loaded data
              </span>
            )}
            {isCurrent && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                Current field
              </span>
            )}
            {isFetching && <span>Refreshing…</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button size="sm" variant="secondary" onClick={() => setIsEditing((prev) => !prev)}>
            {isEditing ? 'Cancel editing' : 'Edit details'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/fields/${field.id}/edit-boundary`)}
          >
            Edit boundary
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setIsDeleteOpen(true)} disabled={isDeleting}>
            Delete field
          </Button>
        </div>
      </header>

      <Card title="Summary">
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            This summary shows key information about your field. Boundary visualizations and health overlays will appear
            on the map in map-first views.
          </p>
          <dl className="grid grid-cols-1 gap-3 text-xs text-gray-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-900">Area</dt>
              <dd>{field.areaHa.toFixed(2)} hectares</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Status</dt>
              <dd>{field.status ?? 'Not specified'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Created</dt>
              <dd>{new Date(field.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Last updated</dt>
              <dd>{new Date(field.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={() => handleNavigateTo('health')}>
            View health
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleNavigateTo('recommendations')}>
            View recommendations
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleNavigateTo('weather')}>
            View weather
          </Button>
        </div>
      </Card>

      {/* Yield Entry Section */}
      <Card title="Harvest Yield">
        {!isYieldEntryOpen ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              After each harvest, record your actual yield to help improve future predictions and track your field's performance over time.
            </p>
            <Button 
              size="sm" 
              variant="primary" 
              onClick={() => setIsYieldEntryOpen(true)}
              className="w-full sm:w-auto"
            >
              🌾 Log Harvest Yield
            </Button>
          </div>
        ) : (
          <YieldEntryForm
            fieldId={field.id}
            fieldAreaHa={field.areaHa}
            predictedYieldKgPerHa={4500} // TODO: Get from latest prediction
            onSubmit={handleYieldSubmit}
            onCancel={() => setIsYieldEntryOpen(false)}
            isSubmitting={isSubmittingYield}
          />
        )}
      </Card>

      {/* Yield Trend Chart */}
      {yieldRecords && yieldRecords.length > 1 && (
        <YieldTrendChart
          records={yieldRecords}
          showPredictions
        />
      )}

      {/* Yield History Table */}
      {yieldRecords && yieldRecords.length > 0 && (
        <YieldHistoryCard
          records={yieldRecords.map((r) => ({
            id: r.id,
            harvestDate: r.harvestDate,
            predictedYieldKgPerHa: r.predictedYieldKgPerHa,
            actualYieldKgPerHa: r.actualYieldKgPerHa,
            totalYieldKg: r.totalYieldKg,
            accuracy: r.accuracy,
            notes: r.notes,
            createdAt: r.createdAt,
          }))}
          isLoading={isLoadingYield}
          fieldAreaHa={field.areaHa}
        />
      )}

      <Card title={isEditing ? 'Edit field details' : 'Details form'}>
        {isEditing ? (
          <FieldForm mode="edit" initialValue={initialFormValues} onSubmit={handleEditSubmit} isSubmitting={isUpdating} />
        ) : (
          <p className="text-sm text-gray-600">
            Use the Edit details button above to update the name or notes for this field. Additional metadata such
            as crop type can be incorporated as the backend schema evolves.
          </p>
        )}
      </Card>

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete field"
      >
        <div className="space-y-3 text-sm text-gray-800">
          <p>
            You are about to delete the field{' '}
            <span className="font-semibold">"{field.name}"</span>. This action cannot be undone.
          </p>
          <p className="text-xs text-gray-600">
            Historical analytics or exported data that referenced this field may remain available separately, but the
            field will no longer appear in your active list.
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete field'}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default FieldDetailPage;
