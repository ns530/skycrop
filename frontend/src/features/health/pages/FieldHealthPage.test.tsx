import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../../../shared/ui/Toast";
import type {
  FieldHealthResponse,
  FieldHealthTimeSeries,
  HealthIndexType,
} from "../api/healthApi";

import { FieldHealthPage } from "./FieldHealthPage";

// ---- Mocks ----

// Mock useParams to provide a stable fieldId from the route
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ fieldId: "field-1" }),
  };
});

// Track UiContext setter calls
const setHealthIndexMock = jest.fn();
const setHealthRangeMock = jest.fn();

// Mock UiContext to control default index/range and observe updates
jest.mock("../../../shared/context/UiContext", () => {
  return {
    useUiState: () => ({
      state: {
        currentFieldId: "field-1",
        defaultHealthIndex: "NDVI" as const,
        defaultHealthRange: "30d" as const,
      },
      setCurrentField: jest.fn(),
      setHealthIndex: setHealthIndexMock,
      setHealthRange: setHealthRangeMock,
    }),
  };
});

// Mock hooks from health feature to avoid real HTTP / React Query behavior
jest.mock("../hooks", () => {
  const actual = jest.requireActual("../hooks");
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
const { useFieldHealth } = jest.requireMock("../hooks") as {
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
  (
    initialEntries: string[] = ["/fields/field-1/health"],
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

  WrapperComponent.displayName = "TestHealthWrapper";
  return WrapperComponent;
};

describe("FieldHealthPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders health status from summary buckets and latest index", () => {
    const series: FieldHealthTimeSeries = {
      fieldId: "field-1",
      indexType: "NDVI",
      points: [
        { date: "2025-01-01", value: 0.7 },
        { date: "2025-01-02", value: 0.8 },
      ],
    };

    const response: FieldHealthResponse = {
      summary: [
        { label: "Excellent", percentageArea: 60 },
        { label: "Fair", percentageArea: 40 },
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
    // Use getAllByRole since "field health" heading may appear multiple times
    const fieldHealthHeadings = screen.getAllByRole("heading", {
      name: /field health/i,
    });
    expect(fieldHealthHeadings.length).toBeGreaterThan(0);
    
    // "Excellent" may appear multiple times (status card and summary buckets)
    const excellentElements = screen.getAllByText("Excellent");
    expect(excellentElements.length).toBeGreaterThan(0);

    // Latest NDVI value is rendered with two decimals (may appear multiple times)
    const ndviElements = screen.getAllByText("0.80");
    expect(ndviElements.length).toBeGreaterThan(0);
    
    // Summary bucket labels (may appear multiple times)
    const fairElements = screen.getAllByText("Fair");
    expect(fairElements.length).toBeGreaterThan(0);
    const sixtyPercentElements = screen.getAllByText("60%");
    expect(sixtyPercentElements.length).toBeGreaterThan(0);
    const fortyPercentElements = screen.getAllByText("40%");
    expect(fortyPercentElements.length).toBeGreaterThan(0);
  });

  it("calls UiContext setters when range or index controls are changed", () => {
    const series: FieldHealthTimeSeries = {
      fieldId: "field-1",
      indexType: "NDVI",
      points: [{ date: "2025-01-01", value: 0.7 }],
    };

    const response: FieldHealthResponse = {
      summary: [{ label: "Excellent", percentageArea: 100 }],
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
    const rangeButton = screen.getByRole("button", { name: /14 days/i });
    fireEvent.click(rangeButton);
    expect(setHealthRangeMock).toHaveBeenCalledWith("14d");

    // Change index type to NDWI
    const indexButton = screen.getByRole("button", { name: /ndwi/i });
    fireEvent.click(indexButton);
    expect(setHealthIndexMock).toHaveBeenCalledWith("NDWI" as HealthIndexType);
  });
});
