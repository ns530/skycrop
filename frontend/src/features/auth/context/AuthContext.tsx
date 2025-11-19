import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { configureAuthHandlers, setAuthTokens } from '../../../shared/api/httpClient';
import { useToast } from '../../../shared/hooks/useToast';
import {
  AuthPayload,
  AuthTokens as ApiAuthTokens,
  extractTokens,
  loginWithEmail as apiLoginWithEmail,
  signupWithEmail as apiSignupWithEmail,
  logoutSession,
  requestPasswordReset as apiRequestPasswordReset,
  resetPasswordWithToken as apiResetPasswordWithToken,
  refreshAuthTokens as apiRefreshAuthTokens,
} from '../api/authApi';

export type UserRole = 'farmer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /**
   * Legacy/manual login hook (primarily for tests).
   * For real flows, prefer loginWithEmail/registerWithEmail/completeOAuthLogin.
   */
  login: (user: AuthUser) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  loginWithEmail: (params: { email: string; password: string }) => Promise<void>;
  registerWithEmail: (params: { name: string; email: string; password: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  /**
   * Start Google OAuth in a new browser navigation.
   * Optional redirect path is stored in sessionStorage and used by the callback page.
   */
  startGoogleOAuth: (redirectTo?: string) => void;
  completeOAuthLogin: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'skycrop_auth_session';
const POST_LOGIN_REDIRECT_KEY = 'skycrop_post_login_redirect';

interface StoredAuthState {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string | null;
}

const mapPayloadToAuthUser = (payload: AuthPayload): AuthUser => ({
  id: payload.user.user_id,
  email: payload.user.email,
  name: payload.user.name,
  role: payload.user.role,
  emailVerified: payload.user.email_verified,
});

const decodeJwtClaims = (token: string): { user_id?: string; email?: string; role?: UserRole } => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token format');
    }
    const payloadSegment = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = payloadSegment.padEnd(payloadSegment.length + (4 - (payloadSegment.length % 4)) % 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
     
    console.error('Failed to decode JWT payload', error);
    return {};
  }
};

/**
 * AuthProvider
 *
 * Provides authenticated user state, token management, and helpers
 * for email/password and Google OAuth flows.
 */
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const { showToast } = useToast();

  const applySession = useCallback((payload: AuthPayload) => {
    const nextUser = mapPayloadToAuthUser(payload);
    const tokens: ApiAuthTokens = extractTokens(payload);

    setUser(nextUser);
    setAuthTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken ?? null });
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: nextUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
      })
    );
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAuthTokens({ accessToken: null, refreshToken: null });
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setStatus('unauthenticated');
  }, []);

  const performLogout = useCallback(
    async (options?: { callApi?: boolean }) => {
      const { callApi = true } = options || {};
      try {
        if (callApi) {
          await logoutSession();
        }
      } catch {
        // Best-effort only
      } finally {
        clearSession();
      }
    },
    [clearSession]
  );

  // Configure global HTTP client handlers once.
  useEffect(() => {
    configureAuthHandlers({
      refreshFn: apiRefreshAuthTokens,
      onAuthError: () => {
        void performLogout({ callApi: false });
      },
    });
  }, [performLogout]);

  // Bootstrap session from localStorage on first mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        setStatus('unauthenticated');
        return;
      }
      const stored = JSON.parse(raw) as StoredAuthState;
      if (!stored.user || !stored.accessToken) {
        setStatus('unauthenticated');
        return;
      }
      setUser(stored.user);
      setAuthTokens({ accessToken: stored.accessToken, refreshToken: stored.refreshToken ?? null });
      setStatus('authenticated');
    } catch {
      setStatus('unauthenticated');
    }
  }, []);

  const handleLoginWithEmail = useCallback(
    async (params: { email: string; password: string }) => {
      const payload = await apiLoginWithEmail(params);
      applySession(payload);
    },
    [applySession]
  );

  const handleRegisterWithEmail = useCallback(
    async (params: { name: string; email: string; password: string }) => {
      const payload = await apiSignupWithEmail(params);
      applySession(payload);
      showToast({
        variant: 'success',
        title: 'Account created',
        description: 'Your SkyCrop account is ready. You are now signed in.',
      });
    },
    [applySession, showToast]
  );

  const handleRequestPasswordReset = useCallback(
    async (email: string) => {
      await apiRequestPasswordReset(email);
      showToast({
        variant: 'success',
        title: 'Check your inbox',
        description: 'If an account exists for this email, a reset link has been sent.',
      });
    },
    [showToast]
  );

  const handleResetPassword = useCallback(
    async (token: string, newPassword: string) => {
      await apiResetPasswordWithToken({ token, newPassword });
      showToast({
        variant: 'success',
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
      });
    },
    [showToast]
  );

  const startGoogleOAuth = useCallback((redirectTo?: string) => {
    if (redirectTo) {
      window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectTo);
    }
    window.location.href = '/api/v1/auth/google';
  }, []);

  const completeOAuthLogin = useCallback(
    async (token: string) => {
      const claims = decodeJwtClaims(token);
      if (!claims.user_id || !claims.email || !claims.role) {
        throw new Error('Invalid token returned from Google sign-in');
      }

      const derivedName = claims.email.split('@')[0] || 'Google user';
      const oauthUser: AuthUser = {
        id: claims.user_id,
        email: claims.email,
        name: derivedName,
        role: claims.role,
        emailVerified: true,
      };

      setUser(oauthUser);
      setAuthTokens({ accessToken: token, refreshToken: null });
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: oauthUser,
          accessToken: token,
          refreshToken: null,
        })
      );
      setStatus('authenticated');
    },
    []
  );

  const login = useCallback(
    (legacyUser: AuthUser) => {
      setUser(legacyUser);
      setStatus('authenticated');
    },
    []
  );

  const logout = useCallback(() => {
    void performLogout({ callApi: true });
  }, [performLogout]);

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      logout,
      hasRole,
      loginWithEmail: handleLoginWithEmail,
      registerWithEmail: handleRegisterWithEmail,
      requestPasswordReset: handleRequestPasswordReset,
      resetPassword: handleResetPassword,
      startGoogleOAuth,
      completeOAuthLogin,
    }),
    [
      user,
      status,
      login,
      logout,
      hasRole,
      handleLoginWithEmail,
      handleRegisterWithEmail,
      handleRequestPasswordReset,
      handleResetPassword,
      startGoogleOAuth,
      completeOAuthLogin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};