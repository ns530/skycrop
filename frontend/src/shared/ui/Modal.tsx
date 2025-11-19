import clsx from 'clsx';
import React, { useEffect, useRef, useId } from 'react';
import ReactDOM from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

/**
 * Modal
 *
 * Accessible modal dialog with basic focus management.
 * - Uses a React portal into document.body
 * - Uses role="dialog" aria-modal="true" and aria-labelledby for the title
 * - Traps focus within the dialog while open
 * - Restores focus to the previously focused element on close
 * - Handles Escape to close
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const dialogEl = dialogRef.current;

    const focusFirstElement = () => {
      if (!dialogEl) return;

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter((el) => !el.hasAttribute('data-focus-guard'));

      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogEl.focus();
      }
    };

    focusFirstElement();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      if (!dialogEl) return;

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>(focusableSelectors),
      ).filter((el) => !el.hasAttribute('data-focus-guard'));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!current || current === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!current || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (typeof document === 'undefined') {
    return null;
  }

  return ReactDOM.createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={clsx(
          'w-full max-w-lg rounded-lg bg-white shadow-xl outline-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2',
        )}
        tabIndex={-1}
         
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 id={titleId} className="text-sm font-semibold text-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              aria-label="Close dialog"
            >
              ×
            </button>
          </header>
        )}
        <div className="px-4 py-4 text-sm text-gray-800">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;