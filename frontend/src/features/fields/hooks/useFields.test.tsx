import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

import type { PaginatedResponse, ListParams } from "../../../shared/api";
import { fieldKeys } from "../../../shared/query/queryKeys";
import type { FieldSummary } from "../api/fieldsApi";

import { useFields } from "./useFields";

// Mock fieldsApi so we don't hit the real HTTP layer.
jest.mock("../api/fieldsApi", () => {
  const actual = jest.requireActual("../api/fieldsApi");

  return {
    ...actual,
    listFields: jest.fn(),
  };
});

const { listFields } = jest.requireMock("../api/fieldsApi") as {
  listFields: jest.Mock;
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  const TestQueryClientWrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestQueryClientWrapper.displayName = "TestQueryClientWrapper";

  return TestQueryClientWrapper;
};

describe("useFields", () => {
  it("returns data from listFields and uses the expected query key", async () => {
    const params: ListParams = {
      page: 1,
      pageSize: 20,
      search: "paddy",
      sort: "created_at",
      order: "desc",
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
        pageSize: 20,
        total: 1,
      },
      meta: {
        source: "test",
      },
    };

    listFields.mockResolvedValue(apiResponse);

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useFields(params), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Then check data
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual(apiResponse);

    // Ensure listFields was called with provided params
    expect(listFields).toHaveBeenCalledWith(params);

    // Verify the query key and cached data in the QueryClient
    const key = fieldKeys.list(params);
    const cached =
      queryClient.getQueryData<PaginatedResponse<FieldSummary>>(key);

    expect(cached).toEqual(apiResponse);
  });
});
