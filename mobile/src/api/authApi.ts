/**
 * Auth API - Authentication Endpoints
 * 
 * API functions for login, register, and profile management
 */

import { apiClient } from './client';
import type { User, LoginCredentials, RegisterData, LoginResponse, RegisterResponse } from '../types/auth';

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Get user profile
   */
  getProfile: async (token: string): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (token: string): Promise<void> => {
    await apiClient.post(
      '/api/v1/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/api/v1/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/api/v1/auth/reset-password', {
      token,
      password: newPassword,
    });
  },
};

