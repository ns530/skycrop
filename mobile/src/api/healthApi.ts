import { apiClient } from './client';

export interface HealthAnalysis {
  id: number;
  field_id: number;
  analysis_date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  ndvi_std: number;
  health_score: number;
  health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  vegetation_cover_percentage: number;
  stress_areas_count: number;
  stress_areas_percentage: number;
  recommendations: string[];
  alerts: string[];
  satellite_image_url: string | null;
  ndvi_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthHistory {
  analysis_date: string;
  health_score: number;
  ndvi_mean: number;
  health_status: string;
}

export interface HealthSummary {
  current: HealthAnalysis;
  history: HealthHistory[];
  trends: {
    health_score_trend: 'improving' | 'stable' | 'declining';
    ndvi_trend: 'improving' | 'stable' | 'declining';
    change_percentage: number;
  };
}

/**
 * Get current health analysis for a field
 */
export const getFieldHealth = async (fieldId: number): Promise<HealthAnalysis> => {
  const response = await apiClient.get(`/fields/${fieldId}/health`);
  return response.data.data;
};

/**
 * Get health history for a field
 */
export const getFieldHealthHistory = async (
  fieldId: number,
  params?: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<HealthHistory[]> => {
  const response = await apiClient.get(`/fields/${fieldId}/health/history`, { params });
  return response.data.data;
};

/**
 * Get health summary (current + history + trends)
 */
export const getFieldHealthSummary = async (fieldId: number): Promise<HealthSummary> => {
  const response = await apiClient.get(`/fields/${fieldId}/health/summary`);
  return response.data.data;
};

/**
 * Trigger new health analysis for a field
 */
export const triggerHealthAnalysis = async (fieldId: number): Promise<{ message: string; job_id: string }> => {
  const response = await apiClient.post(`/fields/${fieldId}/health/analyze`);
  return response.data;
};

