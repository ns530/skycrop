import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import type { PaginatedResponse, ListParams } from "../../../shared/api";
import type { FieldSummary } from "../api/fieldsApi";

import { FieldsListPage } from "./FieldsListPage";

// ---- Mocks ----

// Track navigation calls (not asserted here, but keeps parity with other tests)
const mockedNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock UiContext
const setCurrentFieldMock = jest.fn();

jest.mock("../../../shared/context/UiContext", () => {
  return {
    useUiState: () => ({
      state: {
        currentFieldId: undefined,
        defaultHealthIndex: "NDVI" as const,
        defaultHealthRange: "30d" as const,
      },
      setCurrentField: setCurrentFieldMock,
      setHealthIndex: jest.fn(),
      setHealthRange: jest.fn(),
    }),
  };
});

// Mock online status
const useOnlineStatusMock = jest.fn();

jest.mock("../../../shared/hooks/useOnlineStatus", () => {
  return {
    useOnlineStatus: () => useOnlineStatusMock(),
  };
});

// Mock useFields
jest.mock("../hooks/useFields", () => {
  const actual = jest.requireActual("../hooks/useFields");
  return {
    ...actual,
    useFields: jest.fn(),
  };
});

const { useFields } = jest.requireMock("../hooks/useFields") as {
  useFields: jest.Mock;
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
    initialEntries: string[] = ["/fields"],
  ): React.FC<{ children: React.ReactNode }> =>
  ({ children }) => {
    const queryClient = createTestQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

createWrapper.displayName = "TestLoadingWrapper";

describe("FieldsListPage loading/error/offline states", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows LoadingState while fields are loading", () => {
    useOnlineStatusMock.mockReturnValue({ isOnline: true });

    useFields.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    const wrapper = createWrapper();

    render(<FieldsListPage />, { wrapper });

    expect(screen.getByText(/loading fields/i)).toBeInTheDocument();
  });

  it("renders ErrorState and calls refetch on Retry", () => {
    const refetchMock = jest.fn();
    useOnlineStatusMock.mockReturnValue({ isOnline: true });

    useFields.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed"),
      refetch: refetchMock,
      isFetching: false,
    });

    const wrapper = createWrapper();

    render(<FieldsListPage />, { wrapper });

    expect(screen.getByText(/unable to load your fields/i)).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows offline hint when offline with cached data", () => {
    useOnlineStatusMock.mockReturnValue({ isOnline: false });

    const params: ListParams = {
      page: 1,
      pageSize: 10,
    };

    const apiResponse: PaginatedResponse<FieldSummary> = {
      data: [
        {
          id: "field-1",
          name: "Offline Field",
          areaHa: 1.23,
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-02T00:00:00.000Z",
          status: "active",
          centroidLatLon: {
            lat: 7.05,
            lon: 80.05,
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
      },
      meta: {
        source: "test",
      },
    };

    useFields.mockReturnValue({
      data: apiResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    const wrapper = createWrapper();

    render(<FieldsListPage />, { wrapper });

    expect(
      screen.getByText(/you are offline\. showing the last loaded data\./i),
    ).toBeInTheDocument();
  });
});
