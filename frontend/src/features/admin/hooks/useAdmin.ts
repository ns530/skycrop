import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError, ListParams, PaginatedResponse } from '../../../shared/api';
import { adminKeys } from '../../../shared/query/queryKeys';
import {
  listUsers,
  updateUserStatus,
  listContent,
  createOrUpdateContent,
  getSystemStatus,
  type AdminUserSummary,
  type AdminContentItem,
  type SystemStatus,
  type AdminUserStatus,
} from '../api/adminApi';

/**
 * useAdminUsers
 *
 * Fetch paginated admin user list.
 */
export const useAdminUsers = (params?: ListParams) =>
  useQuery<PaginatedResponse<AdminUserSummary>, ApiError>({
    queryKey: adminKeys.users(params),
    queryFn: () => listUsers(params),
    placeholderData: (previousData) => previousData,
  });

type UpdateUserStatusVariables = {
  id: string;
  status: AdminUserStatus;
};

/**
 * useUpdateUserStatus
 *
 * Update a user's status and refresh relevant user lists.
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminUserSummary, ApiError, UpdateUserStatusVariables>({
    mutationFn: ({ id, status }: UpdateUserStatusVariables) => updateUserStatus(id, status),
    onSuccess: () => {
      // Invalidate all admin user lists (any params)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

/**
 * useAdminContent
 *
 * Fetch paginated admin content list.
 */
export const useAdminContent = (params?: ListParams) =>
  useQuery<PaginatedResponse<AdminContentItem>, ApiError>({
    queryKey: adminKeys.content(params),
    queryFn: () => listContent(params),
    placeholderData: (previousData) => previousData,
  });

type UpsertAdminContentVariables = Partial<AdminContentItem> & { id?: string };

/**
 * useUpsertAdminContent
 *
 * Create or update admin content and refresh content lists.
 */
export const useUpsertAdminContent = () => {
  const queryClient = useQueryClient();

  return useMutation<AdminContentItem, ApiError, UpsertAdminContentVariables>({
    mutationFn: (item: UpsertAdminContentVariables) => createOrUpdateContent(item),
    onSuccess: () => {
      // Invalidate all admin content lists (any params)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
    },
  });
};

/**
 * useSystemStatus
 *
 * Fetch system health/availability status for key services.
 */
export const useSystemStatus = () =>
  useQuery<SystemStatus, ApiError>({
    queryKey: adminKeys.systemStatus,
    queryFn: () => getSystemStatus(),
    staleTime: 30_000, // 30 seconds
  });