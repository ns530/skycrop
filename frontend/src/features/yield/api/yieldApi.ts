import { httpClient, normalizeApiError } from "../../../shared/api";

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
export const getYieldForecast = async (
  request: YieldForecastRequest,
): Promise<YieldForecastResponse> => {
  try {
    const res = await httpClient.post<BackendYieldForecastEnvelope>(
      "/ml/yield/predict",
      request,
    );
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
  cropVariety?: string;
  season?: "maha" | "yala" | "other";
  createdAt: string; // ISO timestamp
  updatedAt?: string;
}

export interface SubmitYieldPayload {
  fieldId: string;
  harvestDate: string;
  actualYieldKgPerHa: number;
  totalYieldKg?: number;
  notes?: string;
  cropVariety?: string;
  season?: "maha" | "yala" | "other";
  predictionId?: string;
  predictedYieldKgPerHa?: number;
}

// Backend response types
interface BackendYieldRecord {
  yield_id: string;
  field_id: string;
  harvest_date: string;
  actual_yield_per_ha: number;
  total_yield_kg: number;
  predicted_yield_per_ha?: number;
  accuracy_mape?: number;
  notes?: string;
  crop_variety?: string;
  season?: "maha" | "yala" | "other";
  created_at: string;
  updated_at: string;
}

interface BackendYieldListEnvelope {
  success: boolean;
  data: BackendYieldRecord[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  meta?: Record<string, unknown>;
}

interface BackendYieldEnvelope {
  success: boolean;
  data: BackendYieldRecord;
  meta?: Record<string, unknown>;
}

// Transform backend yield record to frontend format
const transformYieldRecord = (
  record: BackendYieldRecord,
): ActualYieldRecord => ({
  id: record.yield_id,
  fieldId: record.field_id,
  harvestDate: record.harvest_date,
  predictedYieldKgPerHa: record.predicted_yield_per_ha,
  actualYieldKgPerHa: record.actual_yield_per_ha,
  totalYieldKg: record.total_yield_kg,
  accuracy: record.accuracy_mape,
  notes: record.notes,
  cropVariety: record.crop_variety,
  season: record.season,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

/**
 * Get yield history for a field (mocked for now - would need backend endpoint)
 */
export const getYieldHistory = async (
  fieldId: string,
): Promise<YieldPrediction[]> => {
  // Mock data - in real implementation, this would call a backend endpoint
  const mockHistory: YieldPrediction[] = [
    {
      field_id: fieldId,
      yield_kg_per_ha: 4500,
      confidence_lower: 4200,
      confidence_upper: 4800,
    },
    {
      field_id: fieldId,
      yield_kg_per_ha: 4800,
      confidence_lower: 4500,
      confidence_upper: 5100,
    },
    {
      field_id: fieldId,
      yield_kg_per_ha: 4600,
      confidence_lower: 4300,
      confidence_upper: 4900,
    },
    {
      field_id: fieldId,
      yield_kg_per_ha: 4900,
      confidence_lower: 4600,
      confidence_upper: 5200,
    },
    {
      field_id: fieldId,
      yield_kg_per_ha: 4700,
      confidence_lower: 4400,
      confidence_upper: 5000,
    },
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockHistory;
};

/**
 * Get actual yield records for a field
 * GET /api/v1/fields/:fieldId/yield
 */
export const getActualYieldRecords = async (
  fieldId: string,
): Promise<ActualYieldRecord[]> => {
  try {
    const res = await httpClient.get<BackendYieldListEnvelope>(
      `/fields/${fieldId}/yield`,
      {
        params: {
          page: 1,
          page_size: 100, // Get all records (up to 100)
          sort: "harvest_date",
          order: "desc",
        },
      },
    );

    return res.data.data.map(transformYieldRecord);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Submit actual yield data
 * POST /api/v1/fields/:fieldId/yield
 *
 * @param payload - Yield data to submit
 * @returns Created yield record
 */
export const submitActualYield = async (
  payload: SubmitYieldPayload,
): Promise<ActualYieldRecord> => {
  try {
    const requestBody = {
      actual_yield_per_ha: payload.actualYieldKgPerHa,
      total_yield_kg: payload.totalYieldKg || 0,
      harvest_date: payload.harvestDate,
      notes: payload.notes,
      crop_variety: payload.cropVariety,
      season: payload.season,
      prediction_id: payload.predictionId,
      predicted_yield_per_ha: payload.predictedYieldKgPerHa,
    };

    const res = await httpClient.post<BackendYieldEnvelope>(
      `/fields/${payload.fieldId}/yield`,
      requestBody,
    );

    return transformYieldRecord(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Delete a yield record
 * DELETE /api/v1/yield/:yieldId
 */
export const deleteYieldRecord = async (recordId: string): Promise<void> => {
  try {
    await httpClient.delete(`/yield/${recordId}`);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Update a yield record
 * PATCH /api/v1/yield/:yieldId
 */
export const updateYieldRecord = async (
  recordId: string,
  updates: Partial<SubmitYieldPayload>,
): Promise<ActualYieldRecord> => {
  try {
    const requestBody: Record<string, unknown> = {};

    if (updates.actualYieldKgPerHa !== undefined) {
      requestBody.actual_yield_per_ha = updates.actualYieldKgPerHa;
    }
    if (updates.totalYieldKg !== undefined) {
      requestBody.total_yield_kg = updates.totalYieldKg;
    }
    if (updates.harvestDate !== undefined) {
      requestBody.harvest_date = updates.harvestDate;
    }
    if (updates.notes !== undefined) {
      requestBody.notes = updates.notes;
    }
    if (updates.cropVariety !== undefined) {
      requestBody.crop_variety = updates.cropVariety;
    }
    if (updates.season !== undefined) {
      requestBody.season = updates.season;
    }
    if (updates.predictedYieldKgPerHa !== undefined) {
      requestBody.predicted_yield_per_ha = updates.predictedYieldKgPerHa;
    }

    const res = await httpClient.patch<BackendYieldEnvelope>(
      `/yield/${recordId}`,
      requestBody,
    );

    return transformYieldRecord(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Get yield statistics for a field
 * GET /api/v1/fields/:fieldId/yield/statistics
 */
export interface YieldStatistics {
  totalEntries: number;
  avgYieldPerHa: number;
  minYieldPerHa: number;
  maxYieldPerHa: number;
  avgAccuracyMape: number;
  firstHarvest?: string;
  latestHarvest?: string;
}

interface BackendYieldStatistics {
  total_entries: number;
  avg_yield_per_ha: string;
  min_yield_per_ha: string;
  max_yield_per_ha: string;
  avg_accuracy_mape: string;
  first_harvest?: string;
  latest_harvest?: string;
}

interface BackendYieldStatisticsEnvelope {
  success: boolean;
  data: BackendYieldStatistics;
  meta?: Record<string, unknown>;
}

export const getYieldStatistics = async (
  fieldId: string,
): Promise<YieldStatistics> => {
  try {
    const res = await httpClient.get<BackendYieldStatisticsEnvelope>(
      `/fields/${fieldId}/yield/statistics`,
    );

    const data = res.data.data;

    return {
      totalEntries: data.total_entries,
      avgYieldPerHa: parseFloat(data.avg_yield_per_ha),
      minYieldPerHa: parseFloat(data.min_yield_per_ha),
      maxYieldPerHa: parseFloat(data.max_yield_per_ha),
      avgAccuracyMape: parseFloat(data.avg_accuracy_mape),
      firstHarvest: data.first_harvest,
      latestHarvest: data.latest_harvest,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
};
