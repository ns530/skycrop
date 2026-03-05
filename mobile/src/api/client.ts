/**
 * API Client - HTTP Client Configuration
 * 
 * Axios instance with interceptors for auth and error handling
 */

import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/env';

const TOKEN_KEY = 'skycrop_auth_token';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Try to get token from SecureStore first (matches AuthContext logic)
      let token = await SecureStore.getItemAsync(TOKEN_KEY);
      
      // Fallback to AsyncStorage if not found in SecureStore
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (__DEV__ && config.url?.includes('/health')) {
          console.log('[API Client] Adding auth token to health request:', config.url);
        }
      } else {
        if (__DEV__ && config.url?.includes('/health')) {
          console.warn('[API Client] No token found for health request:', config.url);
        }
      }
    } catch (error) {
      console.error('[API Client] Error getting token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // Handle specific error codes
      const status = error.response.status;

      if (status === 401) {
        const responseData = (error.response?.data || {}) as {
          error?: { code?: string; message?: string };
          code?: string;
          message?: string;
        };
        const errorCode = responseData?.error?.code || responseData?.code;
        const errorMessage = responseData?.error?.message || responseData?.message || '';
        
        // Only clear token if it's a user authentication error, not a backend service error
        // Backend service errors (like SentinelHub) have code "INTERNAL_ERROR"
        // User auth errors have code "UNAUTHORIZED" or messages like "No authorization token provided"
        const isUserAuthError = 
          errorCode === 'UNAUTHORIZED' ||
          errorMessage.includes('No authorization token provided') ||
          errorMessage.includes('Token expired') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.includes('Token invalidated') ||
          errorMessage.includes('Not authenticated');
        
        const isBackendServiceError = 
          errorCode === 'INTERNAL_ERROR' ||
          errorMessage.includes('SentinelHub') ||
          errorMessage.includes('OAuth error');
        
        if (isUserAuthError && !isBackendServiceError) {
          // Token expired or invalid - clear auth and redirect to login
          console.error('[API Client] 401 Unauthorized - User authentication failed');
          console.error('[API Client] Request URL:', error.config?.url);
          console.error('[API Client] Request method:', error.config?.method);
          console.error('[API Client] Error response:', responseData);
          
          // Clear from both storage locations (matches AuthContext logic)
          try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          } catch (e) {
            // Ignore errors if SecureStore doesn't have the key
          }
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem('skycrop_user');
          // TODO: Navigate to login screen
        } else {
          // Backend service error (e.g., SentinelHub) - don't clear user token
          console.error('[API Client] 401 from backend service - not clearing user token');
          console.error('[API Client] Error code:', errorCode);
          console.error('[API Client] Error message:', errorMessage);
          console.error('[API Client] Request URL:', error.config?.url);
        }
      }

      if (status === 403) {
        // Forbidden - insufficient permissions
        console.error('Insufficient permissions');
      }

      if (status >= 500) {
        // Server error
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response) {
      const status = axiosError.response.status;
      const responseData = axiosError.response.data;
      
      // Handle rate limiting (429)
      if (status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        const waitTime = retryAfter ? `${retryAfter} seconds` : 'a few minutes';
        return {
          message: `Too many requests. Please wait ${waitTime} before trying again.`,
          code: 'RATE_LIMIT_EXCEEDED',
          status: 429,
          details: responseData,
        };
      }
      
      // Handle backend error format: { success: false, error: { code, message, details: { errors: [...] } } }
      const errorObj = responseData?.error || responseData;
      const errorMessage = errorObj?.message || responseData?.message || 'An error occurred';
      
      // Extract validation errors if available
      const validationErrors = errorObj?.details?.errors;
      let finalMessage = errorMessage;
      
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        // Format validation errors nicely
        const formattedErrors = validationErrors
          .map((e: any) => {
            const field = e.field || e.path?.join('.') || 'field';
            // Clean up Joi error messages (remove quotes)
            const cleanMessage = e.message?.replace(/^"([^"]+)"\s+/, '$1 ') || e.message;
            return `${field}: ${cleanMessage}`;
          })
          .join('\n');
        finalMessage = formattedErrors;
      }
      
      return {
        message: finalMessage,
        code: errorObj?.code || responseData?.code,
        status: status,
        details: errorObj?.details || responseData?.details,
      };
    }

    if (axiosError.request) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
};

