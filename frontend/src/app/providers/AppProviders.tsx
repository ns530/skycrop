import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { PropsWithChildren, useMemo } from "react";

import { AuthProvider } from "../../features/auth/context/AuthContext";
import { NotificationsProvider } from "../../shared/context/NotificationsContext";
import { UiProvider } from "../../shared/context/UiContext";
import { ToastProvider } from "../../shared/ui/Toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

type ThemeMode = "light";

interface ThemeContextValue {
  mode: ThemeMode;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

/**
 * ThemeProvider
 *
 * Light-mode only theme context stub. This can be expanded later to support
 * dark mode and user preferences.
 */
export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: "light",
    }),
    [],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
};

/**
 * AppProviders
 *
 * Composes all top-level context providers used by the application.
 * - React Query client
 * - Theme provider
 * - Auth context
 * - Toast provider
 */
export const AppProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <UiProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </UiProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
