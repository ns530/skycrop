import { useQuery } from "@tanstack/react-query";
import { X, Shield, Check, Minus } from "lucide-react";
import React, { useEffect, useState } from "react";

import { httpClient } from "../../../shared/api/httpClient";

interface PermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleInfo {
  name: string;
  level: number;
  description: string;
  permissions: string[];
}

interface RoleHierarchy {
  admin: RoleInfo;
  manager: RoleInfo;
  farmer: RoleInfo;
  viewer: RoleInfo;
}

/**
 * Permission Matrix Modal
 * Displays a matrix of roles and their permissions
 */
export const PermissionMatrixModal: React.FC<PermissionMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Fetch role hierarchy
  const { data: rolesData, isLoading } = useQuery<{ data: RoleHierarchy }>({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const response = await httpClient.get("/admin/users/roles");
      return response.data;
    },
    enabled: isOpen,
  });

  // Group permissions by resource
  const groupPermissions = (roles: RoleHierarchy) => {
    const resources = new Set<string>();
    Object.values(roles).forEach((role) => {
      role.permissions.forEach((perm: string) => {
        if (perm !== "*") {
          const [resource] = perm.split(".");
          resources.add(resource);
        }
      });
    });

    return Array.from(resources).sort();
  };

  // Check if role has permission
  const hasPermission = (
    role: RoleInfo,
    resource: string,
    action: string,
  ): boolean => {
    if (role.permissions.includes("*")) return true;

    const fullPermission = `${resource}.${action}`;
    const ownPermission = `${resource}.${action}_own`;
    const allPermission = `${resource}.${action}_all`;
    const wildcardPermission = `${resource}.*`;

    return (
      role.permissions.includes(fullPermission) ||
      role.permissions.includes(ownPermission) ||
      role.permissions.includes(allPermission) ||
      role.permissions.includes(wildcardPermission)
    );
  };

  // Get permission icon
  const getPermissionIcon = (
    role: RoleInfo,
    resource: string,
    action: string,
  ) => {
    if (!hasPermission(role, resource, action)) {
      return <Minus className="h-4 w-4 text-gray-300" />;
    }

    // Check if it's "own" permission
    const ownPermission = `${resource}.${action}_own`;
    if (role.permissions.includes(ownPermission)) {
      return (
        <div className="relative">
          <Check className="h-4 w-4 text-yellow-500" />
          <span className="absolute -top-1 -right-1 text-xs text-yellow-600 font-bold">
            *
          </span>
        </div>
      );
    }

    return <Check className="h-4 w-4 text-green-500" />;
  };

  const resources = rolesData?.data ? groupPermissions(rolesData.data) : [];
  const roles = rolesData?.data
    ? (Object.keys(rolesData.data) as Array<keyof RoleHierarchy>)
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-brand-blue" />
            Permissions Matrix
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
            </div>
          ) : rolesData?.data ? (
            <>
              {/* Role Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {roles.map((roleKey) => {
                  const role = rolesData.data[roleKey];
                  const colors = {
                    admin: "bg-purple-50 border-purple-200 text-purple-800",
                    manager: "bg-blue-50 border-blue-200 text-blue-800",
                    farmer: "bg-green-50 border-green-200 text-green-800",
                    viewer: "bg-gray-50 border-gray-200 text-gray-800",
                  };

                  return (
                    <div
                      key={roleKey}
                      className={`border-2 rounded-lg p-4 ${colors[roleKey]}`}
                    >
                      <h4 className="font-semibold text-sm mb-1">
                        {role.name}
                      </h4>
                      <p className="text-xs opacity-80">{role.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  Legend
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">Full access</span>
                  </div>
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Check className="h-4 w-4 text-yellow-500" />
                      <span className="absolute -top-1 -right-1 text-xs text-yellow-600 font-bold">
                        *
                      </span>
                    </div>
                    <span className="text-gray-600">Own resources only</span>
                  </div>
                  <div className="flex items-center">
                    <Minus className="h-4 w-4 text-gray-300 mr-2" />
                    <span className="text-gray-600">No access</span>
                  </div>
                </div>
              </div>

              {/* Permission Matrix */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-r border-gray-200">
                        Resource / Action
                      </th>
                      {roles.map((roleKey) => (
                        <th
                          key={roleKey}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b border-gray-200"
                        >
                          {rolesData.data[roleKey].name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resources.map((resource) => (
                      <React.Fragment key={resource}>
                        {/* Resource Header */}
                        <tr className="bg-gray-50">
                          <td
                            colSpan={roles.length + 1}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 uppercase border-r border-gray-200"
                          >
                            {resource}
                          </td>
                        </tr>
                        {/* Actions */}
                        {[
                          "create",
                          "read",
                          "update",
                          "delete",
                          "generate",
                          "predict",
                        ].map((action) => {
                          // Check if any role has this action for this resource
                          const hasAction = roles.some((roleKey) =>
                            hasPermission(
                              rolesData.data[roleKey],
                              resource,
                              action,
                            ),
                          );

                          if (!hasAction) return null;

                          return (
                            <tr key={`${resource}.${action}`}>
                              <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                                {action.charAt(0).toUpperCase() +
                                  action.slice(1)}
                              </td>
                              {roles.map((roleKey) => (
                                <td
                                  key={roleKey}
                                  className="px-4 py-2 text-center border-gray-200"
                                >
                                  {getPermissionIcon(
                                    rolesData.data[roleKey],
                                    resource,
                                    action,
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No permission data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-white bg-brand-blue rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrixModal;
