import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiErrorPayload {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown> | null;
  };
}

export class ApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown> | null;

  constructor(message: string, status?: number, code?: string, details?: Record<string, unknown> | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details ?? null;
  }
}

export interface AuthTokens {
  accessToken: string | null;
  refreshToken?: string | null;
}

type RefreshFn = (currentTokens: AuthTokens) => Promise<AuthTokens | null>;
type AuthErrorHandler = () => void;

interface InternalAuthState {
  tokens: AuthTokens;
  isRefreshing: boolean;
  refreshPromise: Promise<AuthTokens | null> | null;
  refreshFn: RefreshFn | null;
  onAuthError: AuthErrorHandler | null;
}

const authState: InternalAuthState = {
  tokens: { accessToken: null, refreshToken: null },
  isRefreshing: false,
  refreshPromise: null,
  refreshFn: null,
  onAuthError: null,
};

/**
 * Configure global auth tokens used by the HTTP client.
 * Call this from the auth context whenever tokens change.
 */
export const setAuthTokens = (tokens: AuthTokens) => {
  authState.tokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
  };
};

/**
 * Register an optional async refresh function and auth error handler.
 * - refreshFn: called on 401 responses to attempt token refresh
 * - onAuthError: called when refresh fails or is not available (should logout)
 */
export const configureAuthHandlers = (handlers: { refreshFn?: RefreshFn; onAuthError?: AuthErrorHandler }) => {
  authState.refreshFn = handlers.refreshFn ?? null;
  authState.onAuthError = handlers.onAuthError ?? null;
};

const apiBaseURL = '/api/v1';

const httpClient: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: false,
});

/**
 * Attach Authorization header if we have an access token.
 */
httpClient.interceptors.request.use((config: AxiosRequestConfig) => {
  if (authState.tokens.accessToken && config.headers) {
     
    config.headers.Authorization = `Bearer ${authState.tokens.accessToken}`;
  }
  return config;
});

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  /** Internal flag used to avoid infinite refresh loops */
  _retry?: boolean;
}

/**
 * Attempt to refresh tokens if:
 * - response is 401
 * - we have a refresh function and (optionally) a refresh token
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry | undefined;
    const status = error.response?.status;

    if (!originalRequest) {
      return Promise.reject(normalizeApiError(error));
    }

    const isUnauthorized = status === 401;
    const canAttemptRefresh = Boolean(authState.refreshFn && authState.tokens.refreshToken);

    if (!isUnauthorized || !canAttemptRefresh) {
      if (isUnauthorized && authState.onAuthError) {
        authState.onAuthError();
      }
      return Promise.reject(normalizeApiError(error));
    }

    if (originalRequest._retry) {
      // Already retried once; avoid infinite loop.
      if (authState.onAuthError) {
        authState.onAuthError();
      }
      return Promise.reject(normalizeApiError(error));
    }

    originalRequest._retry = true;

    try {
      if (!authState.isRefreshing) {
        authState.isRefreshing = true;
        authState.refreshPromise = authState.refreshFn!(authState.tokens)
          .then((nextTokens) => {
            authState.isRefreshing = false;
            authState.refreshPromise = null;

            if (!nextTokens || !nextTokens.accessToken) {
              return null;
            }

            setAuthTokens(nextTokens);
            return nextTokens;
          })
          .catch(() => {
            authState.isRefreshing = false;
            authState.refreshPromise = null;
            return null;
          });
      }

      const refreshed = await authState.refreshPromise!;
      if (!refreshed || !refreshed.accessToken) {
        if (authState.onAuthError) {
          authState.onAuthError();
        }
        return Promise.reject(normalizeApiError(error));
      }

      // Re-run original request with new token.
      // Cast here to avoid strict typing issues on headers.
      const retriedConfig = originalRequest as AxiosRequestConfig & {
        headers?: Record<string, unknown>;
      };

      if (!retriedConfig.headers) {
        retriedConfig.headers = {};
      }

      retriedConfig.headers.Authorization = `Bearer ${refreshed.accessToken}`;

      return httpClient(retriedConfig);
    } catch (_e) {
      if (authState.onAuthError) {
        authState.onAuthError();
      }
      return Promise.reject(normalizeApiError(error));
    }
  }
);

/**
 * Normalize Axios/HTTP errors into a consistent ApiError instance.
 */
export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    const status = axiosError.response?.status;
    const payload = axiosError.response?.data;
    const code = payload?.error?.code;
    const message =
      payload?.error?.message ??
      axiosError.message ??
      (status ? `Request failed with status ${status}` : 'Request failed');

    return new ApiError(message, status, code, payload?.error?.details ?? null);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unexpected error occurred');
};

export { httpClient };