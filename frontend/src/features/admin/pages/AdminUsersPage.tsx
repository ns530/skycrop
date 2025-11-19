import React, { useMemo, useState } from 'react';

import { useToast } from '../../../shared/hooks/useToast';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Modal } from '../../../shared/ui/Modal';
import type { AdminUserStatus, AdminUserSummary } from '../api/adminApi';
import { useAdminUsers, useUpdateUserStatus } from '../hooks/useAdmin';

/**
 * AdminUsersPage
 *
 * Administration interface for managing users under /admin/users.
 * - Lists users via admin API
 * - Provides basic role/status filtering (client-side)
 * - Allows enabling/disabling users with confirmation
 */
type RoleFilter = 'all' | 'farmer' | 'admin';
type StatusFilter = 'all' | 'active' | 'disabled';

interface PendingStatusChange {
  user: AdminUserSummary;
  nextStatus: AdminUserStatus;
}

const formatLastActive = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  // Fallback if parsing fails
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const AdminUsersPage: React.FC = () => {
  const { showToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUsers({
    page: 1,
    pageSize: 50,
  });

  const users = data?.data ?? [];

  const filteredUsers = useMemo(() => {
    return users.filter((user: AdminUserSummary) => {
      const matchesRole = roleFilter === 'all' ? true : user.role.toLowerCase() === roleFilter;
      const matchesStatus = statusFilter === 'all' ? true : user.status === statusFilter;
      return matchesRole && matchesStatus;
    });
  }, [users, roleFilter, statusFilter]);

  const { mutateAsync: updateStatus, isLoading: isUpdatingStatus } = useUpdateUserStatus();

  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(null);

  const openConfirmModal = (user: AdminUserSummary, nextStatus: AdminUserStatus) => {
    setPendingChange({ user, nextStatus });
  };

  const closeConfirmModal = () => {
    setPendingChange(null);
  };

  const handleRetry = async () => {
    try {
      await refetch();
    } catch (err) {
      const apiError = error ?? (err as Error);
      showToast({
        title: 'Failed to load users',
        description: apiError?.message ?? 'Something went wrong while fetching users.',
        variant: 'error',
      });
    }
  };

  const handleConfirmChange = async () => {
    if (!pendingChange) return;

    try {
      await updateStatus({
        id: pendingChange.user.id,
        status: pendingChange.nextStatus,
      });

      showToast({
        title: 'User status updated',
        description: `${pendingChange.user.email} is now ${pendingChange.nextStatus}.`,
        variant: 'success',
      });

      closeConfirmModal();
    } catch (err) {
      const apiError = err as Error;
      showToast({
        title: 'Failed to update user',
        description: apiError?.message ?? 'Something went wrong while updating the user status.',
        variant: 'error',
      });
    }
  };

  const renderStatusBadge = (status: AdminUserStatus) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center rounded-full bg-status-excellent/10 px-2 py-0.5 text-xs font-medium text-status-excellent">
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Disabled
      </span>
    );
  };

  const renderRow = (user: AdminUserSummary) => {
    const isActive = user.status === 'active';
    const nextStatus: AdminUserStatus = isActive ? 'disabled' : 'active';

    return (
      <tr key={user.id} className="hover:bg-gray-50 text-gray-900">
        <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
        <td className="px-4 py-3 text-xs text-gray-700">{user.email}</td>
        <td className="px-4 py-3 text-xs text-gray-700 capitalize">{user.role}</td>
        <td className="px-4 py-3 text-xs">{renderStatusBadge(user.status)}</td>
        <td className="px-4 py-3 text-xs text-gray-600">{formatLastActive(user.lastActiveAt)}</td>
        <td className="px-4 py-3 text-right">
          <Button
            size="sm"
            variant={isActive ? 'secondary' : 'primary'}
            onClick={() => openConfirmModal(user, nextStatus)}
          >
            {isActive ? 'Disable' : 'Enable'}
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <section aria-labelledby="admin-users-heading" className="space-y-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="admin-users-heading" className="text-lg font-semibold text-gray-900">
            User management
          </h1>
          <p className="text-sm text-gray-600">View and manage farmer and admin accounts.</p>
        </div>
      </header>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-3 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Role</span>
            <select
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRoleFilter(e.target.value as RoleFilter)
              }
              className="inline-flex h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="all">All</option>
              <option value="farmer">Farmer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Status</span>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="inline-flex h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="ml-auto text-gray-500">
            {isFetching ? 'Refreshing users…' : `Total users: ${data?.pagination.total ?? 0}`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Email
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Role
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Last active
                </th>
                <th
                  scope="col"
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading users…
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-red-600">
                    <div className="flex flex-col items-center gap-3">
                      <p>Unable to load users.</p>
                      <Button size="sm" variant="secondary" onClick={handleRetry}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No users match the selected filters.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredUsers.map(renderRow)}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={!!pendingChange} onClose={closeConfirmModal} title="Change user status">
        {pendingChange && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are about to change the status for{' '}
              <span className="font-medium">{pendingChange.user.email}</span> to{' '}
              <span className="font-medium">{pendingChange.nextStatus}</span>.
            </p>
            <p className="text-xs text-gray-500">
              Disabled users will not be able to sign in or access the platform until re-enabled.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={closeConfirmModal} disabled={isUpdatingStatus}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleConfirmChange} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? 'Updating…' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default AdminUsersPage;