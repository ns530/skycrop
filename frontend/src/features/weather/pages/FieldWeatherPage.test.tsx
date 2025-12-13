import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../../../shared/ui/Toast";
import type { FieldDetail } from "../../fields/api/fieldsApi";
import type { WeatherForecastResponse, WeatherAlert } from "../api/weatherApi";

import { FieldWeatherPage } from "./FieldWeatherPage";

// ---- Mocks ----

// Mock useParams / useNavigate to provide a stable fieldId from the route
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ fieldId: "field-1" }),
    useNavigate: () => jest.fn(),
  };
});

// Track UiContext setter calls
const setCurrentFieldMock = jest.fn();

// Mock UiContext to control currentFieldId and observe updates
jest.mock("../../../shared/context/UiContext", () => {
  return {
    useUiState: () => ({
      state: {
        currentFieldId: "field-1",
        defaultHealthIndex: "NDVI" as const,
        defaultHealthRange: "30d" as const,
      },
      setCurrentField: setCurrentFieldMock,
      setHealthIndex: jest.fn(),
      setHealthRange: jest.fn(),
    }),
  };
});

// Mock field detail hook to avoid real HTTP / React Query behavior
jest.mock("../../fields/hooks/useFields", () => {
  return {
    useFieldDetail: jest.fn(),
  };
});

// Mock weather hooks to avoid real HTTP / React Query behavior
jest.mock("../hooks", () => {
  return {
    useWeatherForecast: jest.fn(),
    useWeatherAlerts: jest.fn(),
  };
});

// Pull typed mock references after jest.mock
const { useFieldDetail } = jest.requireMock("../../fields/hooks/useFields") as {
  useFieldDetail: jest.Mock;
};

const { useWeatherForecast, useWeatherAlerts } = jest.requireMock(
  "../hooks",
) as {
  useWeatherForecast: jest.Mock;
  useWeatherAlerts: jest.Mock;
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
  (
    initialEntries: string[] = ["/fields/field-1/weather"],
  ): React.FC<{ children: React.ReactNode }> => {
  const WrapperComponent = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );
  };

  WrapperComponent.displayName = "TestWeatherWrapper";
  return WrapperComponent;
};

describe("FieldWeatherPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const fieldDetail: FieldDetail = {
      id: "field-1",
      name: "Test field",
      areaHa: 1.23,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      status: "active",
      centroidLatLon: {
        lat: 7.5,
        lon: 80.7,
      },
      // geometry is required but not used by the component in this test
      geometry: {} as unknown as FieldDetail["geometry"],
      latestHealthStatus: undefined,
      latestHealthIndex: undefined,
      latestRecommendationSummary: undefined,
    };

    useFieldDetail.mockReturnValue({
      data: fieldDetail,
      isLoading: false,
      isError: false,
    });

    const forecast: WeatherForecastResponse = {
      lat: 7.5,
      lon: 80.7,
      daily: [
        {
          date: "2025-01-01",
          minTempC: 22,
          maxTempC: 32,
          precipMm: 25, // >= 20mm triggers "Heavy rain" risk
          condition: "Heavy rain showers",
        },
        {
          date: "2025-01-02",
          minTempC: 21,
          maxTempC: 30,
          precipMm: 2,
          condition: "Partly cloudy",
        },
      ],
    };

    const alerts: WeatherAlert[] = [
      {
        id: "alert-1",
        title: "Severe rain",
        description: "Heavy rainfall expected in the next 24 hours.",
        severity: "severe",
        startTime: "2025-01-01T00:00:00.000Z",
        endTime: "2025-01-01T23:59:59.000Z",
        relatedFieldIds: ["field-1"],
      },
    ];

    useWeatherForecast.mockReturnValue({
      data: forecast,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    useWeatherAlerts.mockReturnValue({
      data: alerts,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });
  });

  it("renders forecast cards, risk indicators, and syncs UiContext current field", () => {
    const wrapper = createWrapper();

    render(<FieldWeatherPage />, { wrapper });

    // Heading
    expect(
      screen.getByRole("heading", { name: /weather/i }),
    ).toBeInTheDocument();

    // Field context
    expect(screen.getByText(/test field/i)).toBeInTheDocument();
    expect(screen.getByText(/area: 1\.23 ha/i)).toBeInTheDocument();

    // Risk badge for heavy rain day
    expect(screen.getByText(/heavy rain/i)).toBeInTheDocument();

    // Primary alert title surfaced somewhere in the banner or cards
    expect(screen.getByText(/severe rain/i)).toBeInTheDocument();

    // UiContext setCurrentField is called with the route field id
    expect(setCurrentFieldMock).toHaveBeenCalledWith("field-1");
  });
});
