import { httpClient, normalizeApiError } from '../../../shared/api';

export interface YieldPrediction {
  field_id?: string;
  yield_kg_per_ha: number;
  confidence_lower?: number;
  confidence_upper?: number;
  harvest_date?: string; // ISO date string
  optimal_yield?: number; // kg/ha
  previous_season_yield?: number; // kg/ha
}

export interface YieldForecastRequest {
  features?: Array<{
    field_id: string;
    [key: string]: number | string;
  }>;
  rows?: number[][];
  feature_names?: string[];
  model_version?: string;
}

export interface YieldForecastResponse {
  request_id: string;
  model: {
    name: string;
    version: string;
  };
  predictions: YieldPrediction[];
  metrics: {
    latency_ms: number;
  };
  warnings: string[];
}

// --------------------
// Backend envelopes (internal)
// --------------------

interface BackendYieldForecastEnvelope {
  success: boolean;
  data: YieldForecastResponse;
  meta?: Record<string, unknown>;
}

// --------------------
// Public API
// --------------------

/**
 * Get yield predictions for fields.
 *
 * POST /api/v1/ml/yield/predict
 */
export const getYieldForecast = async (request: YieldForecastRequest): Promise<YieldForecastResponse> => {
  try {
    const res = await httpClient.post<BackendYieldForecastEnvelope>('/ml/yield/predict', request);
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Actual Yield Record (user-submitted)
 */
export interface ActualYieldRecord {
  id: string;
  fieldId: string;
  harvestDate: string; // ISO date string
  predictedYieldKgPerHa?: number;
  actualYieldKgPerHa: number;
  totalYieldKg?: number;
  accuracy?: number; // MAPE percentage
  notes?: string;
  createdAt: string; // ISO timestamp
}

export interface SubmitYieldPayload {
  fieldId: string;
  harvestDate: string;
  actualYieldKgPerHa: number;
  totalYieldKg?: number;
  notes?: string;
}

// Local storage key for yield data
const YIELD_STORAGE_KEY = 'skycrop_yield_records';

/**
 * Get yield history for a field (mocked for now - would need backend endpoint)
 */
export const getYieldHistory = async (fieldId: string): Promise<YieldPrediction[]> => {
  // Mock data - in real implementation, this would call a backend endpoint
  const mockHistory: YieldPrediction[] = [
    { field_id: fieldId, yield_kg_per_ha: 4500, confidence_lower: 4200, confidence_upper: 4800 },
    { field_id: fieldId, yield_kg_per_ha: 4800, confidence_lower: 4500, confidence_upper: 5100 },
    { field_id: fieldId, yield_kg_per_ha: 4600, confidence_lower: 4300, confidence_upper: 4900 },
    { field_id: fieldId, yield_kg_per_ha: 4900, confidence_lower: 4600, confidence_upper: 5200 },
    { field_id: fieldId, yield_kg_per_ha: 4700, confidence_lower: 4400, confidence_upper: 5000 },
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return mockHistory;
};

/**
 * Get actual yield records for a field
 * Currently uses localStorage - will be replaced with backend API
 */
export const getActualYieldRecords = async (fieldId: string): Promise<ActualYieldRecord[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const stored = localStorage.getItem(YIELD_STORAGE_KEY);
    if (!stored) return [];

    const allRecords: ActualYieldRecord[] = JSON.parse(stored);
    return allRecords
      .filter(r => r.fieldId === fieldId)
      .sort((a, b) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime());
  } catch (error) {
    console.error('Failed to load yield records:', error);
    return [];
  }
};

/**
 * Submit actual yield data
 * Currently uses localStorage - will be replaced with backend API
 * 
 * @param payload - Yield data to submit
 * @returns Created yield record
 */
export const submitActualYield = async (payload: SubmitYieldPayload): Promise<ActualYieldRecord> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Get existing records
    const stored = localStorage.getItem(YIELD_STORAGE_KEY);
    const allRecords: ActualYieldRecord[] = stored ? JSON.parse(stored) : [];

    // Calculate accuracy if we have a prediction
    // For now, use mock predicted value (in real app, fetch from backend)
    const predictedYieldKgPerHa = 4500; // Mock value
    const accuracy = Math.abs(payload.actualYieldKgPerHa - predictedYieldKgPerHa) / payload.actualYieldKgPerHa * 100;

    // Create new record
    const newRecord: ActualYieldRecord = {
      id: `yield_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fieldId: payload.fieldId,
      harvestDate: payload.harvestDate,
      predictedYieldKgPerHa,
      actualYieldKgPerHa: payload.actualYieldKgPerHa,
      totalYieldKg: payload.totalYieldKg,
      accuracy,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    allRecords.push(newRecord);
    localStorage.setItem(YIELD_STORAGE_KEY, JSON.stringify(allRecords));

    return newRecord;
  } catch (error) {
    console.error('Failed to submit yield data:', error);
    throw normalizeApiError(error);
  }
};

/**
 * Delete a yield record
 * Currently uses localStorage - will be replaced with backend API
 */
export const deleteYieldRecord = async (recordId: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const stored = localStorage.getItem(YIELD_STORAGE_KEY);
    if (!stored) return;

    const allRecords: ActualYieldRecord[] = JSON.parse(stored);
    const filtered = allRecords.filter(r => r.id !== recordId);
    
    localStorage.setItem(YIELD_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete yield record:', error);
    throw normalizeApiError(error);
  }
};