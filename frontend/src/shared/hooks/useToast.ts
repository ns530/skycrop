import { useCallback } from "react";

import { useToastContext } from "../ui/Toast";

export interface ShowToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  duration?: number;
}

/**
 * useToast
 *
 * Lightweight hook that exposes a simple API to trigger toasts
 * from anywhere in the app. Currently non-persistent and
 * in-memory only.
 */
export const useToast = () => {
  const { showToast, dismissToast, clearToasts, toasts } = useToastContext();

  const notify = useCallback(
    (options: ShowToastOptions) => {
      showToast(options);
    },
    [showToast],
  );

  return {
    toasts,
    showToast: notify,
    dismissToast,
    clearToasts,
  };
};
