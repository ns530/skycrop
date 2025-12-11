import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth, UserRole } from "../context/AuthContext";

/**
 * RequireRole
 *
 * Enforces role-based access on top of authentication (e.g. admin-only routes).
 */
export interface RequireRoleProps {
  requiredRole: UserRole;
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  requiredRole,
  children,
}) => {
  const { user, status, hasRole } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-600">
        Checking your permissions…
      </div>
    );
  }

  if (!user || !hasRole(requiredRole)) {
    // Redirect non-authorized users back to dashboard
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          from: location.pathname + location.search + location.hash,
        }}
      />
    );
  }

  return <>{children}</>;
};

export default RequireRole;
