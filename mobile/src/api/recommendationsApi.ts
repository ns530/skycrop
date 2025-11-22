import { apiClient } from './client';

export interface Recommendation {
  id: number;
  field_id: number;
  recommendation_date: string;
  category: 'irrigation' | 'fertilization' | 'pest_control' | 'harvest' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  reasoning: string;
  expected_impact: string;
  estimated_cost: number | null;
  implementation_timeframe: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  confidence_score: number;
  data_sources: string[];
  created_at: string;
  updated_at: string;
}

export interface RecommendationSummary {
  total_count: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
}

/**
 * Get all recommendations for a field
 */
export const getFieldRecommendations = async (
  fieldId: number,
  params?: {
    category?: string;
    priority?: string;
    status?: string;
    limit?: number;
  }
): Promise<Recommendation[]> => {
  const response = await apiClient.get(`/fields/${fieldId}/recommendations`, { params });
  return response.data.data;
};

/**
 * Get a specific recommendation by ID
 */
export const getRecommendationById = async (
  fieldId: number,
  recommendationId: number
): Promise<Recommendation> => {
  const response = await apiClient.get(`/fields/${fieldId}/recommendations/${recommendationId}`);
  return response.data.data;
};

/**
 * Get recommendations summary
 */
export const getRecommendationsSummary = async (fieldId: number): Promise<RecommendationSummary> => {
  const response = await apiClient.get(`/fields/${fieldId}/recommendations/summary`);
  return response.data.data;
};

/**
 * Update recommendation status
 */
export const updateRecommendationStatus = async (
  fieldId: number,
  recommendationId: number,
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
): Promise<Recommendation> => {
  const response = await apiClient.patch(`/fields/${fieldId}/recommendations/${recommendationId}`, { status });
  return response.data.data;
};

/**
 * Trigger new recommendations generation for a field
 */
export const generateRecommendations = async (
  fieldId: number
): Promise<{ message: string; job_id: string }> => {
  const response = await apiClient.post(`/fields/${fieldId}/recommendations/generate`);
  return response.data;
};

