import {
  httpClient,
  ApiError,
  normalizeApiError,
  AuthTokens as HttpAuthTokens,
} from "../../../shared/api/httpClient";

export type UserRole = "farmer" | "admin";

export interface BackendUserPublic {
  user_id: string;
  email: string;
  name: string;
  role: UserRole;
  email_verified: boolean;
}

export interface AuthPayload {
  user: BackendUserPublic;
  token: string;
  /**
   * Optional verification info (present for signup flows in MVP).
   */
  verification?: {
    token: string;
    expires_in_seconds: number;
  } | null;
  /**
   * Optional refresh token for future extension.
   * The current backend issues long-lived access tokens only; this is kept
   * as an extension point so the frontend does not need major changes if
   * refresh tokens are added.
   */
  refreshToken?: string | null;
}

export interface AuthResponseEnvelope {
  success: boolean;
  data: AuthPayload;
}

interface SuccessEnvelope {
  success: boolean;
  data?: unknown;
}

export type AuthTokens = HttpAuthTokens;

/**
 * Map backend auth payload into tokens.
 */
export const extractTokens = (payload: AuthPayload): AuthTokens => ({
  accessToken: payload.token,
  refreshToken: payload.refreshToken ?? null,
});

/**
 * Email/password signup.
 *
 * POST /api/v1/auth/signup
 */
export const signupWithEmail = async (params: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthPayload> => {
  try {
    const res = await httpClient.post<AuthResponseEnvelope>(
      "/auth/signup",
      params,
    );
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Email/password login.
 *
 * POST /api/v1/auth/login
 */
export const loginWithEmail = async (params: {
  email: string;
  password: string;
}): Promise<AuthPayload> => {
  try {
    const res = await httpClient.post<AuthResponseEnvelope>(
      "/auth/login",
      params,
    );
    return res.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Logout current session.
 *
 * POST /api/v1/auth/logout
 */
export const logoutSession = async (): Promise<void> => {
  try {
    await httpClient.post<SuccessEnvelope>("/auth/logout");
  } catch (error) {
    // Logout is best-effort; swallow network/API errors after normalization.
    const apiErr = normalizeApiError(error);
    if (apiErr instanceof ApiError) {
      console.warn("Logout failed (best-effort only):", apiErr.message);
    }
  }
};

/**
 * Request password reset email.
 *
 * POST /api/v1/auth/request-password-reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await httpClient.post<SuccessEnvelope>("/auth/request-password-reset", {
      email,
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Complete password reset using token + new password.
 *
 * POST /api/v1/auth/reset-password
 */
export const resetPasswordWithToken = async (params: {
  token: string;
  newPassword: string;
}): Promise<void> => {
  try {
    await httpClient.post<SuccessEnvelope>("/auth/reset-password", params);
  } catch (error) {
    throw normalizeApiError(error);
  }
};

/**
 * Optional token refresh.
 *
 * NOTE:
 * - The current backend issues long-lived access tokens and does not expose
 *   a refresh endpoint in the OpenAPI spec.
 * - This function is implemented as an extension point; if the backend later
 *   adds `/api/v1/auth/refresh`, it can be wired here without touching callers.
 *
 * For now this returns null, meaning "no refresh available"; the HTTP client
 * will then invoke the configured auth error handler (logout).
 */
export const refreshAuthTokens = async (
  _current: AuthTokens,
): Promise<AuthTokens | null> => {
  // Placeholder implementation: no-op refresh. The HTTP client will call the
  // configured auth error handler (logout) when this returns null.
  return null;
};
