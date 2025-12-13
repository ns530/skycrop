import React, { useState } from "react";

import { useToast } from "../../../shared/hooks/useToast";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { exportRecommendationsToExcel } from "../../../shared/utils/excelReports";
import {
  generateFieldHealthReportPDF,
  generateYieldForecastReportPDF,
  generateCombinedFieldReportPDF,
} from "../../../shared/utils/pdfReports";
import { useFields } from "../../fields/hooks/useFields";

type ReportType = "health" | "yield" | "recommendations" | "combined";

/**
 * Report Builder Page
 * Allows users to select fields, date ranges, and generate reports
 */
export const ReportBuilderPage: React.FC = () => {
  const { showToast } = useToast();
  const { data: fieldsData, isLoading: fieldsLoading } = useFields();

  const [reportType, setReportType] = useState<ReportType>("health");
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const fields = fieldsData?.data || [];

  const handleFieldSelection = (fieldId: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId],
    );
  };

  const handleSelectAll = () => {
    if (selectedFieldIds.length === fields.length) {
      setSelectedFieldIds([]);
    } else {
      setSelectedFieldIds(fields.map((field) => field.id));
    }
  };

  const handleGenerateReport = async () => {
    if (selectedFieldIds.length === 0) {
      showToast({
        variant: "error",
        title: "No fields selected",
        description: "Please select at least one field to generate a report.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      if (reportType === "health") {
        await generateHealthReports();
      } else if (reportType === "yield") {
        await generateYieldReports();
      } else if (reportType === "recommendations") {
        await generateRecommendationsReport();
      } else if (reportType === "combined") {
        await generateCombinedReports();
      }

      showToast({
        variant: "success",
        title: "Report generated",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      showToast({
        variant: "error",
        title: "Report generation failed",
        description:
          "An error occurred while generating the report. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHealthReports = async () => {
    for (const fieldId of selectedFieldIds) {
      const field = fields.find((f) => f.id === fieldId);
      if (!field) continue;

      // Fetch health data (in real app, use API)
      const healthData = {
        field: {
          name: field.name,
          crop_type: "Unknown", // Crop type not available in FieldSummary
          area: field.areaHa,
        },
        healthHistory: [
          // Mock data - in real app, fetch from API
          {
            measurement_date: "2024-03-01",
            ndvi_mean: 0.8,
            ndwi_mean: 0.7,
            tdvi_mean: 0.75,
            health_score: 85,
          },
          {
            measurement_date: "2024-03-15",
            ndvi_mean: 0.75,
            ndwi_mean: 0.68,
            tdvi_mean: 0.72,
            health_score: 80,
          },
        ],
        trend: "stable",
        anomalies: [],
        generatedAt: new Date().toISOString(),
      };

      generateFieldHealthReportPDF(healthData);
    }
  };

  const generateYieldReports = async () => {
    for (const fieldId of selectedFieldIds) {
      const field = fields.find((f) => f.id === fieldId);
      if (!field) continue;

      // Mock data - in real app, fetch from API
      const yieldData = {
        field: {
          name: field.name,
          crop_type: "Unknown", // Crop type not available in FieldSummary
          area: field.areaHa,
        },
        predictions: [
          {
            prediction_date: "2024-03-01",
            predicted_yield_per_ha: 5000,
            predicted_total_yield: 12500,
            confidence_lower: 4500,
            confidence_upper: 5500,
            expected_revenue: 450000,
            harvest_date_estimate: "2024-06-30",
          },
        ],
        actualYield: [],
        generatedAt: new Date().toISOString(),
      };

      generateYieldForecastReportPDF(yieldData);
    }
  };

  const generateRecommendationsReport = async () => {
    // Mock data - in real app, fetch from API
    const recommendations = selectedFieldIds.flatMap((fieldId) => {
      const field = fields.find((f) => f.id === fieldId);
      return [
        {
          recommendation_id: `rec-${fieldId}-1`,
          field_name: field?.name || "Unknown",
          type: "fertilizer",
          priority: "high",
          urgency_score: 8,
          title: "Apply NPK Fertilizer",
          description: "Field shows signs of nutrient deficiency",
          action_steps: [
            "Test soil",
            "Apply 50kg NPK per hectare",
            "Monitor growth",
          ],
          estimated_cost: 5000,
          expected_benefit: "Improved yield by 15%",
          timing: "Within 1 week",
          status: "pending",
          created_at: new Date().toISOString(),
          valid_until: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];
    });

    exportRecommendationsToExcel(recommendations);
  };

  const generateCombinedReports = async () => {
    for (const fieldId of selectedFieldIds) {
      const field = fields.find((f) => f.id === fieldId);
      if (!field) continue;

      // Mock data
      const healthData = {
        field: {
          name: field.name,
          crop_type: "Unknown", // Crop type not available in FieldSummary
          area: field.areaHa,
        },
        healthHistory: [
          {
            measurement_date: "2024-03-01",
            ndvi_mean: 0.8,
            ndwi_mean: 0.7,
            tdvi_mean: 0.75,
            health_score: 85,
          },
        ],
        trend: "stable",
        anomalies: [],
        generatedAt: new Date().toISOString(),
      };

      const yieldData = {
        field: {
          name: field.name,
          crop_type: "Unknown", // Crop type not available in FieldSummary
          area: field.areaHa,
        },
        predictions: [
          {
            prediction_date: "2024-03-01",
            predicted_yield_per_ha: 5000,
            predicted_total_yield: 12500,
            confidence_lower: 4500,
            confidence_upper: 5500,
            expected_revenue: 450000,
            harvest_date_estimate: "2024-06-30",
          },
        ],
        actualYield: [],
        generatedAt: new Date().toISOString(),
      };

      generateCombinedFieldReportPDF(healthData, yieldData);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate comprehensive reports for your fields
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Type Selection */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Report Type
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setReportType("health")}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  reportType === "health"
                    ? "border-brand-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  Field Health Report
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  NDVI/NDWI/TDVI trends, anomalies, health scores
                </div>
                <div className="text-xs text-gray-500 mt-2">Format: PDF</div>
              </button>

              <button
                onClick={() => setReportType("yield")}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  reportType === "yield"
                    ? "border-brand-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  Yield Forecast Report
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Predicted yields, confidence intervals, revenue estimates
                </div>
                <div className="text-xs text-gray-500 mt-2">Format: PDF</div>
              </button>

              <button
                onClick={() => setReportType("recommendations")}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  reportType === "recommendations"
                    ? "border-brand-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  Recommendations Summary
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  All recommendations with action steps and costs
                </div>
                <div className="text-xs text-gray-500 mt-2">Format: Excel</div>
              </button>

              <button
                onClick={() => setReportType("combined")}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  reportType === "combined"
                    ? "border-brand-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  Combined Analysis Report
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Health + Yield + Overview in one comprehensive report
                </div>
                <div className="text-xs text-gray-500 mt-2">Format: PDF</div>
              </button>
            </div>
          </Card>

          {/* Field Selection */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Select Fields
              </h2>
              <button
                onClick={handleSelectAll}
                className="text-sm text-brand-blue hover:text-blue-700 font-medium"
              >
                {selectedFieldIds.length === fields.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {fieldsLoading ? (
              <div className="text-center py-8 text-gray-600">
                Loading fields...
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No fields available
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fields.map((field) => (
                  <label
                    key={field.id}
                    htmlFor={`field-${field.id}`}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    aria-label={`Select field ${field.name}`}
                  >
                    <input
                      id={`field-${field.id}`}
                      type="checkbox"
                      checked={selectedFieldIds.includes(field.id)}
                      onChange={() => handleFieldSelection(field.id)}
                      className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                    />
                    <span className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">
                        {field.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {field.areaHa} ha
                      </div>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Card>

          {/* Date Range */}
          {reportType !== "recommendations" && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Date Range
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="report-start-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="report-start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label
                    htmlFor="report-end-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    id="report-end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Report Preview & Generation */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Report Type:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {reportType.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Selected Fields:</span>
                <span className="font-medium text-gray-900">
                  {selectedFieldIds.length}
                </span>
              </div>
              {reportType !== "recommendations" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date Range:</span>
                  <span className="font-medium text-gray-900 text-right">
                    {new Date(dateRange.start).toLocaleDateString()} -{" "}
                    {new Date(dateRange.end).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium text-gray-900 uppercase">
                  {reportType === "recommendations" ? "Excel" : "PDF"}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleGenerateReport}
                disabled={isGenerating || selectedFieldIds.length === 0}
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              What&apos;s Included
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {reportType === "health" && (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>NDVI, NDWI, TDVI trends over time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Health score history</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Detected anomalies and alerts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Trend analysis (improving/declining/stable)</span>
                  </li>
                </>
              )}
              {reportType === "yield" && (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Predicted yield per hectare</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Confidence intervals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Revenue estimates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Harvest date predictions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Actual yield comparison (if available)</span>
                  </li>
                </>
              )}
              {reportType === "recommendations" && (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>All recommendations with priorities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Action steps for each recommendation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Cost estimates and expected benefits</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Status tracking</span>
                  </li>
                </>
              )}
              {reportType === "combined" && (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Field overview and summary</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Health analysis</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Yield forecast</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Comprehensive field analysis</span>
                  </li>
                </>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderPage;
