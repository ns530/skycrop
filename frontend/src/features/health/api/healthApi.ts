import { httpClient, normalizeApiError } from '../../../shared/api';

export type HealthIndexType = 'NDVI' | 'NDWI' | 'TDVI';

export interface HealthIndexPoint {
  date: string; // ISO date string
  value: number;
}

export interface FieldHealthTimeSeries {
  fieldId: string;
  indexType: HealthIndexType;
  points: HealthIndexPoint[];
}

export type HealthSummaryLabel = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface HealthSummaryBucket {
  label: HealthSummaryLabel;
  /**
   * Percentage of field area that falls into this bucket (0–100).
   */
  percentageArea: number;
}

export interface FieldHealthResponse {
  summary: HealthSummaryBucket[];
  timeSeries: FieldHealthTimeSeries[];
  latestIndex?: number;
}

/**
 * Dictionary of available health indices and their metadata.
 * The exact shape of the metadata can evolve without breaking callers.
 */
export type HealthIndicesDictionary = Record<
  string,
  {
    label: string;
    description?: string;
    units?: string;
    rangeHint?: [number, number];
  }
>;

// --------------------
// Backend envelopes (internal)
// --------------------

interface BackendFieldHealthEnvelope {
  success: boolean;
  data: FieldHealthResponse;
}

interface BackendHealthIndicesEnvelope {
  success: boolean;
  data: HealthIndicesDictionary;
}

// --------------------
// Public API
// --------------------

/**
 * Get health summary and time series for a field within a date range.
 *
 * GET /api/v1/fields/{id}/health
 */
export const getFieldHealth = async (fieldId: string, params: {
  startDate: string;
  endDate: string;
  indexType?: HealthIndexType;
}): Promise<FieldHealthResponse> => {
  try {
    const res = await httpClient.get<BackendFieldHealthEnvelope>(`/fields/${fieldId}/health`, {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        indexType: params.indexType,
      },
    });

    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Get metadata for available health indices (definitions, units, etc.).
 *
 * GET /api/v1/health/indices
 */
export const getHealthIndicesMetadata = async (): Promise<HealthIndicesDictionary> => {
  try {
    const res = await httpClient.get<BackendHealthIndicesEnvelope>('/health/indices');
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};