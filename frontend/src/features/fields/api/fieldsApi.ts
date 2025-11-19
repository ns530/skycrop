import { httpClient, normalizeApiError, type PaginatedResponse, type ListParams } from '../../../shared/api';
import type { FieldGeometry, GeoJSONPoint } from '../../../shared/types/geojson';

/**
 * Field status values as exposed by the backend schema, with a string
 * fallback to be forward-compatible with new statuses.
 */
export type FieldStatus = 'active' | 'archived' | 'deleted' | string;

export interface FieldSummary {
  id: string;
  name: string;
  /**
   * Area in hectares (derived from backend area_sqm / 10_000).
   */
  areaHa: number;
  createdAt: string;
  updatedAt: string;
  status?: FieldStatus;
  /**
   * Convenience centroid representation (lat/lon) derived from GeoJSON Point.
   */
  centroidLatLon?: {
    lat: number;
    lon: number;
  };
}

/**
 * Detailed field representation, extending the list summary with geometry and
 * optional pre-computed health/recommendation summaries when available.
 */
export interface FieldDetail extends FieldSummary {
  geometry: FieldGeometry;
  latestHealthStatus?: 'excellent' | 'good' | 'fair' | 'poor';
  latestHealthIndex?: number | null;
  latestRecommendationSummary?: string | null;
}

/**
 * Payload used when creating a field from a manually drawn boundary.
 * Maps to backend FieldCreateRequest + a few frontend-only extensions.
 */
export interface CreateFieldPayload {
  name: string;
  geometry: FieldGeometry;
  cropType?: string;
  notes?: string;
}

/**
 * Partial update payload for field metadata and, optionally, boundary geometry.
 * Backend currently supports name/status; cropType/notes are kept as
 * forward-compatible extensions and may be ignored by the API.
 * Boundary updates are mapped to the backend "boundary" field.
 */
export interface UpdateFieldPayload {
  name?: string;
  status?: FieldStatus;
  cropType?: string;
  notes?: string;
  geometry?: FieldGeometry;
}

/**
 * Payload for invoking boundary detection for a given field.
 * This is intentionally loose; the concrete schema is still evolving.
 */
export interface DetectBoundaryPayload {
  imageUrl?: string;
  /**
   * Bounding box in [minLon, minLat, maxLon, maxLat].
   */
  bbox?: [number, number, number, number];
  // TODO: Align with backend detect-boundary contract once finalized.
}

// --------------------
// Backend envelope types (internal)
// --------------------

interface BackendField {
  field_id: string;
  user_id: string;
  name: string;
  boundary: FieldGeometry;
  area_sqm: number;
  center: GeoJSONPoint;
  status: FieldStatus;
  created_at: string;
  updated_at: string;
}

interface BackendFieldListResponse {
  success: boolean;
  data: BackendField[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
  meta?: Record<string, unknown>;
}

interface BackendFieldSingleResponse {
  success: boolean;
  data: BackendField;
}

interface BackendCreateFieldResponse {
  success: boolean;
  data: BackendField;
  warnings?: unknown[];
}

interface BackendDetectBoundaryResponse {
  success: boolean;
  data: FieldGeometry;
}

// --------------------
// Mappers
// --------------------

const mapBackendFieldToDetail = (field: BackendField): FieldDetail => {
  const coords = field.center?.coordinates as GeoJSONPoint['coordinates'] | undefined;
  const [lon, lat] = Array.isArray(coords) && coords.length >= 2 ? [coords[0], coords[1]] : [undefined, undefined];

  return {
    id: field.field_id,
    name: field.name,
    areaHa: field.area_sqm / 10_000,
    createdAt: field.created_at,
    updatedAt: field.updated_at,
    status: field.status,
    centroidLatLon:
      typeof lat === 'number' && typeof lon === 'number'
        ? {
            lat,
            lon,
          }
        : undefined,
    geometry: field.boundary,
    // Health & recommendation summaries can be populated by higher-level
    // composition APIs in the future.
    latestHealthStatus: undefined,
    latestHealthIndex: undefined,
    latestRecommendationSummary: undefined,
  };
};

const mapBackendFieldToSummary = (field: BackendField): FieldSummary => {
  const detail = mapBackendFieldToDetail(field);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { geometry, latestHealthStatus, latestHealthIndex, latestRecommendationSummary, ...summary } = detail;
  return summary;
};

const mapListParamsToQuery = (params?: ListParams): Record<string, unknown> | undefined => {
  if (!params) return undefined;

  const query: Record<string, unknown> = {};
  if (typeof params.page === 'number') query.page = params.page;
  if (typeof params.pageSize === 'number') query.page_size = params.pageSize;
  if (params.search) query.search = params.search;
  if (params.sort) query.sort = params.sort;
  if (params.order) query.order = params.order;

  return query;
};

// --------------------
// Public API
// --------------------

/**
 * List fields for the current user.
 *
 * GET /api/v1/fields
 */
export const listFields = async (params?: ListParams): Promise<PaginatedResponse<FieldSummary>> => {
  try {
    const res = await httpClient.get<BackendFieldListResponse>('/fields', {
      params: mapListParamsToQuery(params),
    });

    const { data, pagination, meta } = res.data;

    return {
      data: data.map(mapBackendFieldToSummary),
      pagination: {
        page: pagination.page,
        pageSize: pagination.page_size,
        total: pagination.total,
      },
      meta,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Fetch a single field by ID.
 *
 * GET /api/v1/fields/{id}
 */
export const getFieldById = async (fieldId: string): Promise<FieldDetail> => {
  try {
    const res = await httpClient.get<BackendFieldSingleResponse>(`/fields/${fieldId}`);
    return mapBackendFieldToDetail(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Create a new field from a manual boundary.
 *
 * POST /api/v1/fields
 */
export const createField = async (payload: CreateFieldPayload): Promise<FieldDetail> => {
  try {
    const body = {
      name: payload.name,
      boundary: payload.geometry,
      // Optional, backend may ignore unknown fields
      crop_type: payload.cropType,
      notes: payload.notes,
    };

    const res = await httpClient.post<BackendCreateFieldResponse>('/fields', body);
    return mapBackendFieldToDetail(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Update field metadata (name/status, and optional extensions).
 *
 * PATCH /api/v1/fields/{id}
 */
export const updateField = async (fieldId: string, payload: UpdateFieldPayload): Promise<FieldDetail> => {
  try {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.cropType !== undefined) body.crop_type = payload.cropType;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.geometry !== undefined) body.boundary = payload.geometry;

    const res = await httpClient.patch<BackendFieldSingleResponse>(`/fields/${fieldId}`, body);
    return mapBackendFieldToDetail(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Delete (soft-delete) a field.
 *
 * DELETE /api/v1/fields/{id}
 */
export const deleteField = async (fieldId: string): Promise<void> => {
  try {
    await httpClient.delete(`/fields/${fieldId}`);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Trigger ML-powered boundary detection for an existing field.
 *
 * POST /api/v1/fields/{id}/detect-boundary
 */
export const detectFieldBoundary = async (
  fieldId: string,
  payload: DetectBoundaryPayload
): Promise<FieldGeometry> => {
  try {
    const res = await httpClient.post<BackendDetectBoundaryResponse>(`/fields/${fieldId}/detect-boundary`, payload);
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};