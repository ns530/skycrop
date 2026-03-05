import { apiClient } from './client';

export interface YieldPrediction {
  id: number;
  field_id: number;
  prediction_date: string;
  crop_type: string;
  predicted_yield: number;
  predicted_yield_per_hectare: number;
  confidence_score: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  prediction_method: string;
  factors_considered: string[];
  harvest_date_estimate: string | null;
  quality_estimate: 'excellent' | 'good' | 'fair' | 'poor';
  risk_factors: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface YieldHistory {
  year: number;
  actual_yield: number;
  predicted_yield: number | null;
  crop_type: string;
}

export interface YieldSummary {
  current_prediction: YieldPrediction;
  history: YieldHistory[];
  trends: {
    yield_trend: 'improving' | 'stable' | 'declining';
    average_yield_last_3_years: number;
    change_percentage: number;
  };
}

/**
 * Get current yield prediction for a field
 */
export const getFieldYield = async (fieldId: string | number): Promise<YieldPrediction> => {
  const response = await apiClient.get(`/api/v1/fields/${fieldId}/yield`);
  return response.data.data || response.data;
};

/**
 * Get yield history for a field
 */
export const getFieldYieldHistory = async (
  fieldId: string | number,
  params?: {
    limit?: number;
    start_year?: number;
    end_year?: number;
  }
): Promise<YieldHistory[]> => {
  const response = await apiClient.get(`/api/v1/fields/${fieldId}/yield/history`, { params });
  return response.data.data || response.data;
};

/**
 * Get yield summary (current + history + trends)
 */
export const getFieldYieldSummary = async (fieldId: string | number): Promise<YieldSummary> => {
  const response = await apiClient.get(`/api/v1/fields/${fieldId}/yield/summary`);
  return response.data.data || response.data;
};

/**
 * Trigger new yield prediction for a field
 */
export const triggerYieldPrediction = async (
  fieldId: string | number
): Promise<{ message: string; job_id: string }> => {
  const response = await apiClient.post(`/api/v1/fields/${fieldId}/yield/predict`);
  return response.data.data || response.data;
};

/**
 * Record actual yield for a field
 */
export const recordActualYield = async (
  fieldId: string | number,
  data: {
    actual_yield: number;
    harvest_date: string;
    crop_type: string;
    notes?: string;
  }
): Promise<{ message: string }> => {
  const response = await apiClient.post(`/api/v1/fields/${fieldId}/yield/actual`, data);
  return response.data.data || response.data;
};

