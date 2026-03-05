/**
 * Auth API - Authentication Endpoints
 * 
 * API functions for login, register, and profile management
 */

import { apiClient } from './client';
import type { User, LoginCredentials, RegisterData, LoginResponse, RegisterResponse } from '../types/auth';

// Helper to map backend user format to mobile app format
const mapUser = (backendUser: any): User => ({
  id: backendUser.user_id || backendUser.id,
  email: backendUser.email,
  name: backendUser.name,
  phone: backendUser.phone,
  role: backendUser.role || 'farmer',
  emailVerified: backendUser.email_verified || backendUser.emailVerified || false,
  profilePhotoUrl: backendUser.profile_photo_url || backendUser.profilePhotoUrl,
  location: backendUser.location,
  createdAt: backendUser.created_at || backendUser.createdAt,
  updatedAt: backendUser.updated_at || backendUser.updatedAt,
});

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      if (__DEV__) {
        console.log('[AuthAPI] Sending login request to /api/v1/auth/login');
        console.log('[AuthAPI] Email:', credentials.email);
        console.log('[AuthAPI] Password length:', credentials.password?.length);
      }
      
      const response = await apiClient.post<any>('/api/v1/auth/login', credentials);
      
      if (__DEV__) {
        console.log('[AuthAPI] Login response received:', response.status);
      }
      
      // Backend returns { success: true, data: { token, user } }
      const backendData = response.data.data || response.data;
      return {
        token: backendData.token,
        user: mapUser(backendData.user),
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AuthAPI] Login request failed');
        console.error('[AuthAPI] Status:', error?.response?.status);
        console.error('[AuthAPI] Response data:', JSON.stringify(error?.response?.data, null, 2));
        console.error('[AuthAPI] Error message:', error?.message);
        
        // Log validation errors if available
        const validationErrors = error?.response?.data?.error?.details?.errors;
        if (Array.isArray(validationErrors)) {
          console.error('[AuthAPI] Validation errors:', validationErrors);
        }
      }
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<any>('/api/v1/auth/signup', data);
    // Backend returns { success: true, data: { token, user } }
    const backendData = response.data.data || response.data;
    return {
      token: backendData.token,
      user: mapUser(backendData.user),
    };
  },

  /**
   * Get user profile
   * Note: Backend doesn't have a profile endpoint, so we'll use the user data from the token
   * This is a placeholder - the user data is already available after login/signup
   */
  getProfile: async (_token: string): Promise<User> => {
    // For now, return a promise that rejects since there's no profile endpoint
    // The user data should be stored locally after login/signup
    throw new Error('Profile endpoint not available. User data is stored locally after login.');
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
    await apiClient.post('/api/v1/auth/request-password-reset', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/api/v1/auth/reset-password', {
      token,
      newPassword,
    });
  },
};

