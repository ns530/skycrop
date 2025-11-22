/**
 * Test Helpers and Utilities
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';

/**
 * Create a fresh QueryClient for each test
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress errors in tests
    },
  });

/**
 * Wrapper with all providers
 */
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const AllProviders: React.FC<AllProvidersProps> = ({ children, queryClient }) => {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <NavigationContainer>{children}</NavigationContainer>
    </QueryClientProvider>
  );
};

/**
 * Custom render function with all providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: ({ children }) => <AllProviders>{children}</AllProviders>,
    ...options,
  });
};

/**
 * Wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 3000
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

/**
 * Mock field data generator
 */
export const createMockField = (overrides = {}) => ({
  field_id: '1',
  user_id: 'user-123',
  name: 'Test Field',
  boundary: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [74.3587, 31.5204],
        [74.3687, 31.5204],
        [74.3687, 31.5304],
        [74.3587, 31.5304],
        [74.3587, 31.5204],
      ],
    ],
  },
  area_sqm: 55000,
  area_ha: 5.5,
  center: { type: 'Point' as const, coordinates: [74.3637, 31.5254] },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  status: 'active' as const,
  ...overrides,
});

/**
 * Mock field summary generator
 */
export const createMockFieldSummary = (overrides = {}) => ({
  field_id: '1',
  name: 'Test Field',
  area_ha: 5.5,
  health_status: 'good' as const,
  health_score: 85,
  last_health_update: '2024-01-15T10:30:00Z',
  center: { type: 'Point' as const, coordinates: [74.3637, 31.5254] },
  ...overrides,
});

/**
 * Mock health analysis generator
 */
export const createMockHealthAnalysis = (overrides = {}) => ({
  id: 1,
  field_id: 1,
  analysis_date: '2024-01-15T00:00:00Z',
  ndvi_mean: 0.75,
  ndvi_min: 0.45,
  ndvi_max: 0.95,
  ndvi_std: 0.12,
  health_score: 85,
  health_status: 'good' as const,
  vegetation_cover_percentage: 87.5,
  stress_areas_count: 2,
  stress_areas_percentage: 5.3,
  recommendations: ['Increase irrigation in stressed areas', 'Monitor pest activity'],
  alerts: [],
  satellite_image_url: 'https://example.com/satellite.jpg',
  ndvi_image_url: 'https://example.com/ndvi.jpg',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

/**
 * Mock recommendation generator
 */
export const createMockRecommendation = (overrides = {}) => ({
  id: 1,
  field_id: 1,
  recommendation_date: '2024-01-15T00:00:00Z',
  category: 'irrigation' as const,
  priority: 'high' as const,
  title: 'Increase Irrigation',
  description: 'Field shows signs of water stress in southern section.',
  reasoning: 'NDVI analysis indicates reduced vegetation health.',
  expected_impact: 'Improved crop health and yield by 10-15%',
  estimated_cost: 500,
  implementation_timeframe: '2-3 days',
  status: 'pending' as const,
  confidence_score: 0.87,
  data_sources: ['NDVI', 'Weather', 'Soil Moisture'],
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

/**
 * Mock yield prediction generator
 */
export const createMockYieldPrediction = (overrides = {}) => ({
  id: 1,
  field_id: 1,
  prediction_date: '2024-01-15T00:00:00Z',
  crop_type: 'Wheat',
  predicted_yield: 27.5,
  predicted_yield_per_hectare: 5.0,
  confidence_score: 0.82,
  confidence_interval_lower: 25.0,
  confidence_interval_upper: 30.0,
  prediction_method: 'Random Forest Regression',
  factors_considered: ['NDVI', 'Weather', 'Soil Type', 'Planting Date'],
  harvest_date_estimate: '2024-05-15T00:00:00Z',
  quality_estimate: 'good' as const,
  risk_factors: ['Late season drought risk', 'Potential pest pressure'],
  recommendations: ['Apply fertilizer in week 8', 'Monitor for pests'],
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
});

/**
 * Mock API error generator
 */
export const createMockApiError = (statusCode = 500, message = 'Server error') => ({
  response: {
    status: statusCode,
    data: {
      error: message,
    },
  },
  message,
});

/**
 * Mock navigation object
 */
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
});

/**
 * Mock route object
 */
export const createMockRoute = (params = {}) => ({
  key: 'test-route-key',
  name: 'TestScreen',
  params,
});

