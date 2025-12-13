/**
 * YieldEntryForm Component
 * Form for farmers to enter actual harvest yield data
 */

import React, { useState } from "react";

import { Button } from "../../../shared/ui/Button";

export interface YieldEntryValues {
  harvestDate: string; // ISO date string
  actualYieldKgPerHa: number;
  totalYieldKg?: number;
  notes?: string;
}

interface YieldEntryFormProps {
  fieldId: string;
  fieldAreaHa: number;
  predictedYieldKgPerHa?: number;
  onSubmit: (values: YieldEntryValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * YieldEntryForm
 *
 * Simple form for farmers to log their actual harvest yield
 * Compares against predicted yield and calculates accuracy
 *
 * @example
 * ```tsx
 * <YieldEntryForm
 *   fieldId="field-123"
 *   fieldAreaHa={2.5}
 *   predictedYieldKgPerHa={4500}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export const YieldEntryForm: React.FC<YieldEntryFormProps> = ({
  fieldId: _fieldId,
  fieldAreaHa,
  predictedYieldKgPerHa,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const today = new Date().toISOString().split("T")[0];

  const [harvestDate, setHarvestDate] = useState(today);
  const [yieldInputType, setYieldInputType] = useState<"per_ha" | "total">(
    "per_ha",
  );
  const [yieldKgPerHa, setYieldKgPerHa] = useState<string>("");
  const [totalYieldKg, setTotalYieldKg] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate the other field when one is entered
  const handlePerHaChange = (value: string) => {
    setYieldKgPerHa(value);
    if (value && !isNaN(parseFloat(value))) {
      const perHa = parseFloat(value);
      setTotalYieldKg((perHa * fieldAreaHa).toFixed(0));
    }
  };

  const handleTotalChange = (value: string) => {
    setTotalYieldKg(value);
    if (value && !isNaN(parseFloat(value))) {
      const total = parseFloat(value);
      setYieldKgPerHa((total / fieldAreaHa).toFixed(0));
    }
  };

  // Calculate accuracy if prediction exists
  const accuracy = (() => {
    if (!predictedYieldKgPerHa || !yieldKgPerHa) return null;
    const actual = parseFloat(yieldKgPerHa);
    if (isNaN(actual)) return null;

    const error = Math.abs(actual - predictedYieldKgPerHa);
    const mape = (error / actual) * 100;
    return {
      difference: actual - predictedYieldKgPerHa,
      percentageError: mape,
      isAccurate: mape < 15, // <15% error is good
    };
  })();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!harvestDate) {
      newErrors.harvestDate = "Harvest date is required";
    }

    const yieldValue =
      yieldInputType === "per_ha" ? yieldKgPerHa : totalYieldKg;
    if (!yieldValue || yieldValue.trim() === "") {
      newErrors.yield = "Yield amount is required";
    } else {
      const num = parseFloat(yieldValue);
      if (isNaN(num) || num <= 0) {
        newErrors.yield = "Yield must be a positive number";
      } else if (yieldInputType === "per_ha" && num > 15000) {
        newErrors.yield =
          "Yield per hectare seems unusually high (>15,000 kg/ha)";
      } else if (yieldInputType === "total" && num > 50000) {
        newErrors.yield = "Total yield seems unusually high";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const actualYieldKgPerHa = parseFloat(yieldKgPerHa);
    const totalYield = parseFloat(totalYieldKg);

    const values: YieldEntryValues = {
      harvestDate,
      actualYieldKgPerHa,
      totalYieldKg: !isNaN(totalYield) ? totalYield : undefined,
      notes: notes.trim() || undefined,
    };

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Harvest Date */}
      <div>
        <label
          htmlFor="harvest-date"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          Harvest Date <span className="text-red-500">*</span>
        </label>
        <input
          id="harvest-date"
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          max={today}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
        {errors.harvestDate && (
          <p className="mt-1 text-xs text-red-600">{errors.harvestDate}</p>
        )}
      </div>

      {/* Yield Input Type Toggle */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-900 mb-2">
          Enter yield as <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setYieldInputType("per_ha")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              yieldInputType === "per_ha"
                ? "bg-brand-blue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Per Hectare (kg/ha)
          </button>
          <button
            type="button"
            onClick={() => setYieldInputType("total")}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              yieldInputType === "total"
                ? "bg-brand-blue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Total Yield (kg)
          </button>
        </div>
      </fieldset>

      {/* Yield Input */}
      <div>
        <label
          htmlFor="yield-input"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          {yieldInputType === "per_ha"
            ? "Yield per Hectare (kg/ha)"
            : "Total Yield (kg)"}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          id="yield-input"
          type="number"
          step="0.1"
          value={yieldInputType === "per_ha" ? yieldKgPerHa : totalYieldKg}
          onChange={(e) =>
            yieldInputType === "per_ha"
              ? handlePerHaChange(e.target.value)
              : handleTotalChange(e.target.value)
          }
          placeholder={
            yieldInputType === "per_ha" ? "e.g., 4500" : "e.g., 11250"
          }
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
        />
        {errors.yield && (
          <p className="mt-1 text-xs text-red-600">{errors.yield}</p>
        )}

        {/* Calculated value display */}
        {yieldKgPerHa && totalYieldKg && (
          <p className="mt-1 text-xs text-gray-600">
            {yieldInputType === "per_ha" ? (
              <>
                ≈ {totalYieldKg} kg total for {fieldAreaHa.toFixed(2)} ha
              </>
            ) : (
              <>
                ≈ {yieldKgPerHa} kg/ha for {fieldAreaHa.toFixed(2)} ha
              </>
            )}
          </p>
        )}
      </div>

      {/* Prediction Comparison */}
      {predictedYieldKgPerHa && accuracy && (
        <div
          className={`rounded-lg border p-3 ${
            accuracy.isAccurate
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <p className="text-sm font-medium text-gray-900 mb-1">
            Prediction Comparison
          </p>
          <div className="space-y-1 text-xs text-gray-700">
            <p>
              <strong>Predicted:</strong> {predictedYieldKgPerHa.toFixed(0)}{" "}
              kg/ha
            </p>
            <p>
              <strong>Actual:</strong> {parseFloat(yieldKgPerHa).toFixed(0)}{" "}
              kg/ha
            </p>
            <p>
              <strong>Difference:</strong>{" "}
              <span
                className={
                  accuracy.difference >= 0 ? "text-green-700" : "text-red-700"
                }
              >
                {accuracy.difference >= 0 ? "+" : ""}
                {accuracy.difference.toFixed(0)} kg/ha (
                {accuracy.percentageError.toFixed(1)}% error)
              </span>
            </p>
            {accuracy.isAccurate ? (
              <p className="text-green-700 font-medium mt-2">
                ✓ Our prediction was accurate! This helps improve future
                predictions.
              </p>
            ) : (
              <p className="text-yellow-700 font-medium mt-2">
                ⚠ Significant difference. We&apos;ll use this data to improve future
                predictions.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label
          htmlFor="yield-notes"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          Notes (Optional)
        </label>
        <textarea
          id="yield-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="e.g., Weather was favorable, good irrigation..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Saving..." : "Save Yield Data"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        💡 <strong>Tip:</strong> Entering accurate yield data helps our AI
        improve predictions for your next season.
      </p>
    </form>
  );
};

export default YieldEntryForm;
