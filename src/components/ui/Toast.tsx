/**
 * Toast Component - Displays toast notifications
 *
 * Renders toast notifications from the toast store.
 * Positioned at the bottom center of the screen.
 */

import { memo } from 'react';
import { useToastStore, type ToastType } from '../../stores/useToastStore';
import { useThemeStore } from '../../stores/useThemeStore';

/**
 * Get toast style based on type and theme
 */
function getToastStyles(type: ToastType, isDark: boolean): string {
  switch (type) {
    case 'success':
      return isDark
        ? 'bg-emerald-600 text-white'
        : 'bg-emerald-100 border border-emerald-300 text-emerald-800';
    case 'error':
      return isDark
        ? 'bg-rose-600 text-white'
        : 'bg-rose-100 border border-rose-300 text-rose-800';
    case 'warning':
      return isDark
        ? 'bg-amber-600 text-white'
        : 'bg-amber-100 border border-amber-300 text-amber-800';
    case 'info':
    default:
      return isDark
        ? 'bg-slate-800 border border-slate-700 text-slate-300'
        : 'bg-white border border-slate-300 text-slate-700 shadow-md';
  }
}

/**
 * Close icon for dismissible toasts
 */
function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * Toast container component
 */
export const ToastContainer = memo(function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'fgdp-50';

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-2 rounded-lg shadow-lg
            flex items-center gap-2
            text-sm
            animate-fade-in
            ${getToastStyles(toast.type, isDark)}
          `}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 hover:opacity-70 rounded p-0.5"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
});
