/**
 * CreateFieldWithMapPage
 * Complete map-based field creation workflow
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { MapCenter } from "../../../shared/components/Map";
import { calculatePolygonArea } from "../../../shared/components/Map/utils/geoJsonUtils";
import { useUiState } from "../../../shared/context/UiContext";
import { useToast } from "../../../shared/hooks/useToast";
import type { FieldGeometry } from "../../../shared/types/geojson";
import { Card } from "../../../shared/ui/Card";
import { BoundaryConfirmation } from "../components/BoundaryConfirmation";
import { BoundaryDetectionProgress } from "../components/BoundaryDetectionProgress";
import { FieldForm, type FieldFormValues } from "../components/FieldForm";
import { FieldLocationSelector } from "../components/FieldLocationSelector";
import { useBoundaryDetection } from "../hooks/useBoundaryDetection";
import { useCreateField } from "../hooks/useFields";

/**
 * Workflow steps for field creation
 */
type CreationStep =
  | "select-location"
  | "detecting-boundary"
  | "confirm-boundary"
  | "enter-details"
  | "complete";

/**
 * Placeholder geometry for initial field creation
 * Will be replaced after boundary detection
 */
const PLACEHOLDER_GEOMETRY: FieldGeometry = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [0, 0.0001],
      [0.0001, 0.0001],
      [0.0001, 0],
      [0, 0],
    ],
  ],
};

/**
 * CreateFieldWithMapPage
 *
 * Complete workflow for creating fields with AI boundary detection:
 *
 * Step 1: Select field center on map
 * Step 2: AI detects boundary (with progress)
 * Step 3: Review and confirm boundary
 * Step 4: Enter field details (name, crop type, notes)
 * Step 5: Navigate to field detail page
 */
export const CreateFieldWithMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setCurrentField } = useUiState();

  const [currentStep, setCurrentStep] =
    useState<CreationStep>("select-location");
  const [selectedLocation, setSelectedLocation] = useState<MapCenter | null>(
    null,
  );
  const [detectedBoundary, setDetectedBoundary] =
    useState<FieldGeometry | null>(null);
  const [detectedArea, setDetectedArea] = useState<number>(0);
  const [createdFieldId, setCreatedFieldId] = useState<string | null>(null);

  const { mutateAsync: createField, isPending: isCreating } = useCreateField();

  // Boundary detection hook (initialized after field creation)
  const boundaryDetection = useBoundaryDetection({
    fieldId: createdFieldId || "",
    location: selectedLocation || { lat: 0, lng: 0 },
  });

  /**
   * Step 1: Location confirmed - create placeholder field and detect boundary
   */
  const handleLocationConfirmed = async (location: MapCenter) => {
    try {
      setSelectedLocation(location);

      // Create field with placeholder geometry
      const tempField = await createField({
        name: `Field at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
        cropType: "paddy",
        notes: "Boundary being detected...",
        geometry: PLACEHOLDER_GEOMETRY,
      });

      setCreatedFieldId(tempField.id);

      // Start boundary detection
      setCurrentStep("detecting-boundary");

      const detectedGeometry = await boundaryDetection.detect();

      // Calculate area
      const area = calculatePolygonArea(detectedGeometry);
      setDetectedBoundary(detectedGeometry);
      setDetectedArea(area);

      // Move to confirmation step
      setCurrentStep("confirm-boundary");

      showToast({
        title: "Boundary detected",
        description: `Field boundary detected successfully (${area.toFixed(2)} ha)`,
        variant: "success",
      });
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to detect boundary";
      showToast({
        title: "Boundary detection failed",
        description: message,
        variant: "error",
      });

      // If field was created but detection failed, delete it or allow retry
      setCurrentStep("select-location");
    }
  };

  /**
   * Step 3: Boundary confirmed - proceed to details
   * (Boundary will be saved when user submits the form)
   */
  const handleBoundaryConfirmed = () => {
    setCurrentStep("enter-details");
  };

  /**
   * Step 3 Alt: User wants to adjust boundary manually
   */
  const handleAdjustBoundary = () => {
    showToast({
      title: "Coming soon",
      description:
        "Manual boundary editing will be available in a future update.",
      variant: "default",
    });
  };

  /**
   * Step 3 Alt: User wants to start over
   */
  const handleCancelBoundary = () => {
    setCurrentStep("select-location");
    setSelectedLocation(null);
    setDetectedBoundary(null);
    setCreatedFieldId(null);
  };

  /**
   * Step 4: Field details submitted - finalize and navigate
   */
  const handleDetailsSubmit = async (values: FieldFormValues) => {
    if (!createdFieldId || !detectedBoundary) return;

    try {
      // Import the update hook
      const { updateField: apiUpdateField } = await import("../api/fieldsApi");

      // Update field with final details and boundary
      await apiUpdateField(createdFieldId, {
        name: values.name,
        cropType: values.cropType,
        notes: values.notes,
        geometry: detectedBoundary,
      });

      setCurrentField(createdFieldId);
      showToast({
        title: "Field created successfully",
        description: `${values.name} has been added to your fields.`,
        variant: "success",
      });

      // Navigate to field detail page
      navigate(`/fields/${createdFieldId}`);
    } catch (error) {
      const message =
        (error as Error)?.message ?? "Failed to save field details";
      showToast({
        title: "Save failed",
        description: message,
        variant: "error",
      });
    }
  };

  const handleCancel = () => {
    navigate("/fields");
  };

  // Render current step
  switch (currentStep) {
    case "select-location":
      return (
        <FieldLocationSelector
          onLocationConfirmed={handleLocationConfirmed}
          onCancel={handleCancel}
        />
      );

    case "detecting-boundary":
      return (
        <BoundaryDetectionProgress
          progress={boundaryDetection.progress}
          currentStep={boundaryDetection.currentStep}
          estimatedTime={boundaryDetection.estimatedTime}
        />
      );

    case "confirm-boundary":
      if (!detectedBoundary) return null;
      return (
        <BoundaryConfirmation
          boundary={detectedBoundary}
          area={detectedArea}
          onConfirm={handleBoundaryConfirmed}
          onAdjust={handleAdjustBoundary}
          onCancel={handleCancelBoundary}
        />
      );

    case "enter-details":
      return (
        <section
          aria-labelledby="field-details-heading"
          className="min-h-screen bg-gray-50 py-6 px-4"
        >
          <div className="max-w-2xl mx-auto">
            <header className="mb-6">
              <h1
                id="field-details-heading"
                className="text-2xl font-semibold text-gray-900 mb-2"
              >
                Almost Done! 🎉
              </h1>
              <p className="text-sm text-gray-600">
                Boundary detected successfully. Now give your field a name and
                add details.
              </p>
            </header>

            <Card>
              <FieldForm
                mode="create"
                onSubmit={handleDetailsSubmit}
                isSubmitting={isCreating}
                onCancel={handleCancel}
              />
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  <strong>✓ Detected Area:</strong> {detectedArea.toFixed(2)}{" "}
                  hectares
                </p>
              </div>
            </Card>
          </div>
        </section>
      );

    default:
      return null;
  }
};

export default CreateFieldWithMapPage;
