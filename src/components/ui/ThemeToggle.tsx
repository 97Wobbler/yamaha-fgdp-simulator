/**
 * ThemeToggle Component
 *
 * Toggle button for switching between FGDP-30 (light) and FGDP-50 (dark) themes.
 */

import { memo } from 'react';
import { useThemeStore } from '../../stores/useThemeStore';

/**
 * Sun icon for light theme
 */
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

/**
 * Moon icon for dark theme
 */
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

export const ThemeToggle = memo(function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isDark = theme === 'fgdp-50';
  const currentLabel = isDark ? 'Dark Theme (FGDP-50)' : 'Light Theme (FGDP-30)';
  const nextLabel = isDark ? 'Light Theme (FGDP-30)' : 'Dark Theme (FGDP-50)';

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center
        w-9 h-9 rounded-lg
        transition-colors border
        ${isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
        }
      `}
      title={`${currentLabel} — Click to switch to ${nextLabel}`}
      aria-label={`Current: ${currentLabel}. Click to switch.`}
    >
      {isDark ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
    </button>
  );
});
