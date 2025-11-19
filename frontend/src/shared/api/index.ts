// Shared API exports and generic types for SkyCrop frontend.
//
// CONVENTIONS:
// - All API functions return Promise<T> or Promise<PaginatedResponse<T>>.
// - API functions unwrap backend { success, data, pagination, meta } envelopes
//   and return strongly typed data.
// - On failure, functions throw ApiError (normalized via normalizeApiError).

export { httpClient, setAuthTokens, configureAuthHandlers, ApiError, normalizeApiError } from './httpClient';
export type { AuthTokens } from './httpClient';

/**
 * Generic pagination envelope used by list endpoints after unwrapping
 * the backend response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  /**
   * Optional metadata (e.g., correlation IDs, cache flags, etc.).
   */
  meta?: Record<string, unknown>;
}

/**
 * Common list/query parameters used for pageable endpoints.
 *
 * NOTE:
 * - Individual API modules are responsible for mapping these camelCase
 *   params to the exact backend query parameter names (e.g. page_size).
 */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}