import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useUiState } from "../../../shared/context/UiContext";
import { useToast } from "../../../shared/hooks/useToast";
import type { FieldGeometry } from "../../../shared/types/geojson";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import {
  useFieldDetail,
  useFieldBoundaryDetection,
  useUpdateField,
} from "../hooks/useFields";

/**
 * EditFieldBoundaryPage
 *
 * Map-first boundary management view for /fields/:fieldId/edit-boundary,
 * rendered inside MapFirstLayout.
 *
 * The map itself is currently a structural placeholder provided by the layout.
 * This page focuses on wiring:
 * - Boundary fetch via useFieldDetail
 * - AI boundary detection via useFieldBoundaryDetection
 * - Boundary save via useUpdateField
 * - UiContext current field selection
 */
export const EditFieldBoundaryPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setCurrentField } = useUiState();

  const effectiveFieldId = fieldId ?? "";

  useEffect(() => {
    if (fieldId) {
      setCurrentField(fieldId);
    }
  }, [fieldId, setCurrentField]);

  const {
    data: field,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFieldDetail(effectiveFieldId);

  const { mutateAsync: detectBoundary, isPending: isDetecting } =
    useFieldBoundaryDetection();

  const { mutateAsync: updateField, isPending: isSaving } =
    useUpdateField(effectiveFieldId);

  const [workingGeometry, setWorkingGeometry] = useState<
    FieldGeometry | undefined
  >();

  useEffect(() => {
    if (field?.geometry) {
      setWorkingGeometry(field.geometry);
    }
  }, [field?.geometry]);

  const handleDetectBoundary = async () => {
    if (!field) return;

    try {
      const geometry = await detectBoundary({
        fieldId: field.id,
        payload: {},
      });

      setWorkingGeometry(geometry);
      showToast({
        title: "AI boundary detected",
        description:
          "An AI-generated boundary has been applied in this panel. The visual polygon will appear once the map is integrated.",
        variant: "success",
      });
    } catch (err) {
      const message =
        (err as Error)?.message ??
        "Failed to detect boundary using AI. Your existing boundary has been preserved.";
      showToast({
        title: "Boundary detection failed",
        description: message,
        variant: "error",
      });
    }
  };

  const handleResetBoundary = () => {
    if (!field?.geometry) return;
    setWorkingGeometry(field.geometry);
    showToast({
      title: "Boundary reset",
      description: "Reverted to the last saved boundary for this field.",
      variant: "default",
    });
  };

  const handleSaveBoundary = async () => {
    if (!field) return;

    try {
      await updateField({
        geometry: workingGeometry ?? field.geometry,
      });

      showToast({
        title: "Boundary saved",
        description: "The field boundary was saved successfully.",
        variant: "success",
      });

      navigate(`/fields/${field.id}`);
    } catch (err) {
      const message =
        (err as Error)?.message ??
        "Failed to save the boundary. Please try again.";
      showToast({
        title: "Could not save boundary",
        description: message,
        variant: "error",
      });
    }
  };

  if (!fieldId) {
    return (
      <section aria-labelledby="edit-boundary-heading" className="space-y-4">
        <header className="space-y-1">
          <h1
            id="edit-boundary-heading"
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
          onClick={() => navigate("/fields")}
        >
          Back to fields
        </Button>
      </section>
    );
  }

  if (isLoading && !field) {
    return (
      <section aria-labelledby="edit-boundary-heading" className="space-y-4">
        <header className="space-y-1">
          <h1
            id="edit-boundary-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Loading boundary…
          </h1>
          <p className="text-sm text-gray-600">
            Fetching the latest details and boundary for your field.
          </p>
        </header>
        <Card>
          <p className="text-sm text-gray-600">Loading boundary information…</p>
        </Card>
      </section>
    );
  }

  if (isError && !field) {
    return (
      <section aria-labelledby="edit-boundary-heading" className="space-y-4">
        <header className="space-y-1">
          <h1
            id="edit-boundary-heading"
            className="text-lg font-semibold text-gray-900"
          >
            Unable to load field boundary
          </h1>
          <p className="text-sm text-gray-600">
            {error?.message ??
              "Something went wrong while loading this field. Please try again."}
          </p>
        </header>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/fields/${fieldId}`)}
          >
            Back to field details
          </Button>
        </div>
      </section>
    );
  }

  if (!field) {
    return null;
  }

  const boundarySourceLabel = "Current boundary source";
  const boundarySourceValue =
    "Manual or previously saved geometry (AI-generated boundaries will be noted here in future iterations).";

  return (
    <section aria-labelledby="edit-boundary-heading" className="space-y-4">
      <header className="space-y-1">
        <h1
          id="edit-boundary-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Edit field boundary
        </h1>
        <p className="text-sm text-gray-600">
          Use the controls in this side panel to manage your field boundary. The
          map on the left will host the interactive drawing tools and overlays
          in a future iteration.
        </p>
        <p className="text-xs text-gray-500">
          Field: <span className="font-medium text-gray-900">{field.name}</span>{" "}
          · Area: {field.areaHa.toFixed(2)} ha {isFetching && "· Refreshing…"}
        </p>
      </header>

      <Card title="Boundary summary">
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            This boundary defines the area used for health indices,
            recommendations, and weather aggregation. Adjustments here will
            affect downstream analytics once saved.
          </p>
          <dl className="grid grid-cols-1 gap-3 text-xs text-gray-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-900">Area</dt>
              <dd>{field.areaHa.toFixed(2)} hectares</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">
                {boundarySourceLabel}
              </dt>
              <dd>{boundarySourceValue}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <Card title="AI boundary detection" className="space-y-3">
        <p className="text-sm text-gray-700">
          SkyCrop can use satellite imagery and ML models to suggest a field
          boundary. The detected polygon will be applied as the working boundary
          in this panel. A future update will render the detected shape directly
          on the map.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleDetectBoundary}
            disabled={isDetecting}
          >
            {isDetecting ? "Analyzing…" : "Detect boundary with AI"}
          </Button>
          <p className="text-xs text-gray-500">
            This may take a few seconds while satellite imagery is analyzed.
          </p>
        </div>
      </Card>

      <Card title="Manual boundary controls" className="space-y-3">
        <p className="text-sm text-gray-700">
          Manual drawing and editing tools will appear on the map to the left.
          For now, these controls let you reset to the last saved boundary and
          persist any AI-detected boundary to the backend.
        </p>
        <ol className="list-decimal pl-5 text-xs text-gray-600 space-y-1">
          <li>
            Use the map tools (coming soon) to draw or adjust the field
            boundary.
          </li>
          <li>
            Use Detect boundary with AI above to propose a boundary from
            imagery.
          </li>
          <li>
            Review the suggested boundary on the map, then click Save boundary
            to persist.
          </li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleResetBoundary}
            disabled={isSaving}
          >
            Reset to original boundary
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveBoundary}
            disabled={isSaving || !workingGeometry}
          >
            {isSaving ? "Saving…" : "Save boundary"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/fields/${field.id}`)}
            disabled={isSaving || isDetecting}
          >
            Back to field details
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default EditFieldBoundaryPage;
