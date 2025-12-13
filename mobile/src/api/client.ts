/**
 * API Client - HTTP Client Configuration
 * 
 * Axios instance with interceptors for auth and error handling
 */

import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token for request:', error);
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
        // Token expired or invalid - clear auth and redirect to login
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem('skycrop_user');
        // TODO: Navigate to login screen
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
      return {
        message: axiosError.response.data?.message || 'An error occurred',
        code: axiosError.response.data?.code,
        status: axiosError.response.status,
        details: axiosError.response.data?.details,
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

