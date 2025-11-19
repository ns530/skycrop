import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import type {
  FieldHealthResponse,
  FieldHealthTimeSeries,
  HealthIndexType,
} from '../api/healthApi';

import { FieldHealthPage } from './FieldHealthPage';

// ---- Mocks ----

// Mock useParams to provide a stable fieldId from the route
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ fieldId: 'field-1' }),
  };
});

// Track UiContext setter calls
const setHealthIndexMock = jest.fn();
const setHealthRangeMock = jest.fn();

// Mock UiContext to control default index/range and observe updates
jest.mock('../../../shared/context/UiContext', () => {
  return {
    useUiState: () => ({
      state: {
        currentFieldId: 'field-1',
        defaultHealthIndex: 'NDVI' as const,
        defaultHealthRange: '30d' as const,
      },
      setCurrentField: jest.fn(),
      setHealthIndex: setHealthIndexMock,
      setHealthRange: setHealthRangeMock,
    }),
  };
});

// Mock hooks from health feature to avoid real HTTP / React Query behavior
jest.mock('../hooks', () => {
  const actual = jest.requireActual('../hooks');
  return {
    ...actual,
    useFieldHealth: jest.fn(),
    useHealthIndicesMetadata: jest.fn().mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    }),
  };
});

// Pull typed mock references after jest.mock
const { useFieldHealth } = jest.requireMock('../hooks') as {
  useFieldHealth: jest.Mock;
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper =
  (initialEntries: string[] = ['/fields/field-1/health']): React.FC<{ children: React.ReactNode }> =>
  ({ children }) => {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

describe('FieldHealthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders health status from summary buckets and latest index', () => {
    const series: FieldHealthTimeSeries = {
      fieldId: 'field-1',
      indexType: 'NDVI',
      points: [
        { date: '2025-01-01', value: 0.7 },
        { date: '2025-01-02', value: 0.8 },
      ],
    };

    const response: FieldHealthResponse = {
      summary: [
        { label: 'Excellent', percentageArea: 60 },
        { label: 'Fair', percentageArea: 40 },
      ],
      timeSeries: [series],
      latestIndex: 0.8,
    };

    useFieldHealth.mockReturnValue({
      data: response,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    const wrapper = createWrapper();

    render(<FieldHealthPage />, { wrapper });

    // Status card shows "Excellent" based on dominant summary bucket
    expect(
      screen.getByRole('heading', { name: /field health/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();

    // Latest NDVI value is rendered with two decimals
    expect(screen.getByText('0.80')).toBeInTheDocument();

    // Summary buckets render expected labels and percentages
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('calls UiContext setters when range or index controls are changed', () => {
    const series: FieldHealthTimeSeries = {
      fieldId: 'field-1',
      indexType: 'NDVI',
      points: [{ date: '2025-01-01', value: 0.7 }],
    };

    const response: FieldHealthResponse = {
      summary: [{ label: 'Excellent', percentageArea: 100 }],
      timeSeries: [series],
      latestIndex: 0.7,
    };

    useFieldHealth.mockReturnValue({
      data: response,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    const wrapper = createWrapper();

    render(<FieldHealthPage />, { wrapper });

    // Change date range to 14 days
    const rangeButton = screen.getByRole('button', { name: /14 days/i });
    fireEvent.click(rangeButton);
    expect(setHealthRangeMock).toHaveBeenCalledWith('14d');

    // Change index type to NDWI
    const indexButton = screen.getByRole('button', { name: /ndwi/i });
    fireEvent.click(indexButton);
    expect(setHealthIndexMock).toHaveBeenCalledWith('NDWI' as HealthIndexType);
  });
});