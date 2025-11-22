import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

/**
 * Generate Field Health Report PDF
 */
export const generateFieldHealthReportPDF = (data: FieldHealthReportData): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Field Health Report', 14, 22);
  
  // Field Information
  doc.setFontSize(12);
  doc.text(`Field: ${data.field.name}`, 14, 32);
  doc.text(`Crop Type: ${data.field.crop_type}`, 14, 38);
  doc.text(`Area: ${data.field.area} hectares`, 14, 44);
  doc.text(`Report Generated: ${new Date(data.generatedAt).toLocaleString()}`, 14, 50);
  
  // Health Trend Summary
  doc.setFontSize(14);
  doc.text('Health Trend Summary', 14, 60);
  doc.setFontSize(10);
  doc.text(`Overall Trend: ${data.trend.toUpperCase()}`, 14, 66);
  
  // Health History Table
  doc.setFontSize(14);
  doc.text('Health History', 14, 76);
  
  autoTable(doc, {
    startY: 80,
    head: [['Date', 'NDVI', 'NDWI', 'TDVI', 'Health Score']],
    body: data.healthHistory.map((record) => [
      new Date(record.measurement_date).toLocaleDateString(),
      record.ndvi_mean.toFixed(3),
      record.ndwi_mean.toFixed(3),
      record.tdvi_mean.toFixed(3),
      record.health_score.toFixed(0),
    ]),
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Anomalies Section
  if (data.anomalies.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 140;
    doc.setFontSize(14);
    doc.text('Detected Anomalies', 14, finalY + 10);
    
    autoTable(doc, {
      startY: finalY + 14,
      head: [['Date', 'Severity', 'Description']],
      body: data.anomalies.map((anomaly) => [
        new Date(anomaly.date).toLocaleDateString(),
        anomaly.severity.toUpperCase(),
        anomaly.description,
      ]),
      headStyles: { fillColor: [239, 68, 68] },
      alternateRowStyles: { fillColor: [254, 242, 242] },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `SkyCrop - Field Health Report | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Download
  doc.save(`field-health-report-${data.field.name}-${Date.now()}.pdf`);
};

/**
 * Generate Yield Forecast Report PDF
 */
export const generateYieldForecastReportPDF = (data: YieldForecastReportData): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Yield Forecast Report', 14, 22);
  
  // Field Information
  doc.setFontSize(12);
  doc.text(`Field: ${data.field.name}`, 14, 32);
  doc.text(`Crop Type: ${data.field.crop_type}`, 14, 38);
  doc.text(`Area: ${data.field.area} hectares`, 14, 44);
  doc.text(`Report Generated: ${new Date(data.generatedAt).toLocaleString()}`, 14, 50);
  
  // Yield Predictions Table
  doc.setFontSize(14);
  doc.text('Yield Predictions', 14, 60);
  
  autoTable(doc, {
    startY: 64,
    head: [['Prediction Date', 'Yield (kg/ha)', 'Total Yield (kg)', 'Confidence Range', 'Revenue', 'Harvest Date']],
    body: data.predictions.map((pred) => [
      new Date(pred.prediction_date).toLocaleDateString(),
      pred.predicted_yield_per_ha.toFixed(0),
      pred.predicted_total_yield.toFixed(0),
      `${pred.confidence_lower.toFixed(0)} - ${pred.confidence_upper.toFixed(0)}`,
      `LKR ${pred.expected_revenue.toLocaleString()}`,
      new Date(pred.harvest_date_estimate).toLocaleDateString(),
    ]),
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  // Actual Yield Table
  if (data.actualYield.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.text('Actual Yield History', 14, finalY + 10);
    
    autoTable(doc, {
      startY: finalY + 14,
      head: [['Harvest Date', 'Actual Yield (kg)']],
      body: data.actualYield.map((yield_data) => [
        new Date(yield_data.harvest_date).toLocaleDateString(),
        yield_data.actual_yield.toLocaleString(),
      ]),
      headStyles: { fillColor: [34, 197, 94] },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    });
  }
  
  // Summary Stats
  if (data.predictions.length > 0) {
    const latestPred = data.predictions[0];
    const finalY = (doc as any).lastAutoTable.finalY || 160;
    
    doc.setFontSize(14);
    doc.text('Forecast Summary', 14, finalY + 10);
    doc.setFontSize(10);
    doc.text(`Latest Prediction: ${latestPred.predicted_yield_per_ha.toFixed(0)} kg/ha`, 14, finalY + 18);
    doc.text(`Total Expected Yield: ${latestPred.predicted_total_yield.toFixed(0)} kg`, 14, finalY + 24);
    doc.text(`Expected Revenue: LKR ${latestPred.expected_revenue.toLocaleString()}`, 14, finalY + 30);
    doc.text(`Estimated Harvest: ${new Date(latestPred.harvest_date_estimate).toLocaleDateString()}`, 14, finalY + 36);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `SkyCrop - Yield Forecast Report | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Download
  doc.save(`yield-forecast-report-${data.field.name}-${Date.now()}.pdf`);
};

/**
 * Generate Combined Field Report PDF
 */
export const generateCombinedFieldReportPDF = (
  healthData: FieldHealthReportData,
  yieldData: YieldForecastReportData
): void => {
  const doc = new jsPDF();
  
  // Title Page
  doc.setFontSize(24);
  doc.text('Field Analysis Report', 14, 40);
  doc.setFontSize(16);
  doc.text(healthData.field.name, 14, 50);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 60);
  
  // Field Overview
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Field Overview', 14, 22);
  doc.setFontSize(10);
  doc.text(`Name: ${healthData.field.name}`, 14, 32);
  doc.text(`Crop Type: ${healthData.field.crop_type}`, 14, 38);
  doc.text(`Area: ${healthData.field.area} hectares`, 14, 44);
  
  // Health Section
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Health Analysis', 14, 22);
  doc.setFontSize(12);
  doc.text(`Trend: ${healthData.trend}`, 14, 32);
  
  autoTable(doc, {
    startY: 38,
    head: [['Date', 'NDVI', 'Health Score']],
    body: healthData.healthHistory.slice(0, 10).map((record) => [
      new Date(record.measurement_date).toLocaleDateString(),
      record.ndvi_mean.toFixed(3),
      record.health_score.toFixed(0),
    ]),
    headStyles: { fillColor: [37, 99, 235] },
  });
  
  // Yield Section
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Yield Forecast', 14, 22);
  
  if (yieldData.predictions.length > 0) {
    autoTable(doc, {
      startY: 28,
      head: [['Prediction Date', 'Yield (kg/ha)', 'Revenue']],
      body: yieldData.predictions.slice(0, 10).map((pred) => [
        new Date(pred.prediction_date).toLocaleDateString(),
        pred.predicted_yield_per_ha.toFixed(0),
        `LKR ${pred.expected_revenue.toLocaleString()}`,
      ]),
      headStyles: { fillColor: [37, 99, 235] },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `SkyCrop - Field Analysis Report | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Download
  doc.save(`field-analysis-report-${healthData.field.name}-${Date.now()}.pdf`);
};

