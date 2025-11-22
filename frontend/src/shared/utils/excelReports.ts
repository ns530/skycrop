import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Recommendation {
  recommendation_id: string;
  field_name: string;
  type: string;
  priority: string;
  urgency_score: number;
  title: string;
  description: string;
  action_steps: string[];
  estimated_cost: number | null;
  expected_benefit: string | null;
  timing: string | null;
  status: string;
  created_at: string;
  valid_until: string | null;
}

/**
 * Export Recommendations to Excel
 */
export const exportRecommendationsToExcel = (
  recommendations: Recommendation[],
  filename?: string
): void => {
  // Prepare data for Excel
  const excelData = recommendations.map((rec) => ({
    'Field': rec.field_name,
    'Type': rec.type,
    'Priority': rec.priority.toUpperCase(),
    'Urgency Score': rec.urgency_score,
    'Title': rec.title,
    'Description': rec.description,
    'Action Steps': rec.action_steps.join('; '),
    'Estimated Cost (LKR)': rec.estimated_cost ? rec.estimated_cost.toLocaleString() : 'N/A',
    'Expected Benefit': rec.expected_benefit || 'N/A',
    'Timing': rec.timing || 'N/A',
    'Status': rec.status.toUpperCase(),
    'Created Date': new Date(rec.created_at).toLocaleDateString(),
    'Valid Until': rec.valid_until ? new Date(rec.valid_until).toLocaleDateString() : 'N/A',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Auto-size columns
  const columnWidths = [
    { wch: 20 }, // Field
    { wch: 20 }, // Type
    { wch: 10 }, // Priority
    { wch: 12 }, // Urgency Score
    { wch: 30 }, // Title
    { wch: 50 }, // Description
    { wch: 60 }, // Action Steps
    { wch: 18 }, // Estimated Cost
    { wch: 30 }, // Expected Benefit
    { wch: 20 }, // Timing
    { wch: 12 }, // Status
    { wch: 15 }, // Created Date
    { wch: 15 }, // Valid Until
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recommendations');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download
  const finalFilename = filename || `recommendations-export-${Date.now()}.xlsx`;
  saveAs(blob, finalFilename);
};

/**
 * Export Recommendations Summary to Excel (Multiple Sheets)
 */
export const exportRecommendationsSummaryToExcel = (
  recommendations: Recommendation[],
  stats?: {
    totalRecommendations: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }
): void => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: All Recommendations
  const allRecsData = recommendations.map((rec) => ({
    'Field': rec.field_name,
    'Type': rec.type,
    'Priority': rec.priority.toUpperCase(),
    'Title': rec.title,
    'Status': rec.status.toUpperCase(),
    'Created': new Date(rec.created_at).toLocaleDateString(),
  }));
  const allRecsSheet = XLSX.utils.json_to_sheet(allRecsData);
  allRecsSheet['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 30 },
    { wch: 12 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, allRecsSheet, 'All Recommendations');

  // Sheet 2: Critical Recommendations
  const criticalRecs = recommendations.filter((rec) => rec.priority === 'critical');
  if (criticalRecs.length > 0) {
    const criticalData = criticalRecs.map((rec) => ({
      'Field': rec.field_name,
      'Title': rec.title,
      'Description': rec.description,
      'Action Steps': rec.action_steps.join('; '),
      'Status': rec.status.toUpperCase(),
    }));
    const criticalSheet = XLSX.utils.json_to_sheet(criticalData);
    criticalSheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 60 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, criticalSheet, 'Critical');
  }

  // Sheet 3: By Priority
  if (stats) {
    const priorityData = Object.entries(stats.byPriority).map(([priority, count]) => ({
      'Priority': priority.toUpperCase(),
      'Count': count,
      'Percentage': ((count / stats.totalRecommendations) * 100).toFixed(1) + '%',
    }));
    const prioritySheet = XLSX.utils.json_to_sheet(priorityData);
    XLSX.utils.book_append_sheet(workbook, prioritySheet, 'By Priority');
  }

  // Sheet 4: By Type
  if (stats) {
    const typeData = Object.entries(stats.byType).map(([type, count]) => ({
      'Type': type,
      'Count': count,
      'Percentage': ((count / stats.totalRecommendations) * 100).toFixed(1) + '%',
    }));
    const typeSheet = XLSX.utils.json_to_sheet(typeData);
    XLSX.utils.book_append_sheet(workbook, typeSheet, 'By Type');
  }

  // Sheet 5: By Status
  if (stats) {
    const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
      'Status': status.toUpperCase(),
      'Count': count,
      'Percentage': ((count / stats.totalRecommendations) * 100).toFixed(1) + '%',
    }));
    const statusSheet = XLSX.utils.json_to_sheet(statusData);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'By Status');
  }

  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `recommendations-summary-${Date.now()}.xlsx`);
};

/**
 * Export Field Data to Excel
 */
export const exportFieldDataToExcel = (
  fields: Array<{
    name: string;
    crop_type: string;
    area: number;
    health_score: number;
    last_updated: string;
  }>
): void => {
  const excelData = fields.map((field) => ({
    'Field Name': field.name,
    'Crop Type': field.crop_type,
    'Area (ha)': field.area,
    'Health Score': field.health_score,
    'Last Updated': new Date(field.last_updated).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fields');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `fields-export-${Date.now()}.xlsx`);
};

/**
 * Export Health Data to Excel
 */
export const exportHealthDataToExcel = (
  fieldName: string,
  healthRecords: Array<{
    measurement_date: string;
    ndvi_mean: number;
    ndwi_mean: number;
    tdvi_mean: number;
    health_score: number;
  }>
): void => {
  const excelData = healthRecords.map((record) => ({
    'Date': new Date(record.measurement_date).toLocaleDateString(),
    'NDVI': record.ndvi_mean.toFixed(3),
    'NDWI': record.ndwi_mean.toFixed(3),
    'TDVI': record.tdvi_mean.toFixed(3),
    'Health Score': record.health_score.toFixed(0),
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Health Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `health-data-${fieldName}-${Date.now()}.xlsx`);
};

