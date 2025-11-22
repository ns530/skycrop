/**
 * Environment Configuration
 * 
 * Centralized environment variables and configuration
 */

import { Platform } from 'react-native';

// Determine API base URL based on platform and environment
const getApiBaseUrl = (): string => {
  // Development URLs
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator localhost
      return 'http://10.0.2.2:4000';
    }
    if (Platform.OS === 'ios') {
      // iOS simulator localhost
      return 'http://localhost:4000';
    }
    // Physical device - replace with your local network IP
    return 'http://192.168.1.100:4000';
  }

  // Production URL
  return 'https://api.skycrop.app';
};

export const API_BASE_URL = getApiBaseUrl();

export const config = {
  apiBaseUrl: API_BASE_URL,
  apiTimeout: 30000,
  
  // Map configuration
  mapInitialRegion: {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 2.0,
    longitudeDelta: 2.0,
  },

  // Cache configuration
  cacheExpiration: {
    fields: 300000, // 5 minutes
    weather: 360000, // 6 minutes
    health: 300000, // 5 minutes
    recommendations: 3600000, // 1 hour
  },

  // Feature flags
  features: {
    offlineMode: true,
    pushNotifications: true,
    maps: true,
    satelliteImagery: true,
  },

  // App configuration
  app: {
    name: 'SkyCrop',
    version: '0.1.0',
    buildNumber: 1,
  },
};

