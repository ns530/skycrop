import type { ListParams } from '../api';

// Centralized React Query key factories for SkyCrop.
// These keys should be used across all feature hooks to keep cache usage consistent.

export const authKeys = {
  session: ['auth', 'session'] as const,
};

export const fieldKeys = {
  all: ['fields'] as const,
  list: (params?: ListParams) => ['fields', 'list', params] as const,
  detail: (fieldId: string) => ['fields', 'detail', fieldId] as const,
};

export const healthKeys = {
  field: (fieldId: string, params: { startDate: string; endDate: string; indexType?: string }) =>
    ['health', fieldId, params] as const,
  indices: ['health', 'indices'] as const,
};

export const recommendationKeys = {
  field: (fieldId: string) => ['recommendations', fieldId] as const,
};

export const weatherKeys = {
  forecast: (lat: number, lon: number) => ['weather', 'forecast', { lat, lon }] as const,
  alerts: ['weather', 'alerts'] as const,
};

import type { YieldForecastRequest } from '../../features/yield/api/yieldApi';

export const yieldKeys = {
  forecast: (request: YieldForecastRequest) => ['yield', 'forecast', request] as const,
  history: (fieldId: string) => ['yield', 'history', fieldId] as const,
};

export const dashboardKeys = {
  metrics: ['dashboard', 'metrics'] as const,
  vegetationIndices: ['dashboard', 'vegetation-indices'] as const,
  systemMetrics: ['dashboard', 'system-metrics'] as const,
  weatherForecast: ['dashboard', 'weather-forecast'] as const,
  userAnalytics: ['dashboard', 'user-analytics'] as const,
  disasterAssessment: ['dashboard', 'disaster-assessment'] as const,
};

export const adminKeys = {
  users: (params?: ListParams) => ['admin', 'users', params] as const,
  content: (params?: ListParams) => ['admin', 'content', params] as const,
  systemStatus: ['admin', 'systemStatus'] as const,
};