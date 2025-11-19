import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { Recommendation } from '../api/recommendationApi';

import { FieldRecommendationsPage } from './FieldRecommendationsPage';

// ---- Mocks ----

// Mock useParams / useNavigate to provide a stable fieldId from the route
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ fieldId: 'field-1' }),
    useNavigate: () => jest.fn(),
  };
});

// Track UiContext setter calls
const setCurrentFieldMock = jest.fn();

// Mock UiContext to control currentFieldId and observe updates
jest.mock('../../../shared/context/UiContext', () => {
  return {
    useUiState: () => ({
      state: {
        currentFieldId: 'field-1',
        defaultHealthIndex: 'NDVI' as const,
        defaultHealthRange: '30d' as const,
      },
      setCurrentField: setCurrentFieldMock,
      setHealthIndex: jest.fn(),
      setHealthRange: jest.fn(),
    }),
  };
});

// Mock recommendations hooks to avoid real HTTP / React Query behavior
jest.mock('../hooks', () => {
  return {
    useRecommendations: jest.fn(),
    useApplyRecommendation: jest.fn(),
  };
});

// Pull typed mock references after jest.mock
const { useRecommendations, useApplyRecommendation } = jest.requireMock('../hooks') as {
  useRecommendations: jest.Mock;
  useApplyRecommendation: jest.Mock;
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
  (initialEntries: string[] = ['/fields/field-1/recommendations']): React.FC<{ children: React.ReactNode }> =>
  ({ children }) => {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

describe('FieldRecommendationsPage', () => {
  const mutateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default hook mocks
    const recommendations: Recommendation[] = [
      {
        id: 'rec-1',
        fieldId: 'field-1',
        title: 'Irrigate north block',
        description: 'Apply 20mm irrigation in next 24h.',
        status: 'overdue',
        priority: 'high',
        recommendedAt: '2025-01-01T00:00:00.000Z',
        applyBefore: '2025-01-02T00:00:00.000Z',
        appliedAt: undefined,
        weatherHint: 'Apply before heavy rain.',
      },
      {
        id: 'rec-2',
        fieldId: 'field-1',
        title: 'Fertilize south block',
        description: 'Apply NPK mix next week.',
        status: 'applied',
        priority: 'medium',
        recommendedAt: '2025-01-03T00:00:00.000Z',
        applyBefore: undefined,
        appliedAt: '2025-01-04T00:00:00.000Z',
        weatherHint: undefined,
      },
    ];

    useRecommendations.mockReturnValue({
      data: recommendations,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    useApplyRecommendation.mockReturnValue({
      mutate: mutateMock,
    });
  });

  it('renders recommendations and wires apply mutation and UiContext correctly', () => {
    const wrapper = createWrapper();

    render(<FieldRecommendationsPage />, { wrapper });

    // Heading
    expect(
      screen.getByRole('heading', { name: /recommendations/i }),
    ).toBeInTheDocument();

    // Status / priority labels from RecommendationCard
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText(/history/i)).toBeInTheDocument();

    // "Mark as applied" button for active item (overdue / planned)
    const applyButton = screen.getByRole('button', {
      name: /mark recommendation "irrigate north block" as applied/i,
    });
    expect(applyButton).toBeInTheDocument();

    // Click apply and ensure mutation called with fieldId and appliedAt
    fireEvent.click(applyButton);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const firstCallArgs = mutateMock.mock.calls[0];

    expect(firstCallArgs[0]).toMatchObject({
      id: 'rec-1',
      fieldId: 'field-1',
    });
    expect(firstCallArgs[0].payload.appliedAt).toEqual(expect.any(String));

    // Ensure UiContext setCurrentField is called with the route field id
    expect(setCurrentFieldMock).toHaveBeenCalledWith('field-1');
  });
});