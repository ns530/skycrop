import { httpClient, normalizeApiError } from "../../../shared/api";
import { getFieldHealth } from "../../health/api/healthApi";
import { getWeatherForecast } from "../../weather/api/weatherApi";
import { getYieldForecast } from "../../yield/api/yieldApi";

import {
  generateAIRecommendations,
  type FieldAnalysisInput,
} from "./aiRecommendationEngine";

export type RecommendationStatus = "planned" | "applied" | "overdue";
export type RecommendationPriority = "low" | "medium" | "high";

export interface Recommendation {
  id: string;
  fieldId: string;
  title: string;
  description: string;
  status: RecommendationStatus;
  priority: RecommendationPriority;
  recommendedAt: string;
  applyBefore?: string;
  appliedAt?: string;
  weatherHint?: string;
}

// --------------------
// Backend shapes (internal)
// --------------------

type BackendRecommendationSeverity = "low" | "medium" | "high" | string;

interface BackendRecommendation {
  id: string;
  field_id: string;
  timestamp: string;
  type: string;
  severity: BackendRecommendationSeverity;
  reason: string;
  details?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

interface BackendRecommendationListResponse {
  success: boolean;
  data: BackendRecommendation[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: Record<string, unknown>;
}

interface BackendRecommendationSingleResponse {
  success: boolean;
  data: BackendRecommendation;
}

// --------------------
// Mappers
// --------------------

const mapSeverityToPriority = (
  severity: BackendRecommendationSeverity,
): RecommendationPriority => {
  if (severity === "low") return "low";
  if (severity === "high") return "high";
  return "medium";
};

const deriveStatus = (backend: BackendRecommendation): RecommendationStatus => {
  const details = backend.details as
    | { applied_at?: string | null; apply_before?: string | null }
    | null
    | undefined;

  const appliedAt = details?.applied_at ?? null;
  const applyBefore = details?.apply_before ?? null;

  if (appliedAt) {
    return "applied";
  }

  if (applyBefore) {
    const now = Date.now();
    const deadline = Number.isNaN(Date.parse(applyBefore))
      ? null
      : Date.parse(applyBefore);
    if (deadline !== null && deadline < now) {
      return "overdue";
    }
  }

  return "planned";
};

const mapBackendToRecommendation = (
  backend: BackendRecommendation,
): Recommendation => {
  const details = backend.details as {
    title?: string;
    description?: string;
    apply_before?: string;
    applied_at?: string;
    weather_hint?: string;
  } | null;

  return {
    id: backend.id,
    fieldId: backend.field_id,
    title:
      details?.title ?? backend.reason ?? `Recommendation for ${backend.type}`,
    description: details?.description ?? backend.reason ?? "",
    status: deriveStatus(backend),
    priority: mapSeverityToPriority(backend.severity),
    recommendedAt: backend.timestamp,
    applyBefore: details?.apply_before,
    appliedAt: details?.applied_at,
    weatherHint: details?.weather_hint,
  };
};

// --------------------
// Public API
// --------------------

/**
 * List recommendations for a field.
 *
 * GET /api/v1/fields/{fieldId}/recommendations
 *
 * Falls back to AI-generated recommendations if backend unavailable
 */
export const getRecommendationsForField = async (
  fieldId: string,
): Promise<Recommendation[]> => {
  try {
    // Try fetching from backend first
    const res = await httpClient.get<BackendRecommendationListResponse>(
      `/fields/${fieldId}/recommendations`,
    );
    const backendRecs = (res.data.data ?? []).map(mapBackendToRecommendation);

    // If backend returns recommendations, use those
    if (backendRecs.length > 0) {
      return backendRecs;
    }

    // Otherwise, generate AI recommendations as fallback
    return await generateAIRecommendationsForField(fieldId);
  } catch (error) {
    // If backend fails, try AI generation as fallback
    console.log("Backend recommendations failed, using AI generation:", error);
    try {
      return await generateAIRecommendationsForField(fieldId);
    } catch (aiError) {
      console.error("AI recommendation generation failed:", aiError);
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }
};

/**
 * Generate AI recommendations for a field by analyzing its data
 *
 * @internal
 */
async function generateAIRecommendationsForField(
  fieldId: string,
): Promise<Recommendation[]> {
  try {
    // Fetch field data in parallel
    const [healthData, weatherData, yieldData] = await Promise.allSettled([
      fetchHealthDataForAI(fieldId),
      fetchWeatherDataForAI(fieldId),
      fetchYieldDataForAI(fieldId),
    ]);

    // Build analysis input
    const analysisInput: FieldAnalysisInput = {
      fieldId,
      fieldName: "Field", // Will be enriched by field detail
      areaHa: 1.0,
      healthData:
        healthData.status === "fulfilled" ? healthData.value : undefined,
      weatherData:
        weatherData.status === "fulfilled" ? weatherData.value : undefined,
      yieldData: yieldData.status === "fulfilled" ? yieldData.value : undefined,
      growthStage: estimateGrowthStage(),
      lastIrrigationDays: Math.floor(Math.random() * 10), // Mock
      lastFertilizerDays: Math.floor(Math.random() * 20), // Mock
    };

    // Generate recommendations using AI engine
    return generateAIRecommendations(analysisInput);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return [];
  }
}

/**
 * Fetch health data formatted for AI analysis
 */
async function fetchHealthDataForAI(fieldId: string) {
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const health = await getFieldHealth(fieldId, {
      startDate,
      endDate,
      indexType: "NDVI",
    });

    // Extract latest values
    const latestNDVI = health.latestIndex ?? 0.5;
    const timeSeries =
      health.timeSeries.find((ts) => ts.indexType === "NDVI")?.points || [];

    // Determine trend
    let trend: "improving" | "stable" | "declining" = "stable";
    if (timeSeries.length >= 2) {
      const recent = timeSeries[timeSeries.length - 1].value;
      const older = timeSeries[timeSeries.length - 2].value;
      if (recent > older + 0.05) trend = "improving";
      else if (recent < older - 0.05) trend = "declining";
    }

    // Map health status
    let healthStatus: "excellent" | "good" | "fair" | "poor" = "good";
    if (latestNDVI > 0.7) healthStatus = "excellent";
    else if (latestNDVI > 0.5) healthStatus = "good";
    else if (latestNDVI > 0.3) healthStatus = "fair";
    else healthStatus = "poor";

    return {
      ndvi: latestNDVI,
      healthStatus,
      trend,
      timeSeries,
    };
  } catch (error) {
    console.warn("Failed to fetch health data for AI:", error);
    return undefined;
  }
}

/**
 * Fetch weather data formatted for AI analysis
 */
async function fetchWeatherDataForAI(fieldId: string) {
  try {
    // Use mock coordinates (Polonnaruwa district center)
    const weather = await getWeatherForecast(7.9403, 81.0188);

    // Extract relevant weather info from daily forecasts
    const daily = weather.daily.slice(0, 7); // Last 7 days

    // Calculate rainfall (sum from forecast)
    const rainfall = daily.reduce(
      (sum: number, day) => sum + (day.precipMm || 0),
      0,
    );

    // Get average temperature
    const avgTemp =
      daily.length > 0
        ? daily.reduce(
            (sum: number, day) => sum + (day.minTempC + day.maxTempC) / 2,
            0,
          ) / daily.length
        : 30;

    // Detect heavy rain forecast
    const heavyRainForecast = daily.some(
      (day) =>
        day.condition?.toLowerCase().includes("rain") ||
        (day.precipMm && day.precipMm > 20),
    );

    return {
      temperature: avgTemp,
      rainfall,
      humidity: 75, // Estimated (not in current API)
      forecast: heavyRainForecast
        ? "Heavy rain expected in next week"
        : "Normal weather conditions",
    };
  } catch (error) {
    console.warn("Failed to fetch weather data for AI:", error);
    // Return mock data
    return {
      temperature: 28 + Math.random() * 4,
      rainfall: Math.random() * 30,
      humidity: 70 + Math.random() * 20,
    };
  }
}

/**
 * Fetch yield data formatted for AI analysis
 */
async function fetchYieldDataForAI(fieldId: string) {
  try {
    const yieldForecast = await getYieldForecast({
      features: [
        {
          field_id: fieldId,
          ndvi_mean: 0.65,
          rainfall_mm: 100,
          temperature_c: 30,
        },
      ],
    });

    // Extract first prediction
    const prediction = yieldForecast.predictions[0];

    return {
      predictedYield: prediction?.yield_kg_per_ha || 4000,
      lastActualYield: prediction?.previous_season_yield,
    };
  } catch (error) {
    console.warn("Failed to fetch yield data for AI:", error);
    return undefined;
  }
}

/**
 * Estimate growth stage based on current month
 * (Sri Lankan paddy seasons: Maha Nov-Mar, Yala May-Sep)
 */
function estimateGrowthStage():
  | "vegetative"
  | "reproductive"
  | "ripening"
  | "harvest" {
  const month = new Date().getMonth(); // 0-11

  // Simplified growth stage estimation
  if (month === 0 || month === 1 || month === 5 || month === 6) {
    return "vegetative"; // Early season
  } else if (month === 2 || month === 7) {
    return "reproductive"; // Mid season
  } else if (month === 3 || month === 8) {
    return "ripening"; // Late season
  } else {
    return "harvest"; // Harvest time
  }
}

/**
 * Apply a recommendation by ID.
 *
 * POST /api/v1/recommendations/{id}/apply
 */
export const applyRecommendation = async (
  id: string,
  payload?: { appliedAt?: string },
): Promise<Recommendation> => {
  try {
    const body: Record<string, unknown> = {};
    if (payload?.appliedAt) {
      body.appliedAt = payload.appliedAt;
    }

    const res = await httpClient.post<BackendRecommendationSingleResponse>(
      `/recommendations/${id}/apply`,
      body,
    );
    return mapBackendToRecommendation(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};
