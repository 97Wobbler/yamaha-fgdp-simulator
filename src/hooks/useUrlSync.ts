/**
 * useUrlSync Hook
 *
 * Syncs pattern state to URL in real-time with debouncing.
 * - Updates URL whenever pattern changes
 * - Uses 500ms debounce to avoid excessive URL updates
 * - Does not trigger on initial load (prevents overwriting shared URL)
 */

import { useEffect, useRef } from 'react';
import { usePatternStore } from '../stores/usePatternStore';
import { encodePattern } from '../utils/patternUrl';

/** Debounce delay in milliseconds */
const DEBOUNCE_MS = 500;

/**
 * Hook to sync pattern changes to URL
 * Call this once in App component
 */
export function useUrlSync(): void {
  const currentPattern = usePatternStore((state) => state.currentPattern);
  const urlCheckComplete = usePatternStore((state) => state.urlCheckComplete);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Wait until URL check is complete
    if (!urlCheckComplete) return;

    // Skip the first run after URL check (initial load)
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce URL update
    timeoutRef.current = setTimeout(() => {
      if (!currentPattern) {
        // No pattern - clear URL param
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('pattern')) {
          urlParams.delete('pattern');
          const newUrl = urlParams.toString()
            ? `${window.location.pathname}?${urlParams.toString()}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
        return;
      }

      // Encode pattern
      const encoded = encodePattern(currentPattern);
      if (!encoded) {
        return;
      }

      // Update URL without page reload
      const newUrl = `${window.location.pathname}?pattern=${encoded}`;
      window.history.replaceState({}, '', newUrl);
    }, DEBOUNCE_MS);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPattern, urlCheckComplete]);
}
