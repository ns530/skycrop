import { httpClient, normalizeApiError } from "../../../shared/api";

export interface DashboardFieldMetrics {
  total: number;
  active: number;
  total_area_hectares: number;
  average_size_hectares: number;
}

export interface DashboardHealthMetrics {
  average_score: number;
  status_distribution: {
    good: number;
    moderate: number;
    poor: number;
  };
  total_assessed: number;
}

export interface DashboardAlertMetrics {
  total: number;
  by_severity: {
    high: number;
    medium: number;
    low: number;
  };
  by_type: {
    water: number;
    fertilizer: number;
  };
}

export interface DashboardActivityItem {
  type: "health_assessment" | "recommendation";
  date: string;
  field_name: string;
  details: {
    status?: string;
    score?: number;
    type?: string;
    severity?: string;
  };
}

export interface DashboardFieldThumbnail {
  field_id: string;
  field_name: string;
  thumbnail_url: string | null;
  area_hectares: number;
}

export interface DashboardVegetationIndices {
  ndvi: number | null;
  ndwi: number | null;
  tdvi: number | null;
  total_records: number;
}

export interface DashboardSystemMetrics {
  uptime_hours: number;
  api_performance: {
    avg_response_time_ms: number | null;
  };
}

export interface DashboardWeatherForecast {
  forecast: Array<{
    date: string;
    rain_mm: number;
    tmin: number;
    tmax: number;
    wind: number;
  }>;
  totals: {
    rain_3d_mm: number;
    rain_7d_mm: number;
  };
  available: boolean;
}

export interface DashboardUserAnalytics {
  total_fields: number;
  total_assessments: number;
  avg_health_score: number | null;
  last_activity: string | null;
  active_users_today: number;
  session_duration_avg: number;
}

export interface DashboardDisasterAssessment {
  assessments: Array<{
    field_id: string;
    field_name: string;
    risk_level: string;
    disaster_types: string[];
    confidence: number;
    assessed_at: string;
  }>;
  available: boolean;
  high_risk_count: number;
}

export interface DashboardMetrics {
  fields: DashboardFieldMetrics;
  health: DashboardHealthMetrics;
  alerts: DashboardAlertMetrics;
  recent_activity: DashboardActivityItem[];
  field_thumbnails: DashboardFieldThumbnail[];
  vegetation_indices: DashboardVegetationIndices;
  system: DashboardSystemMetrics;
  weather_forecast: DashboardWeatherForecast;
  user_analytics: DashboardUserAnalytics;
  disaster_assessment: DashboardDisasterAssessment;
  generated_at: string;
}

// --------------------
// Backend envelope types (internal)
// --------------------

interface BackendDashboardMetricsResponse {
  success: boolean;
  data: DashboardMetrics;
  meta?: {
    correlation_id?: string;
    cache_hit?: boolean;
    latency_ms?: number;
  };
}

// --------------------
// Public API
// --------------------

/**
 * Get dashboard metrics for the current user.
 *
 * GET /api/v1/dashboard/metrics
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const res =
      await httpClient.get<BackendDashboardMetricsResponse>(
        "/dashboard/metrics",
      );
    return res.data.data;
  } catch (error) {
    // Log error details in development for debugging
    if (import.meta.env.DEV) {
      console.error("[Dashboard API] Failed to fetch metrics:", error);
    }
    throw normalizeApiError(error);
  }
};
