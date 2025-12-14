import { apiClient } from './client';

/**
 * Calculate health score from NDVI, NDWI, TDVI indices
 */
function calculateHealthScoreFromIndices(ndvi?: number, ndwi?: number, tdvi?: number): number {
  if (!ndvi && ndvi !== 0) return 50; // Default score
  
  // Base score from NDVI (0-100)
  let score = Math.max(0, Math.min(100, (ndvi + 1) * 50));
  
  // Adjustments from NDWI and TDVI if available
  if (ndwi !== undefined && ndwi !== null) {
    const waterAdj = (ndwi - 0.2) * 20;
    score += Math.max(-8, Math.min(6, waterAdj));
  }
  
  if (tdvi !== undefined && tdvi !== null) {
    // Higher TDVI indicates stress, reduce score
    if (tdvi > 0.5) {
      score -= Math.min(10, (tdvi - 0.5) * 20);
    }
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get health status from score
 */
function getStatusFromScore(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'poor';
  return 'critical';
}

/**
 * Map backend status to mobile app health status
 */
function mapStatusToHealthStatus(status: string): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  const statusMap: Record<string, 'excellent' | 'good' | 'fair' | 'poor' | 'critical'> = {
    good: 'good',
    moderate: 'fair',
    poor: 'poor',
    excellent: 'excellent',
    critical: 'critical',
  };
  return statusMap[status?.toLowerCase()] || 'fair';
}

/**
 * Calculate vegetation cover percentage from NDVI
 */
function calculateVegetationCover(ndvi: number): number {
  if (!ndvi || ndvi < 0) return 0;
  // Simple linear mapping: NDVI 0-1 maps to 0-100%
  // Typical healthy vegetation: NDVI > 0.3
  return Math.min(100, Math.max(0, (ndvi + 1) * 50));
}

export interface HealthAnalysis {
  id: number;
  field_id: number;
  analysis_date: string;
  ndvi_mean: number;
  ndvi_min: number;
  ndvi_max: number;
  ndvi_std: number;
  ndwi_mean?: number; // NDWI (Normalized Difference Water Index)
  ndwi_min?: number;
  ndwi_max?: number;
  ndwi_std?: number;
  tdvi_mean?: number; // TDVI (Transformed Difference Vegetation Index)
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
export const getFieldHealth = async (fieldId: string | number): Promise<HealthAnalysis> => {
  const response = await apiClient.get(`/api/v1/fields/${fieldId}/health`);
  return response.data.data || response.data;
};

/**
 * Get health history for a field
 */
export const getFieldHealthHistory = async (
  fieldId: string | number,
  params?: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<HealthHistory[]> => {
  const response = await apiClient.get(`/api/v1/fields/${fieldId}/health/history`, { params });
  return response.data.data || response.data;
};

/**
 * Get health summary (current + history + trends)
 * Transforms the backend response to match expected format
 */
export const getFieldHealthSummary = async (fieldId: string | number): Promise<HealthSummary> => {
  try {
    // Try to get detailed health data from /health endpoint first
    let detailedHealth = null;
    let healthHistory: HealthHistory[] = [];
    try {
      const healthResponse = await apiClient.get(`/api/v1/fields/${fieldId}/health`, {
        params: { page: 1, pageSize: 10 }, // Get latest records for history
      });
      const healthData = healthResponse.data.data || healthResponse.data;
      if (Array.isArray(healthData) && healthData.length > 0) {
        detailedHealth = healthData[0]; // Latest record
        // Build history from records
        healthHistory = healthData.slice(0, 10).map((record: any) => ({
          analysis_date: record.timestamp || record.measurementdate || new Date().toISOString(),
          health_score: calculateHealthScoreFromIndices(record.ndvi, record.ndwi, record.tdvi),
          ndvi_mean: record.ndvi || 0,
          health_status: getStatusFromScore(calculateHealthScoreFromIndices(record.ndvi, record.ndwi, record.tdvi)),
        }));
      } else if (healthData && !Array.isArray(healthData)) {
        detailedHealth = healthData;
      }
    } catch (err) {
      // If /health endpoint fails, continue with summary endpoint
      if (__DEV__) {
        console.warn('[HealthAPI] Could not fetch detailed health data:', err);
      }
    }

    // Get summary from /health/summary endpoint
    const summaryResponse = await apiClient.get(`/api/v1/fields/${fieldId}/health/summary`);
    
    // Debug logging in development
    if (__DEV__) {
      console.log('[HealthAPI] Health summary response:', JSON.stringify(summaryResponse.data, null, 2));
      if (detailedHealth) {
        console.log('[HealthAPI] Detailed health data:', JSON.stringify(detailedHealth, null, 2));
      }
    }
    
    const summaryData = summaryResponse.data.data || summaryResponse.data;
    
    // Transform the response to match expected format
    // Extract NDVI/NDWI/TDVI from signals array
    const signals = summaryData.signals || [];
    const ndviSignal = signals.find((s: any) => s.key === 'ndvimean');
    const ndwiSignal = signals.find((s: any) => s.key === 'ndwimean');
    const tdviSignal = signals.find((s: any) => s.key === 'tdvimean');
    
    // Use detailed health data if available, otherwise use signals
    const current: HealthAnalysis = {
      id: summaryData.id || 0,
      field_id: Number(fieldId) || 0,
      analysis_date: summaryData.updatedAt || new Date().toISOString(),
      ndvi_mean: detailedHealth?.ndvi || ndviSignal?.value || 0,
      ndvi_min: detailedHealth?.ndvi || ndviSignal?.value || 0,
      ndvi_max: detailedHealth?.ndvi || ndviSignal?.value || 0,
      ndvi_std: 0,
      ndwi_mean: detailedHealth?.ndwi || ndwiSignal?.value,
      ndwi_min: detailedHealth?.ndwi || ndwiSignal?.value,
      ndwi_max: detailedHealth?.ndwi || ndwiSignal?.value,
      ndwi_std: 0,
      tdvi_mean: detailedHealth?.tdvi || tdviSignal?.value,
      health_score: summaryData.score || 50,
      health_status: mapStatusToHealthStatus(summaryData.status),
      vegetation_cover_percentage: calculateVegetationCover(detailedHealth?.ndvi || ndviSignal?.value || 0),
      stress_areas_count: 0,
      stress_areas_percentage: 0,
      recommendations: summaryData.advice || [],
      alerts: [],
      satellite_image_url: null,
      ndvi_image_url: null,
      created_at: summaryData.updatedAt || new Date().toISOString(),
      updated_at: summaryData.updatedAt || new Date().toISOString(),
    };

    // Log if NDWI/TDVI are missing
    if (__DEV__) {
      if (current.ndwi_mean === undefined || current.ndwi_mean === null) {
        console.warn('[HealthAPI] NDWI data missing in response');
      }
      if (current.tdvi_mean === undefined || current.tdvi_mean === null) {
        console.warn('[HealthAPI] TDVI data missing in response');
      }
    }

    // Calculate trends from history if available
    let healthScoreTrend: 'improving' | 'stable' | 'declining' = 'stable';
    let ndviTrend: 'improving' | 'stable' | 'declining' = 'stable';
    let changePercentage = 0;
    
    if (healthHistory.length >= 2) {
      const latest = healthHistory[0];
      const previous = healthHistory[1];
      const scoreDiff = latest.health_score - previous.health_score;
      const ndviDiff = latest.ndvi_mean - previous.ndvi_mean;
      
      changePercentage = scoreDiff;
      healthScoreTrend = scoreDiff > 2 ? 'improving' : scoreDiff < -2 ? 'declining' : 'stable';
      ndviTrend = ndviDiff > 0.01 ? 'improving' : ndviDiff < -0.01 ? 'declining' : 'stable';
    }

    // Return transformed data
    return {
      current,
      history: healthHistory,
      trends: {
        health_score_trend: healthScoreTrend,
        ndvi_trend: ndviTrend,
        change_percentage: changePercentage,
      },
    };
  } catch (error: any) {
    console.error('[HealthAPI] Error fetching health summary:', error);
    console.error('[HealthAPI] Error response:', error.response?.data);
    throw error;
  }
};


/**
 * Trigger new health analysis for a field
 */
export const triggerHealthAnalysis = async (fieldId: string | number): Promise<{ message: string; job_id: string }> => {
  const response = await apiClient.post(`/api/v1/fields/${fieldId}/health/analyze`);
  return response.data.data || response.data;
};

