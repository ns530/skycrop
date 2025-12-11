import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../../../shared/ui/Toast";

import { AdminContentPage } from "./AdminContentPage";

// ---- Mocks ----

jest.mock("../hooks/useAdmin", () => {
  return {
    useAdminContent: jest.fn(),
    useUpsertAdminContent: jest.fn(),
  };
});

const { useAdminContent, useUpsertAdminContent } = jest.requireMock(
  "../hooks/useAdmin",
) as {
  useAdminContent: jest.Mock;
  useUpsertAdminContent: jest.Mock;
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = (
  initialEntries: string[] = ["/admin/content"],
): React.FC<{ children: React.ReactNode }> => {
  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe("AdminContentPage - editor behavior", () => {
  const mutateAsyncMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useAdminContent.mockReturnValue({
      data: {
        data: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
        },
        meta: {
          source: "test",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mutateAsyncMock.mockResolvedValue({
      id: "content-1",
      title: "New article",
      summary: "Short summary",
      body: "Body text",
      status: "draft",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      publishedAt: null,
    });

    useUpsertAdminContent.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isLoading: false,
    });
  });

  it("creates new content with draft status and closes editor after successful save", async () => {
    const wrapper = createWrapper();

    render(<AdminContentPage />, { wrapper });

    const newContentButton = screen.getByRole("button", {
      name: /new content/i,
    });
    fireEvent.click(newContentButton);

    const titleInput = screen.getByLabelText(/title/i);
    const summaryInput = screen.getByLabelText(/summary/i);
    const bodyInput = screen.getByLabelText(/body/i);

    fireEvent.change(titleInput, { target: { value: "New article" } });
    fireEvent.change(summaryInput, { target: { value: "Short summary" } });
    fireEvent.change(bodyInput, { target: { value: "Body text" } });

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: undefined,
      title: "New article",
      summary: "Short summary",
      body: "Body text",
      status: "draft",
    });

    await waitFor(() => {
      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    });
  });
});
