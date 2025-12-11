import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Shield, Search, MoreVertical, Mail } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { httpClient } from '../../../shared/api/httpClient';
import { useToast } from '../../../shared/hooks/useToast';
import { InviteUserModal } from '../components/InviteUserModal';
import { PermissionMatrixModal } from '../components/PermissionMatrixModal';
import { TeamMembersList } from '../components/TeamMembersList';
import { UserStatsCard } from '../components/UserStatsCard';

interface User {
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'farmer' | 'viewer';
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  last_login: string | null;
  profile_photo_url: string | null;
}

interface UserStats {
  total: number;
  byStatus: {
    active: number;
    suspended: number;
    deleted: number;
  };
  byRole: {
    admin?: number;
    manager?: number;
    farmer?: number;
    viewer?: number;
  };
}

/**
 * Team Management Page
 * Admin interface for managing users, roles, and permissions
 */
export const TeamManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [permissionMatrixOpen, setPermissionMatrixOpen] = useState(false);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users', { page, roleFilter, statusFilter, searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await httpClient.get(`/admin/users?${params.toString()}`);
      return response.data.data;
    },
  });

  // Fetch user statistics
  const { data: statsData } = useQuery<{ data: UserStats }>({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: async () => {
      const response = await httpClient.get('/admin/users/stats');
      return response.data;
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await httpClient.patch(`/admin/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast({
        variant: 'success',
        title: 'Role Updated',
        description: 'User role has been updated successfully',
      });
    },
    onError: (error: any) => {
      showToast({
        variant: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error?.message || 'Failed to update user role',
      });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await httpClient.patch(`/admin/users/${userId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast({
        variant: 'success',
        title: 'Status Updated',
        description: 'User status has been updated successfully',
      });
    },
    onError: (error: any) => {
      showToast({
        variant: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error?.message || 'Failed to update user status',
      });
    },
  });

  const handleUpdateRole = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleUpdateStatus = (userId: string, newStatus: string) => {
    updateStatusMutation.mutate({ userId, status: newStatus });
  };

  const stats = statsData?.data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="h-8 w-8 mr-3 text-brand-blue" />
              Team Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage users, roles, and permissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setPermissionMatrixOpen(true)}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-5 w-5 mr-2" />
              View Permissions
            </button>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center px-4 py-2 text-white bg-brand-blue rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Invite User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <UserStatsCard
              title="Total Users"
              value={stats.total}
              icon={<Users className="h-6 w-6 text-blue-500" />}
              bgColor="bg-blue-50"
            />
            <UserStatsCard
              title="Active Users"
              value={stats.byStatus.active}
              icon={<Users className="h-6 w-6 text-green-500" />}
              bgColor="bg-green-50"
            />
            <UserStatsCard
              title="Admins"
              value={stats.byRole.admin || 0}
              icon={<Shield className="h-6 w-6 text-purple-500" />}
              bgColor="bg-purple-50"
            />
            <UserStatsCard
              title="Managers"
              value={stats.byRole.manager || 0}
              icon={<Shield className="h-6 w-6 text-orange-500" />}
              bgColor="bg-orange-50"
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="farmer">Farmer</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Team Members List */}
      <TeamMembersList
        users={usersData?.users || []}
        loading={loadingUsers}
        onUpdateRole={handleUpdateRole}
        onUpdateStatus={handleUpdateStatus}
        pagination={usersData?.pagination}
        onPageChange={setPage}
      />

      {/* Modals */}
      {inviteModalOpen && (
        <InviteUserModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onSuccess={() => {
            setInviteModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
          }}
        />
      )}

      {permissionMatrixOpen && (
        <PermissionMatrixModal
          isOpen={permissionMatrixOpen}
          onClose={() => setPermissionMatrixOpen(false)}
        />
      )}
    </div>
  );
};

export default TeamManagementPage;

