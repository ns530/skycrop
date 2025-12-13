import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../../../shared/ui/Toast";

import { LoginPage } from "./LoginPage";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = (): React.FC<{ children: React.ReactNode }> => {
  const queryClient = createTestQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );

  return Wrapper;
};

describe("LoginPage", () => {
  it("renders heading and core form fields", () => {
    const wrapper = createWrapper();
    render(<LoginPage />, { wrapper });

    // Heading
    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();

    // Email input
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    // Password input
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Submit button
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });
});
