/**
 * useUrlPatternLoader Hook
 *
 * Story 4.3: URL Pattern Loading
 * - Loads pattern from URL query parameter on app mount
 * - Returns error state for invalid patterns
 */

import { useState, useEffect } from 'react';
import { decodePattern } from '../utils/patternUrl';
import { usePatternStore } from '../stores/usePatternStore';

interface UrlPatternLoaderResult {
  /** Error message if loading failed */
  error: string | null;
  /** Whether pattern was loaded from URL */
  loaded: boolean;
  /** Whether URL check is complete (regardless of result) */
  urlCheckComplete: boolean;
  /** Clear the error message */
  clearError: () => void;
}

/**
 * Hook to load pattern from URL on mount
 *
 * Looks for ?pattern=ENCODED_STRING in the URL
 * If found, decodes and loads into pattern store
 * If invalid, sets error state
 */
export function useUrlPatternLoader(): UrlPatternLoaderResult {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const setPattern = usePatternStore((state) => state.setPattern);
  const setUrlCheckComplete = usePatternStore((state) => state.setUrlCheckComplete);
  const urlCheckComplete = usePatternStore((state) => state.urlCheckComplete);

  useEffect(() => {
    // Only run once on mount
    const urlParams = new URLSearchParams(window.location.search);
    const encodedPattern = urlParams.get('pattern');

    if (!encodedPattern) {
      // No pattern param - normal start
      setUrlCheckComplete(true);
      return;
    }

    // Try to decode pattern
    const pattern = decodePattern(encodedPattern);

    if (pattern) {
      // Successfully decoded - load into store
      setPattern(pattern);
      setLoaded(true);

      // Clean up URL (remove pattern param)
      urlParams.delete('pattern');
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else {
      // Failed to decode - show error
      setError('Invalid pattern URL');
    }

    setUrlCheckComplete(true);
  }, [setPattern, setUrlCheckComplete]);

  const clearError = () => setError(null);

  return { error, loaded, urlCheckComplete, clearError };
}
