import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import type { PaginatedResponse, ListParams } from "../../../shared/api";
import type { FieldSummary } from "../api/fieldsApi";

import { FieldsListPage } from "./FieldsListPage";

// ---- Mocks ----

// Track navigation calls
const mockedNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    // Preserve MemoryRouter and other exports, override useNavigate
    useNavigate: () => mockedNavigate,
  };
});

// Mock UiContext to observe setCurrentField calls
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

// Mock useFields to avoid real HTTP / React Query behavior
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

createWrapper.displayName = "TestFieldsWrapper";

describe("FieldsListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders fields from useFields and navigates to detail with current field set on "View"', () => {
    const params: ListParams = {
      page: 1,
      pageSize: 10,
    };

    const apiResponse: PaginatedResponse<FieldSummary> = {
      data: [
        {
          id: "field-1",
          name: "Test Field",
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

    const wrapper = createWrapper(["/fields"]);

    render(<FieldsListPage />, { wrapper });

    // Field name is rendered
    expect(screen.getByText("Test Field")).toBeInTheDocument();

    // Click the "View" action
    const viewButton = screen.getByRole("button", { name: /view/i });
    fireEvent.click(viewButton);

    // setCurrentField is called with the field id
    expect(setCurrentFieldMock).toHaveBeenCalledWith("field-1");

    // Navigation is triggered to the field detail route
    expect(mockedNavigate).toHaveBeenCalledWith("/fields/field-1");
  });
});
