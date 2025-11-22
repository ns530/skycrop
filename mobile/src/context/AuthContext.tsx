/**
 * AuthContext - Authentication State Management
 * 
 * Provides authentication state and methods across the mobile app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { authApi } from '../api/authApi';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'skycrop_auth_token';
const USER_KEY = 'skycrop_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      
      // Try to get token from secure storage first
      const credentials = await Keychain.getGenericPassword();
      let storedToken = credentials ? credentials.password : null;
      
      // Fallback to AsyncStorage
      if (!storedToken) {
        storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      }

      if (storedToken) {
        setToken(storedToken);
        
        // Load user data
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
        }

        // Verify token is still valid by fetching user profile
        try {
          const profile = await authApi.getProfile(storedToken);
          setUser(profile);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
        } catch (error) {
          // Token invalid, clear auth
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (newToken: string, newUser: User) => {
    try {
      // Save to secure storage (preferred)
      await Keychain.setGenericPassword(USER_KEY, newToken);
      
      // Also save to AsyncStorage as backup
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      await Keychain.resetGenericPassword();
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      await saveAuth(response.token, response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      await saveAuth(response.token, response.user);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API call fails
    } finally {
      await clearAuth();
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const profile = await authApi.getProfile(token);
      setUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

