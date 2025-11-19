import { httpClient, normalizeApiError, type PaginatedResponse, type ListParams } from '../../../shared/api';

// --------------------
// Types
// --------------------

export type AdminUserStatus = 'active' | 'disabled';

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AdminUserStatus;
  lastActiveAt?: string;
}

export type AdminContentStatus = 'draft' | 'published';

export interface AdminContentItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  status: AdminContentStatus;
  publishedAt?: string;
}

export type ServiceStatusLevel = 'up' | 'degraded' | 'down';

export interface SystemStatus {
  mlService: ServiceStatusLevel;
  api: ServiceStatusLevel;
  satelliteIngest: ServiceStatusLevel;
}

// --------------------
// Backend shapes (internal)
// --------------------

interface BackendAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AdminUserStatus | string;
  last_active_at?: string | null;
}

interface BackendAdminUserListEnvelope {
  success: boolean;
  data: BackendAdminUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: Record<string, unknown>;
}

interface BackendAdminUserSingleEnvelope {
  success: boolean;
  data: BackendAdminUser;
}

interface BackendAdminContent {
  id: string;
  title: string;
  summary: string;
  body: string;
  status: AdminContentStatus | string;
  published_at?: string | null;
}

interface BackendAdminContentListEnvelope {
  success: boolean;
  data: BackendAdminContent[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: Record<string, unknown>;
}

interface BackendAdminContentSingleEnvelope {
  success: boolean;
  data: BackendAdminContent;
}

interface BackendSystemStatusEnvelope {
  success: boolean;
  data: {
    ml_service: ServiceStatusLevel | string;
    api: ServiceStatusLevel | string;
    satellite_ingest: ServiceStatusLevel | string;
  };
}

// --------------------
// Config (paths)
// --------------------

const ADMIN_USERS_PATH = '/admin/users';
const ADMIN_CONTENT_PATH = '/admin/content';
const ADMIN_SYSTEM_STATUS_PATH = '/admin/system-status';

// --------------------
// Mappers
// --------------------

const mapListParamsToQuery = (params?: ListParams): Record<string, unknown> | undefined => {
  if (!params) return undefined;

  const query: Record<string, unknown> = {};
  if (typeof params.page === 'number') query.page = params.page;
  if (typeof params.pageSize === 'number') query.pageSize = params.pageSize;
  if (params.search) query.search = params.search;
  if (params.sort) query.sort = params.sort;
  if (params.order) query.order = params.order;

  return query;
};

const mapBackendUser = (user: BackendAdminUser): AdminUserSummary => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: (user.status as AdminUserStatus) ?? 'active',
  lastActiveAt: user.last_active_at ?? undefined,
});

const mapBackendContent = (item: BackendAdminContent): AdminContentItem => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  body: item.body,
  status: (item.status as AdminContentStatus) ?? 'draft',
  publishedAt: item.published_at ?? undefined,
});

const mapSystemStatus = (payload: BackendSystemStatusEnvelope['data']): SystemStatus => ({
  mlService: payload.ml_service as ServiceStatusLevel,
  api: payload.api as ServiceStatusLevel,
  satelliteIngest: payload.satellite_ingest as ServiceStatusLevel,
});

// --------------------
// Public API
// --------------------

/**
 * List users with pagination and optional search/sort.
 *
 * GET /api/v1/admin/users
 */
export const listUsers = async (params?: ListParams): Promise<PaginatedResponse<AdminUserSummary>> => {
  try {
    const res = await httpClient.get<BackendAdminUserListEnvelope>(ADMIN_USERS_PATH, {
      params: mapListParamsToQuery(params),
    });

    const { data, pagination, meta } = res.data;

    return {
      data: data.map(mapBackendUser),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
      },
      meta,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Update a user's status.
 *
 * PATCH /api/v1/admin/users/{id}/status
 */
export const updateUserStatus = async (id: string, status: AdminUserStatus): Promise<AdminUserSummary> => {
  try {
    const res = await httpClient.patch<BackendAdminUserSingleEnvelope>(`${ADMIN_USERS_PATH}/${id}/status`, { status });
    return mapBackendUser(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * List content items.
 *
 * GET /api/v1/admin/content
 */
export const listContent = async (params?: ListParams): Promise<PaginatedResponse<AdminContentItem>> => {
  try {
    const res = await httpClient.get<BackendAdminContentListEnvelope>(ADMIN_CONTENT_PATH, {
      params: mapListParamsToQuery(params),
    });

    const { data, pagination, meta } = res.data;

    return {
      data: data.map(mapBackendContent),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
      },
      meta,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Create a new content item or update an existing one.
 *
 * POST /api/v1/admin/content
 * PUT  /api/v1/admin/content/{id}
 */
export const createOrUpdateContent = async (
  item: Partial<AdminContentItem> & { id?: string }
): Promise<AdminContentItem> => {
  try {
    const payload = {
      title: item.title,
      summary: item.summary,
      body: item.body,
      status: item.status,
      published_at: item.publishedAt,
    };

    const hasId = Boolean(item.id);
    const method = hasId ? 'put' : 'post';
    const url = hasId ? `${ADMIN_CONTENT_PATH}/${item.id}` : ADMIN_CONTENT_PATH;

    const res = await httpClient[method as 'post' | 'put']<BackendAdminContentSingleEnvelope>(url, payload);
    return mapBackendContent(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Get system health/availability status for key services.
 *
 * GET /api/v1/admin/system-status
 */
export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    const res = await httpClient.get<BackendSystemStatusEnvelope>(ADMIN_SYSTEM_STATUS_PATH);
    return mapSystemStatus(res.data.data);
  } catch (error) {
    throw normalizeApiError(error);
  }
};