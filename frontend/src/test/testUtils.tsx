import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../shared/ui/Toast";

/**
 * Create a test QueryClient with disabled retries
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Test wrapper component that provides common providers
 * for testing React components
 */
export const TestWrapper: React.FC<{
  children: React.ReactNode;
  initialEntries?: string[];
}> = ({ children, initialEntries = ["/"] }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

/**
 * Helper function to create a wrapper for React Testing Library's render
 */
export const createWrapper = (
  initialEntries: string[] = ["/"],
): React.FC<{ children: React.ReactNode }> => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestWrapper initialEntries={initialEntries}>{children}</TestWrapper>
  );

  Wrapper.displayName = "TestWrapper";

  return Wrapper;
};

/**
 * Render helper that automatically wraps components with test providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: {
    initialEntries?: string[];
    queryClient?: QueryClient;
  },
) => {
  const { initialEntries = ["/"], queryClient = createTestQueryClient() } =
    options || {};

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

  return { Wrapper };
};

