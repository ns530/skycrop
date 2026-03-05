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
function calculateVegetationCover(ndvi: number | undefined): number {
  if (ndvi === undefined || ndvi === null || ndvi < 0) return 0;
  // Simple linear mapping: NDVI 0-1 maps to 0-100%
  // Typical healthy vegetation: NDVI > 0.3
  return Math.min(100, Math.max(0, (ndvi + 1) * 50));
}

export interface HealthAnalysis {
  id: number;
  field_id: number;
  analysis_date: string;
  ndvi_mean: number | undefined; // Can be undefined if no data available
  ndvi_min: number | undefined;
  ndvi_max: number | undefined;
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
    if (__DEV__) {
      console.log('[HealthAPI] Fetching health summary for field:', fieldId, 'type:', typeof fieldId);
    }
    
    // Try to get detailed health data from /health endpoint first (new snapshots endpoint)
    let detailedHealth = null;
    let healthHistory: HealthHistory[] = [];
    try {
      const healthUrl = `/api/v1/fields/${fieldId}/health`;
      if (__DEV__) {
        console.log('[HealthAPI] Requesting health snapshots from:', healthUrl);
      }
      
      const healthResponse = await apiClient.get(healthUrl, {
        params: { page: 1, pageSize: 10 }, // Get latest records for history
      });
      
      // The /health endpoint returns { success: true, data: items[], pagination: {...} }
      // where items are snapshots with: { id, field_id, timestamp, ndvi, ndwi, tdvi, ... }
      const healthData = healthResponse.data?.data;
      
      if (__DEV__) {
        console.log('[HealthAPI] Health snapshots response:', JSON.stringify(healthResponse.data, null, 2));
      }
      
      if (Array.isArray(healthData) && healthData.length > 0) {
        // Get the latest snapshot (first item, sorted by timestamp DESC)
        const latestSnapshot = healthData[0];
        
        // Extract values from snapshot (snapshots have ndvi, ndwi, tdvi as single values)
        if (latestSnapshot.ndvi !== null && latestSnapshot.ndvi !== undefined) {
          detailedHealth = {
            ndvi: Number(latestSnapshot.ndvi),
            ndwi: latestSnapshot.ndwi !== null && latestSnapshot.ndwi !== undefined ? Number(latestSnapshot.ndwi) : undefined,
            tdvi: latestSnapshot.tdvi !== null && latestSnapshot.tdvi !== undefined ? Number(latestSnapshot.tdvi) : undefined,
            timestamp: latestSnapshot.timestamp || latestSnapshot.createdat,
          };
        }
        
        // Build history from snapshots
        healthHistory = healthData
          .filter((record: any) => record.ndvi !== null && record.ndvi !== undefined)
          .slice(0, 10)
          .map((record: any) => ({
            analysis_date: record.timestamp || record.createdat || new Date().toISOString(),
            health_score: calculateHealthScoreFromIndices(
              Number(record.ndvi),
              record.ndwi !== null && record.ndwi !== undefined ? Number(record.ndwi) : undefined,
              record.tdvi !== null && record.tdvi !== undefined ? Number(record.tdvi) : undefined
            ),
            ndvi_mean: Number(record.ndvi),
            health_status: getStatusFromScore(
              calculateHealthScoreFromIndices(
                Number(record.ndvi),
                record.ndwi !== null && record.ndwi !== undefined ? Number(record.ndwi) : undefined,
                record.tdvi !== null && record.tdvi !== undefined ? Number(record.tdvi) : undefined
              )
            ),
          }));
      }
    } catch (err: any) {
      // If /health endpoint fails, continue with summary endpoint
      if (__DEV__) {
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.message || 'Unknown error';
        if (status === 401) {
          console.error('[HealthAPI] 401 Unauthorized when fetching health snapshots. Token may be invalid or expired.');
          console.error('[HealthAPI] Error details:', message);
        } else {
          console.warn('[HealthAPI] Could not fetch detailed health data:', message);
        }
      }
    }

    // Get summary from /health/summary endpoint
    const summaryUrl = `/api/v1/fields/${fieldId}/health/summary`;
    if (__DEV__) {
      console.log('[HealthAPI] Requesting health summary from:', summaryUrl);
    }
    
    const summaryResponse = await apiClient.get(summaryUrl);
    
    // Debug logging in development
    if (__DEV__) {
      console.log('[HealthAPI] Health summary response:', JSON.stringify(summaryResponse.data, null, 2));
      if (detailedHealth) {
        console.log('[HealthAPI] Detailed health data from snapshots:', JSON.stringify(detailedHealth, null, 2));
      }
    }
    
    const summaryData = summaryResponse.data.data || summaryResponse.data;
    
    // Transform the response to match expected format
    // Extract NDVI/NDWI/TDVI from signals array (from summary endpoint)
    const signals = summaryData.signals || [];
    const ndviSignal = signals.find((s: any) => s.key === 'ndvimean');
    const ndwiSignal = signals.find((s: any) => s.key === 'ndwimean');
    const tdviSignal = signals.find((s: any) => s.key === 'tdvimean');
    
    // Use detailed health data from snapshots if available, otherwise use signals from summary
    // Priority: snapshot data > signals from summary > undefined (no data)
    // Don't default to 0 - use undefined to indicate missing data
    const ndviValue = detailedHealth?.ndvi ?? (ndviSignal?.value !== undefined && ndviSignal.value !== null ? Number(ndviSignal.value) : undefined);
    const ndwiValue = detailedHealth?.ndwi ?? (ndwiSignal?.value !== undefined && ndwiSignal.value !== null ? Number(ndwiSignal.value) : undefined);
    const tdviValue = detailedHealth?.tdvi ?? (tdviSignal?.value !== undefined && tdviSignal.value !== null ? Number(tdviSignal.value) : undefined);
    
    const current: HealthAnalysis = {
      id: summaryData.id || 0,
      field_id: typeof fieldId === 'string' ? 0 : (Number(fieldId) || 0), // Keep as number for interface, but don't convert UUID strings
      analysis_date: detailedHealth?.timestamp || summaryData.updatedAt || new Date().toISOString(),
      ndvi_mean: ndviValue, // Keep undefined if no data
      ndvi_min: ndviValue, // Snapshots only have single values, use mean for min/max
      ndvi_max: ndviValue,
      ndvi_std: 0,
      ndwi_mean: ndwiValue,
      ndwi_min: ndwiValue,
      ndwi_max: ndwiValue,
      ndwi_std: ndwiValue !== undefined ? 0 : 0, // Keep as number for consistency
      tdvi_mean: tdviValue,
      health_score: summaryData.score || (ndviValue !== undefined && ndviValue !== null ? calculateHealthScoreFromIndices(ndviValue, ndwiValue, tdviValue) : 50),
      health_status: mapStatusToHealthStatus(summaryData.status) || (ndviValue !== undefined && ndviValue !== null ? getStatusFromScore(calculateHealthScoreFromIndices(ndviValue, ndwiValue, tdviValue)) : 'fair'),
      vegetation_cover_percentage: calculateVegetationCover(ndviValue),
      stress_areas_count: 0,
      stress_areas_percentage: 0,
      recommendations: summaryData.advice || [],
      alerts: [],
      satellite_image_url: null,
      ndvi_image_url: null,
      created_at: detailedHealth?.timestamp || summaryData.updatedAt || new Date().toISOString(),
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
      console.log('[HealthAPI] Final current health data:', {
        ndvi_mean: current.ndvi_mean,
        ndwi_mean: current.ndwi_mean,
        tdvi_mean: current.tdvi_mean,
        health_score: current.health_score,
      });
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
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message || 'Unknown error';
    
    if (__DEV__) {
      if (status === 401) {
        console.error('[HealthAPI] 401 Unauthorized when fetching health summary. Token may be invalid or expired.');
        console.error('[HealthAPI] Field ID:', fieldId);
        console.error('[HealthAPI] Error details:', message);
      } else {
        console.error('[HealthAPI] Error fetching health summary:', message);
        console.error('[HealthAPI] Status:', status);
        console.error('[HealthAPI] Error response:', error.response?.data);
      }
    }
    
    throw error;
  }
};


/**
 * Trigger new health analysis for a field
 * Uses the /health/compute endpoint which computes indices for today's date
 */
export const triggerHealthAnalysis = async (fieldId: string | number): Promise<{ message: string; job_id?: string }> => {
  try {
    // Use /health/compute endpoint with today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (__DEV__) {
      console.log('[HealthAPI] Triggering health analysis for field:', fieldId, 'date:', today);
    }
    
    const response = await apiClient.post(`/api/v1/fields/${fieldId}/health/compute`, {
      date: today,
      recompute: false, // Don't recompute if snapshot already exists
    });
    
    if (__DEV__) {
      console.log('[HealthAPI] Health analysis triggered successfully:', response.data);
    }
    
    return response.data.data || response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const responseData = error?.response?.data;
    const errorCode = responseData?.error?.code || responseData?.code;
    const errorMessage = responseData?.error?.message || responseData?.message || error?.message || 'Unknown error';
    
    if (__DEV__) {
      if (status === 401) {
        // Check if it's a SentinelHub error vs user auth error
        if (errorCode === 'INTERNAL_ERROR' || errorMessage.includes('SentinelHub')) {
          console.error('[HealthAPI] SentinelHub service error - backend cannot connect to SentinelHub');
          console.error('[HealthAPI] This is a backend configuration issue, not a user auth issue');
          console.error('[HealthAPI] Field ID:', fieldId);
          console.error('[HealthAPI] Error details:', errorMessage);
        } else {
          console.error('[HealthAPI] 401 Unauthorized when triggering health analysis. Token may be invalid or expired.');
          console.error('[HealthAPI] Field ID:', fieldId);
          console.error('[HealthAPI] Error details:', errorMessage);
        }
      } else {
        console.error('[HealthAPI] Error triggering health analysis:', errorMessage);
        console.error('[HealthAPI] Status:', status);
        console.error('[HealthAPI] Error code:', errorCode);
        console.error('[HealthAPI] Error response:', responseData);
      }
    }
    
    // Transform SentinelHub errors to be more user-friendly
    if (errorCode === 'INTERNAL_ERROR' && errorMessage.includes('SentinelHub')) {
      const friendlyError = new Error(
        'Satellite data service is currently unavailable. This is a backend configuration issue. ' +
        'Please contact support or try again later. The backend needs valid SentinelHub API credentials configured.'
      );
      (friendlyError as any).response = error.response;
      (friendlyError as any).isSentinelHubError = true;
      throw friendlyError;
    }
    
    throw error;
  }
};

