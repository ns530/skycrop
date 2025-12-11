import React from "react";
import { useNavigate } from "react-router-dom";

import { useUiState } from "../../../shared/context/UiContext";
import { useToast } from "../../../shared/hooks/useToast";
import type { FieldGeometry } from "../../../shared/types/geojson";
import { Card } from "../../../shared/ui/Card";
import { FieldForm, type FieldFormValues } from "../components/FieldForm";
import { useCreateField } from "../hooks/useFields";

/**
 * Default placeholder geometry used for field creation until
 * the interactive map-based boundary drawing is implemented.
 *
 * This represents a tiny square polygon around (0, 0). In future
 * iterations, this will be replaced with a real boundary drawn
 * or detected from satellite imagery.
 */
const DEFAULT_PLACEHOLDER_GEOMETRY: FieldGeometry = {
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
 * CreateFieldPage
 *
 * Non-map field creation flow at /fields/create.
 * - Uses FieldForm for metadata (name, cropType, notes)
 * - Temporarily uses a placeholder geometry until map integration
 * - On success, navigates to the newly created field detail view
 */
export const CreateFieldPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setCurrentField } = useUiState();
  const { mutateAsync: createField, isPending } = useCreateField();

  const handleSubmit = async (values: FieldFormValues) => {
    try {
      const created = await createField({
        name: values.name,
        cropType: values.cropType,
        notes: values.notes,
        geometry: DEFAULT_PLACEHOLDER_GEOMETRY,
      });

      setCurrentField(created.id);
      showToast({
        title: "Field created",
        description:
          "Your field was created successfully. You can now edit its boundary on the map.",
        variant: "success",
      });

      navigate(`/fields/${created.id}`);
    } catch (error) {
      const message =
        (error as Error)?.message ??
        "Failed to create field. Please try again.";
      showToast({
        title: "Could not create field",
        description: message,
        variant: "error",
      });
    }
  };

  const handleCancel = () => {
    navigate("/fields");
  };

  return (
    <section aria-labelledby="create-field-heading" className="space-y-4">
      <header className="space-y-1">
        <h1
          id="create-field-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Add new field
        </h1>
        <p className="text-sm text-gray-600">
          Provide basic details for your field. You will be able to refine its
          boundary on the map afterwards.
        </p>
      </header>

      <Card>
        <FieldForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isPending}
          onCancel={handleCancel}
        />
      </Card>
    </section>
  );
};

export default CreateFieldPage;
