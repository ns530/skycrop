import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

/**
 * RequireAuth
 *
 * Guards authenticated routes. If the user is not authenticated, redirects
 * to the login page and preserves the original destination in state.
 */
export interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    // Simple loading fallback; can be replaced with skeleton UI later.
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-600">
        Checking your session…
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{
          from: location.pathname + location.search + location.hash,
        }}
      />
    );
  }

  return <>{children}</>;
};

export default RequireAuth;