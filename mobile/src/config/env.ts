/**
 * Environment Configuration
 * 
 * Centralized environment variables and configuration
 */

// Platform import removed - not used in this file

// Determine API base URL based on platform and environment
const getApiBaseUrl = (): string => {
  // Use Railway backend for both development and production
  // Note: Don't include /api/v1 here - it's added in individual API calls
  return 'https://backend-production-9e94.up.railway.app';
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

