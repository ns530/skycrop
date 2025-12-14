/**
 * Fields API - Field Management Endpoints
 * 
 * API functions for fields CRUD operations
 */

import { apiClient } from './client';
import * as GeoJSON from 'geojson';

export interface Field {
  field_id: string;
  user_id: string;
  name: string;
  boundary?: GeoJSON.Polygon; // Optional - may not always be present
  area_sqm?: number; // Optional - may not always be present
  area_ha?: number; // Optional - may not always be present
  center?: GeoJSON.Point; // Optional - may not always be present
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'deleted';
}

export interface FieldSummary {
  field_id: string;
  name: string;
  area_ha?: number; // Optional - may not always be present
  health_status?: 'excellent' | 'good' | 'fair' | 'poor';
  health_score?: number;
  last_health_update?: string;
  center?: GeoJSON.Point; // Optional - may not always be present
}

export interface CreateFieldPayload {
  name: string;
  boundary: GeoJSON.Polygon;
}

export interface UpdateFieldPayload {
  name?: string;
  boundary?: GeoJSON.Polygon;
}

export interface ListFieldsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'archived';
  sort_by?: 'created_at' | 'name' | 'area_sqm';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const fieldsApi = {
  /**
   * Get all fields for current user
   */
  listFields: async (params?: ListFieldsParams): Promise<PaginatedResponse<FieldSummary>> => {
    const response = await apiClient.get<any>('/api/v1/fields', {
      params,
    });
    // Backend returns { success: true, data: {...}, pagination: {...} }
    const backendData = response.data.data || response.data;
    const pagination = response.data.pagination || response.data.data?.pagination;
    return {
      data: backendData?.data || backendData || [],
      pagination: pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
    };
  },

  /**
   * Get field by ID
   */
  getFieldById: async (fieldId: string): Promise<Field> => {
    const response = await apiClient.get<any>(`/api/v1/fields/${fieldId}`);
    // Backend returns { success: true, data: {...} }
    const backendData = response.data.data || response.data;
    return backendData;
  },

  /**
   * Create new field
   */
  createField: async (payload: CreateFieldPayload): Promise<Field> => {
    const response = await apiClient.post<any>('/api/v1/fields', payload);
    // Backend returns { success: true, data: {...} }
    const backendData = response.data.data || response.data;
    return backendData;
  },

  /**
   * Update field
   */
  updateField: async (fieldId: string, payload: UpdateFieldPayload): Promise<Field> => {
    const response = await apiClient.patch<Field>(`/api/v1/fields/${fieldId}`, payload);
    return response.data;
  },

  /**
   * Delete field (soft delete)
   */
  deleteField: async (fieldId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/fields/${fieldId}`);
  },

  /**
   * Get field health summary
   */
  getFieldHealthSummary: async (fieldId: string) => {
    const response = await apiClient.get(`/api/v1/fields/${fieldId}/health/summary`);
    return response.data;
  },

  /**
   * Get field recommendations
   */
  getFieldRecommendations: async (fieldId: string) => {
    const response = await apiClient.get(`/api/v1/fields/${fieldId}/recommendations`);
    return response.data;
  },
};

