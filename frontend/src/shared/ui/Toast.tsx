import clsx from 'clsx';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const next: ToastItem = {
        id,
        duration: toast.duration ?? DEFAULT_DURATION,
        ...toast,
      };

      setToasts((current) => [...current, next]);

      if (next.duration && next.duration > 0) {
        window.setTimeout(() => dismissToast(id), next.duration);
      }
    },
    [dismissToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      dismissToast,
      clearToasts,
    }),
    [toasts, showToast, dismissToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-label="Toast notifications"
        className="fixed z-50 top-4 right-4 flex flex-col gap-2 max-w-sm"
      >
        <h2 className="sr-only">Toast notifications</h2>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </section>
    </ToastContext.Provider>
  );
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const variantClasses: Record<ToastVariant, string> = {
  default: 'bg-gray-900 text-white',
  success: 'bg-status-excellent text-white',
  error: 'bg-status-poor text-white',
  warning: 'bg-status-fair text-gray-900',
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { title, description, variant = 'default' } = toast;
  const isError = variant === 'error';
  const role: 'status' | 'alert' = isError ? 'alert' : 'status';
  const ariaLive: 'polite' | 'assertive' = isError ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={clsx(
        'flex items-start gap-3 rounded-md shadow-lg px-4 py-3 text-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-blue',
        variantClasses[variant]
      )}
    >
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="mt-0.5 text-xs opacity-90">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-xs font-medium hover:bg-white/10 focus-visible:outline-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

export const useToastContext = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return ctx;
};