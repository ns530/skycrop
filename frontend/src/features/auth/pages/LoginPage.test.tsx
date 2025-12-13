import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { ToastProvider } from "../../../shared/ui/Toast";

import { LoginPage } from "./LoginPage";

// Mock useAuth to avoid requiring AuthProvider
jest.mock("../context/AuthContext", () => {
  return {
    useAuth: jest.fn(),
  };
});

const { useAuth } = jest.requireMock("../context/AuthContext") as {
  useAuth: jest.Mock;
};

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
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useAuth to return required functions
    useAuth.mockReturnValue({
      loginWithEmail: jest.fn(),
      startGoogleOAuth: jest.fn(),
      status: "unauthenticated",
      user: null,
    });
  });

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
