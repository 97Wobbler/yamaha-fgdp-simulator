/**
 * Toast Store - Zustand store for toast notification management
 *
 * Provides a simple toast notification system with auto-dismiss.
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  /** Show a toast notification */
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  /** Remove a specific toast by id */
  removeToast: (id: string) => void;
  /** Clear all toasts */
  clearToasts: () => void;
}

type ToastStore = ToastState & ToastActions;

/** Default toast duration in milliseconds */
const DEFAULT_DURATION = 3000;

/**
 * Toast store for managing notifications
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto-dismiss after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));
