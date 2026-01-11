/**
 * Theme Store - Zustand store for theme management
 *
 * Supports two themes named after FGDP models:
 * - FGDP-30: Light theme (white device)
 * - FGDP-50: Dark theme (black device)
 */

import { create } from 'zustand';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

/** Theme type - named after FGDP models */
export type Theme = 'fgdp-30' | 'fgdp-50';

/** Theme display names */
export const THEME_NAMES: Record<Theme, string> = {
  'fgdp-30': 'FGDP-30 (Light)',
  'fgdp-50': 'FGDP-50 (Dark)',
};

interface ThemeState {
  /** Current theme */
  theme: Theme;
}

interface ThemeActions {
  /** Set the theme */
  setTheme: (theme: Theme) => void;
  /** Toggle between themes */
  toggleTheme: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

/** Default theme */
const DEFAULT_THEME: Theme = 'fgdp-50';

/**
 * Get initial theme from localStorage or default
 */
function getInitialTheme(): Theme {
  const stored = getStorageItem<Theme>(STORAGE_KEYS.THEME, DEFAULT_THEME);
  // Validate stored value
  if (stored === 'fgdp-30' || stored === 'fgdp-50') {
    return stored;
  }
  return DEFAULT_THEME;
}

/**
 * Apply theme to document
 */
function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'fgdp-30') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
}

/**
 * Theme store
 */
export const useThemeStore = create<ThemeStore>((set, get) => {
  // Apply initial theme on store creation
  const initialTheme = getInitialTheme();
  // Defer DOM manipulation to avoid SSR issues
  if (typeof window !== 'undefined') {
    applyTheme(initialTheme);
  }

  return {
    theme: initialTheme,

    setTheme: (theme: Theme) => {
      setStorageItem(STORAGE_KEYS.THEME, theme);
      applyTheme(theme);
      set({ theme });
    },

    toggleTheme: () => {
      const current = get().theme;
      const next: Theme = current === 'fgdp-50' ? 'fgdp-30' : 'fgdp-50';
      get().setTheme(next);
    },
  };
});
