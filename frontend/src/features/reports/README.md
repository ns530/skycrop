# Reports Feature

Generate and export reports in PDF and Excel formats for fields, health data, yield forecasts, and recommendations.

## Features

### 📄 PDF Reports

- **Field Health Report**: NDVI/NDWI/TDVI trends, health scores, anomalies
- **Yield Forecast Report**: Predicted yields, confidence intervals, revenue estimates
- **Combined Analysis Report**: Comprehensive field analysis with health and yield data

### 📊 Excel Exports

- **Recommendations Summary**: All recommendations with action steps, costs, and status
- **Field Data Export**: Field information and health scores
- **Health Data Export**: Time-series health metrics (NDVI, NDWI, TDVI)

## Components

### ReportBuilderPage

Main page for building and generating reports. Allows users to:

- Select report type (health, yield, recommendations, combined)
- Select multiple fields
- Choose date range
- Generate and download reports

**Usage:**

```tsx
import { ReportBuilderPage } from "@/features/reports";

// In router
<Route path="/reports/builder" element={<ReportBuilderPage />} />;
```

### ExportButton

Reusable button component for quick exports with loading state and error handling.

**Usage:**

```tsx
import { ExportButton } from "@/features/reports";
import { exportHealthDataToExcel } from "@/shared/utils/excelReports";

<ExportButton
  onExport={() => exportHealthDataToExcel(fieldName, healthRecords)}
  label="Export to Excel"
  variant="secondary"
  size="sm"
/>;
```

## Utilities

### PDF Reports (`shared/utils/pdfReports.ts`)

#### `generateFieldHealthReportPDF(data)`

Generates a PDF report for field health analysis.

**Parameters:**

- `data.field`: Field information (name, crop_type, area)
- `data.healthHistory`: Array of health records with NDVI/NDWI/TDVI/health_score
- `data.trend`: Health trend ('improving', 'declining', 'stable')
- `data.anomalies`: Array of detected anomalies
- `data.generatedAt`: Timestamp

**Example:**

```typescript
import { generateFieldHealthReportPDF } from "@/shared/utils/pdfReports";

generateFieldHealthReportPDF({
  field: { name: "Field A", crop_type: "paddy", area: 2.5 },
  healthHistory: [
    {
      measurement_date: "2024-03-01",
      ndvi_mean: 0.8,
      ndwi_mean: 0.7,
      tdvi_mean: 0.75,
      health_score: 85,
    },
    // ... more records
  ],
  trend: "stable",
  anomalies: [],
  generatedAt: new Date().toISOString(),
});
```

#### `generateYieldForecastReportPDF(data)`

Generates a PDF report for yield forecasts.

**Parameters:**

- `data.field`: Field information
- `data.predictions`: Array of yield predictions with confidence intervals
- `data.actualYield`: Array of actual harvest data (optional)
- `data.generatedAt`: Timestamp

#### `generateCombinedFieldReportPDF(healthData, yieldData)`

Generates a comprehensive PDF report combining health and yield analysis.

### Excel Exports (`shared/utils/excelReports.ts`)

#### `exportRecommendationsToExcel(recommendations, filename?)`

Exports recommendations to Excel format.

**Parameters:**

- `recommendations`: Array of recommendation objects
- `filename`: Optional custom filename

**Example:**

```typescript
import { exportRecommendationsToExcel } from "@/shared/utils/excelReports";

exportRecommendationsToExcel(recommendations, "my-recommendations.xlsx");
```

#### `exportRecommendationsSummaryToExcel(recommendations, stats?)`

Exports recommendations summary with multiple sheets (all, critical, by priority, by type, by status).

#### `exportFieldDataToExcel(fields)`

Exports field data to Excel.

#### `exportHealthDataToExcel(fieldName, healthRecords)`

Exports health metrics to Excel.

## Dependencies

- **jspdf**: PDF generation
- **jspdf-autotable**: Tables in PDFs
- **xlsx**: Excel file generation
- **file-saver**: File download

## Installation

```bash
npm install jspdf jspdf-autotable xlsx file-saver
npm install --save-dev @types/file-saver
```

## Type Definitions

### FieldHealthReportData

```typescript
interface FieldHealthReportData {
  field: {
    name: string;
    crop_type: string;
    area: number;
  };
  healthHistory: Array<{
    measurement_date: string;
    ndvi_mean: number;
    ndwi_mean: number;
    tdvi_mean: number;
    health_score: number;
  }>;
  trend: string;
  anomalies: Array<{
    date: string;
    severity: string;
    description: string;
  }>;
  generatedAt: string;
}
```

### YieldForecastReportData

```typescript
interface YieldForecastReportData {
  field: {
    name: string;
    crop_type: string;
    area: number;
  };
  predictions: Array<{
    prediction_date: string;
    predicted_yield_per_ha: number;
    predicted_total_yield: number;
    confidence_lower: number;
    confidence_upper: number;
    expected_revenue: number;
    harvest_date_estimate: string;
  }>;
  actualYield: Array<{
    harvest_date: string;
    actual_yield: number;
  }>;
  generatedAt: string;
}
```

## Usage Examples

### Generate Health Report for a Single Field

```typescript
import { useFieldHealth } from '@/features/health/hooks/useFieldHealth';
import { generateFieldHealthReportPDF } from '@/shared/utils/pdfReports';

const FieldDetailPage = ({ fieldId }) => {
  const { data: healthData } = useFieldHealth(fieldId, '30d');

  const handleExportHealthReport = () => {
    const reportData = {
      field: {
        name: healthData.field.name,
        crop_type: healthData.field.crop_type,
        area: healthData.field.area,
      },
      healthHistory: healthData.items,
      trend: healthData.trend,
      anomalies: healthData.anomalies || [],
      generatedAt: new Date().toISOString(),
    };

    generateFieldHealthReportPDF(reportData);
  };

  return (
    <div>
      <ExportButton
        onExport={handleExportHealthReport}
        label="Export Health Report (PDF)"
      />
    </div>
  );
};
```

### Export Recommendations to Excel

```typescript
import { useRecommendations } from '@/features/recommendations/hooks/useRecommendations';
import { exportRecommendationsToExcel } from '@/shared/utils/excelReports';

const RecommendationsPage = () => {
  const { data: recommendations } = useRecommendations();

  const handleExportRecommendations = () => {
    exportRecommendationsToExcel(recommendations);
  };

  return (
    <div>
      <ExportButton
        onExport={handleExportRecommendations}
        label="Export to Excel"
      />
    </div>
  );
};
```

### Batch Report Generation

```typescript
const ReportBuilder = () => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const handleGenerateBatchReports = async () => {
    for (const fieldId of selectedFields) {
      // Fetch data for each field
      const healthData = await fetchFieldHealth(fieldId);
      const yieldData = await fetchYieldPredictions(fieldId);

      // Generate combined report
      generateCombinedFieldReportPDF(healthData, yieldData);

      // Add delay to avoid overwhelming browser
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  return (
    <Button onClick={handleGenerateBatchReports}>
      Generate Reports for {selectedFields.length} Fields
    </Button>
  );
};
```

## Styling

Reports use a clean, professional design with:

- **Colors**: Blue headers (#2563EB), alternating row backgrounds
- **Fonts**: Sans-serif for readability
- **Layout**: Consistent spacing, clear sections, page numbers
- **Branding**: SkyCrop logo and branding in footers

## Future Enhancements

- [ ] Custom report templates
- [ ] Scheduled report generation
- [ ] Email report delivery
- [ ] Report history and archiving
- [ ] Custom date ranges per metric
- [ ] Multi-language support
- [ ] Chart images in PDFs
- [ ] CSV export option
- [ ] Batch email sending
- [ ] Report sharing (URL links)

## Testing

```typescript
// Test PDF generation
import { generateFieldHealthReportPDF } from "@/shared/utils/pdfReports";

describe("PDF Reports", () => {
  it("should generate health report without errors", () => {
    const mockData = {
      field: { name: "Test Field", crop_type: "paddy", area: 2.5 },
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

    expect(() => generateFieldHealthReportPDF(mockData)).not.toThrow();
  });
});
```

## Performance Considerations

- **Large datasets**: Limit health history to last 90 days for performance
- **Batch exports**: Add delays between reports to avoid browser freezing
- **Excel file size**: Large exports (>10,000 rows) may be slow
- **PDF rendering**: Complex tables may take 2-3 seconds to render

## Troubleshooting

### PDF download doesn't work

- Check browser pop-up blocker settings
- Ensure jsPDF is properly imported
- Check console for errors

### Excel export shows corrupted file

- Verify data structure matches expected format
- Check for special characters in field names
- Ensure XLSX library is properly installed

### Reports are empty

- Verify data is fetched before calling export functions
- Check that date ranges include actual data
- Ensure field IDs are valid

---

**Status**: ✅ Complete (Sprint 4, Phase 4, Task 4.5)  
**Last Updated**: November 21, 2025
