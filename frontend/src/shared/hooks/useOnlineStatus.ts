import { useEffect, useState } from "react";

export interface OnlineStatus {
  isOnline: boolean;
}

/**
 * useOnlineStatus
 *
 * Lightweight hook that tracks the browser's online/offline status.
 * - Uses navigator.onLine when available
 * - Listens to "online" / "offline" window events
 * - Defaults to "online" during SSR or when the API is unavailable
 */
const getInitialOnlineStatus = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine ?? true;
};

export const useOnlineStatus = (): OnlineStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    getInitialOnlineStatus(),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
};
