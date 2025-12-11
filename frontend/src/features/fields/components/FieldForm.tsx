import React, { useEffect, useState } from "react";

import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";

export type FieldFormMode = "create" | "edit";

export interface FieldFormValues {
  name: string;
  cropType?: string;
  notes?: string;
}

export interface FieldFormProps {
  mode: FieldFormMode;
  initialValue?: FieldFormValues;
  onSubmit: (values: FieldFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

/**
 * FieldForm
 *
 * Shared form for creating and editing field metadata (non-map aspects).
 * - Validates required name with simple length thresholds
 * - Provides accessible labels and inline error messages
 * - Renders inside a Card with primary Save and optional Cancel actions
 */
export const FieldForm: React.FC<FieldFormProps> = ({
  mode,
  initialValue,
  onSubmit,
  isSubmitting = false,
  onCancel,
}) => {
  const [values, setValues] = useState<FieldFormValues>({
    name: "",
    cropType: "",
    notes: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FieldFormValues, string>>
  >({});

  useEffect(() => {
    if (initialValue) {
      setValues({
        name: initialValue.name ?? "",
        cropType: initialValue.cropType ?? "",
        notes: initialValue.notes ?? "",
      });
    }
  }, [initialValue]);

  const validate = (nextValues: FieldFormValues): boolean => {
    const nextErrors: Partial<Record<keyof FieldFormValues, string>> = {};

    if (!nextValues.name || nextValues.name.trim().length === 0) {
      nextErrors.name = "Field name is required.";
    } else if (nextValues.name.trim().length < 2) {
      nextErrors.name = "Field name should be at least 2 characters.";
    } else if (nextValues.name.trim().length > 100) {
      nextErrors.name = "Field name should be shorter than 100 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange =
    (field: keyof FieldFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = {
        ...values,
        [field]: event.target.value,
      } as FieldFormValues;
      setValues(next);

      // Run lightweight validation on name to give early feedback
      if (field === "name" && errors.name) {
        validate(next);
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const isValid = validate(values);
    if (!isValid) return;

    await onSubmit({
      name: values.name.trim(),
      cropType: values.cropType?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
  };

  const title = mode === "create" ? "Create field" : "Edit field details";
  const primaryLabel = mode === "create" ? "Save field" : "Save changes";

  return (
    <Card title={title} className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="field-name"
            className="block text-sm font-medium text-gray-900"
          >
            Field name
          </label>
          <input
            id="field-name"
            name="name"
            type="text"
            required
            value={values.name}
            onChange={handleChange("name")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "field-name-error" : undefined}
          />
          {errors.name && (
            <p id="field-name-error" className="mt-1 text-xs text-status-poor">
              {errors.name}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Choose a short, descriptive name to identify this field on maps and
            reports.
          </p>
        </div>

        <div>
          <label
            htmlFor="field-crop-type"
            className="block text-sm font-medium text-gray-900"
          >
            Crop type (optional)
          </label>
          <input
            id="field-crop-type"
            name="cropType"
            type="text"
            value={values.cropType ?? ""}
            onChange={handleChange("cropType")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            placeholder="e.g., Rice, Maize"
          />
          <p className="mt-1 text-xs text-gray-500">
            This helps tailor health indices and recommendations to the correct
            crop.
          </p>
        </div>

        <div>
          <label
            htmlFor="field-notes"
            className="block text-sm font-medium text-gray-900"
          >
            Notes (optional)
          </label>
          <textarea
            id="field-notes"
            name="notes"
            rows={4}
            value={values.notes ?? ""}
            onChange={handleChange("notes")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            placeholder="Add any notes about access, irrigation, or local context."
          />
          <p className="mt-1 text-xs text-gray-500">
            Notes are for your reference only and are not used directly by ML
            models yet.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-2">
          {onCancel && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : primaryLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default FieldForm;
