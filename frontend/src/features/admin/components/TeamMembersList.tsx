import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Shield, Ban, Trash2, Check } from "lucide-react";
import React, { useState } from "react";

interface User {
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "farmer" | "viewer";
  status: "active" | "suspended" | "deleted";
  created_at: string;
  last_login: string | null;
  profile_photo_url: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TeamMembersListProps {
  users: User[];
  loading: boolean;
  onUpdateRole: (userId: string, newRole: string) => void;
  onUpdateStatus: (userId: string, newStatus: string) => void;
  pagination?: Pagination;
  onPageChange: (page: number) => void;
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "manager":
      return "bg-blue-100 text-blue-800";
    case "farmer":
      return "bg-green-100 text-green-800";
    case "viewer":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "suspended":
      return "bg-yellow-100 text-yellow-800";
    case "deleted":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  users,
  loading,
  onUpdateRole,
  onUpdateStatus,
  pagination,
  onPageChange,
}) => {
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}
                  >
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login
                    ? formatDistanceToNow(new Date(user.last_login), {
                        addSuffix: true,
                      })
                    : "Never"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() =>
                        setOpenMenuUserId(
                          openMenuUserId === user.user_id ? null : user.user_id,
                        )
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {openMenuUserId === user.user_id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          {/* Change Role */}
                          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                            Change Role
                          </div>
                          {["admin", "manager", "farmer", "viewer"].map(
                            (role) => (
                              <button
                                key={role}
                                onClick={() => {
                                  onUpdateRole(user.user_id, role);
                                  setOpenMenuUserId(null);
                                }}
                                disabled={user.role === role}
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  user.role === role
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100"
                                } flex items-center`}
                              >
                                {user.role === role && (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                {user.role !== role && (
                                  <Shield className="h-4 w-4 mr-2" />
                                )}
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </button>
                            ),
                          )}

                          <div className="border-t border-gray-100 my-1"></div>

                          {/* Change Status */}
                          {user.status !== "suspended" &&
                            user.status !== "deleted" && (
                              <button
                                onClick={() => {
                                  onUpdateStatus(user.user_id, "suspended");
                                  setOpenMenuUserId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend User
                              </button>
                            )}

                          {user.status === "suspended" && (
                            <button
                              onClick={() => {
                                onUpdateStatus(user.user_id, "active");
                                setOpenMenuUserId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Activate User
                            </button>
                          )}

                          {user.status !== "deleted" && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this user?",
                                  )
                                ) {
                                  onUpdateStatus(user.user_id, "deleted");
                                  setOpenMenuUserId(null);
                                }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total users)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembersList;
