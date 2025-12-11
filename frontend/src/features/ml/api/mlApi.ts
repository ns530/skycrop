import { httpClient, normalizeApiError } from "../../../shared/api";
import type { FieldGeometry } from "../../../shared/types/geojson";

// --------------------
// Segmentation
// --------------------

export interface SegmentationPredictPayload {
  /**
   * Bounding box [minLon, minLat, maxLon, maxLat].
   * Required when fieldId is not provided.
   */
  bbox?: [number, number, number, number];
  /**
   * Optional field identifier; when provided, backend/ML service may resolve
   * field geometry and derive the bbox automatically.
   */
  fieldId?: string;
  /**
   * Date for which to generate the mask (YYYY-MM-DD).
   */
  date: string;
  modelVersion?: string;
  tiling?: {
    size?: number;
    overlap?: number;
  };
  /**
   * Response variant.
   * - "mask_url": URL to a static mask (default)
   * - "inline": base64-encoded payload
   */
  return?: "mask_url" | "inline";
}

export interface SegmentationResult {
  requestId: string;
  model: {
    name: string;
    version: string;
  };
  /**
   * URL to the generated mask when return = "mask_url".
   */
  maskUrl?: string;
  /**
   * Base64-encoded mask when return = "inline".
   */
  maskBase64?: string;
  /**
   * Format of the mask (e.g. "geojson" or "png").
   */
  maskFormat?: "geojson" | "png" | string;
  /**
   * Optional parsed geometry when backend/ML returns GeoJSON.
   */
  geometry?: FieldGeometry;
  metrics?: {
    latencyMs?: number;
    tileCount?: number;
    cloudCoverage?: number;
    [key: string]: unknown;
  };
  warnings?: string[];
}

interface BackendMLMaskEnvelope {
  success: boolean;
  data: {
    request_id: string;
    model: {
      name: string;
      version: string;
    };
    mask_url?: string;
    mask_base64?: string;
    mask_format?: string;
    metrics?: {
      latency_ms?: number;
      tile_count?: number;
      cloud_coverage?: number;
      [key: string]: unknown;
    };
    warnings?: string[];
    // Optional inline GeoJSON mask (future extension)
    geometry?: FieldGeometry;
  };
}

// --------------------
// Yield prediction
// --------------------

export interface YieldPredictFeatureRow {
  fieldId?: string;
  season?: string;
  // Additional model-specific features.
  [key: string]: string | number | null | undefined;
}

export interface YieldPredictPayloadFeatures {
  features: YieldPredictFeatureRow[];
  modelVersion?: string;
}

export interface YieldPredictPayloadMatrix {
  rows: number[][];
  featureNames: string[];
  modelVersion?: string;
}

export type YieldPredictPayload =
  | YieldPredictPayloadFeatures
  | YieldPredictPayloadMatrix;

export interface YieldPrediction {
  fieldId?: string;
  yieldKgPerHa: number;
}

export interface YieldPredictResult {
  requestId: string;
  model: {
    name: string;
    version: string;
  };
  predictions: YieldPrediction[];
  metrics?: {
    latencyMs?: number;
    [key: string]: unknown;
  };
  warnings?: string[];
}

interface BackendYieldPredictEnvelope {
  success: boolean;
  data: {
    request_id: string;
    model: {
      name: string;
      version: string;
    };
    predictions: {
      field_id?: string;
      yield_kg_per_ha: number;
    }[];
    metrics?: {
      latency_ms?: number;
      [key: string]: unknown;
    };
    warnings?: string[];
  };
}

// --------------------
// Disaster analysis
// --------------------

export type DisasterEventType = "flood" | "drought" | "stress" | "auto";

export interface DisasterIndexSample {
  fieldId: string;
  date: string;
  ndvi: number;
  ndwi: number;
  tdvi: number;
}

export type DisasterReturnMode = "summary" | "geojson" | "both";

export interface DisasterAnalyzePayload {
  indices: DisasterIndexSample[];
  event: DisasterEventType;
  eventDate: string;
  preDays?: number;
  postDays?: number;
  return?: DisasterReturnMode;
}

export interface DisasterAnalysisItem {
  fieldId: string;
  event: DisasterEventType;
  severity: "low" | "medium" | "high" | string;
  metrics: {
    ndviDrop?: number;
    ndwiDrop?: number;
    tdviDelta?: number;
    [key: string]: unknown;
  };
  windows: {
    preDays: number;
    postDays: number;
  };
}

export interface DisasterAnalyzeResult {
  requestId: string;
  analysis: DisasterAnalysisItem[];
  model: {
    name: string;
    version: string;
  };
  metrics?: {
    latencyMs?: number;
    [key: string]: unknown;
  };
  /**
   * Optional GeoJSON mask when return includes "geojson".
   */
  maskGeojson?: {
    type: string;
    // We avoid strict typing here to stay flexible with backend shape.
    [key: string]: unknown;
  };
}

interface BackendDisasterAnalyzeEnvelope {
  success: boolean;
  data: {
    request_id: string;
    analysis: {
      field_id: string;
      event: DisasterEventType;
      severity: string;
      metrics: {
        ndvi_drop?: number;
        ndwi_drop?: number;
        tdvi_delta?: number;
        [key: string]: unknown;
      };
      windows: {
        pre_days: number;
        post_days: number;
      };
    }[];
    model: {
      name: string;
      version: string;
    };
    metrics?: {
      latency_ms?: number;
      [key: string]: unknown;
    };
    mask_geojson?: {
      type: string;
      [key: string]: unknown;
    };
  };
}

// --------------------
// Helpers
// --------------------

const mapMaskResponse = (
  payload: BackendMLMaskEnvelope["data"],
): SegmentationResult => ({
  requestId: payload.request_id,
  model: {
    name: payload.model.name,
    version: payload.model.version,
  },
  maskUrl: payload.mask_url,
  maskBase64: payload.mask_base64,
  maskFormat: payload.mask_format as SegmentationResult["maskFormat"],
  geometry: payload.geometry,
  metrics: payload.metrics
    ? {
        latencyMs: payload.metrics.latency_ms,
        tileCount: payload.metrics.tile_count,
        cloudCoverage: payload.metrics.cloud_coverage,
        ...payload.metrics,
      }
    : undefined,
  warnings: payload.warnings,
});

const mapYieldResponse = (
  payload: BackendYieldPredictEnvelope["data"],
): YieldPredictResult => ({
  requestId: payload.request_id,
  model: {
    name: payload.model.name,
    version: payload.model.version,
  },
  predictions: payload.predictions.map((p) => ({
    fieldId: p.field_id,
    yieldKgPerHa: p.yield_kg_per_ha,
  })),
  metrics: payload.metrics
    ? {
        latencyMs: payload.metrics.latency_ms,
        ...payload.metrics,
      }
    : undefined,
  warnings: payload.warnings,
});

const mapDisasterResponse = (
  payload: BackendDisasterAnalyzeEnvelope["data"],
): DisasterAnalyzeResult => ({
  requestId: payload.request_id,
  analysis: payload.analysis.map((item) => ({
    fieldId: item.field_id,
    event: item.event,
    severity: item.severity as DisasterAnalysisItem["severity"],
    metrics: {
      ndviDrop: item.metrics.ndvi_drop,
      ndwiDrop: item.metrics.ndwi_drop,
      tdviDelta: item.metrics.tdvi_delta,
      ...item.metrics,
    },
    windows: {
      preDays: item.windows.pre_days,
      postDays: item.windows.post_days,
    },
  })),
  model: {
    name: payload.model.name,
    version: payload.model.version,
  },
  metrics: payload.metrics
    ? {
        latencyMs: payload.metrics.latency_ms,
        ...payload.metrics,
      }
    : undefined,
  maskGeojson: payload.mask_geojson,
});

// --------------------
// Public API
// --------------------

/**
 * Proxy to segmentation mask prediction.
 *
 * POST /api/v1/ml/segmentation/predict
 */
export const predictSegmentation = async (
  payload: SegmentationPredictPayload,
): Promise<SegmentationResult> => {
  try {
    const body: Record<string, unknown> = {
      date: payload.date,
      model_version: payload.modelVersion,
      tiling: payload.tiling,
      return: payload.return,
    };

    if (payload.bbox) {
      body.bbox = payload.bbox;
    }
    if (payload.fieldId) {
      body.field_id = payload.fieldId;
    }

    const res = await httpClient.post<BackendMLMaskEnvelope>(
      "/ml/segmentation/predict",
      body,
    );
    return mapMaskResponse(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Proxy to yield prediction.
 *
 * POST /api/v1/ml/yield/predict
 */
export const predictYield = async (
  payload: YieldPredictPayload,
): Promise<YieldPredictResult> => {
  try {
    const body: Record<string, unknown> = {};

    if ("features" in payload) {
      body.features = payload.features.map((row) => ({
        field_id: row.fieldId,
        season: row.season,
        ...row,
      }));
      if (payload.modelVersion) body.model_version = payload.modelVersion;
    } else {
      body.rows = payload.rows;
      body.feature_names = payload.featureNames;
      if (payload.modelVersion) body.model_version = payload.modelVersion;
    }

    const res = await httpClient.post<BackendYieldPredictEnvelope>(
      "/ml/yield/predict",
      body,
    );
    return mapYieldResponse(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Proxy to disaster analysis.
 *
 * POST /api/v1/ml/disaster/analyze
 */
export const analyzeDisaster = async (
  payload: DisasterAnalyzePayload,
): Promise<DisasterAnalyzeResult> => {
  try {
    const body: Record<string, unknown> = {
      indices: payload.indices.map((s) => ({
        field_id: s.fieldId,
        date: s.date,
        ndvi: s.ndvi,
        ndwi: s.ndwi,
        tdvi: s.tdvi,
      })),
      event: payload.event,
      event_date: payload.eventDate,
      pre_days: payload.preDays,
      post_days: payload.postDays,
      return: payload.return,
    };

    const res = await httpClient.post<BackendDisasterAnalyzeEnvelope>(
      "/ml/disaster/analyze",
      body,
    );
    return mapDisasterResponse(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};
