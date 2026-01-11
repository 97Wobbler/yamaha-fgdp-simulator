/**
 * LocalStorage Utility Module
 *
 * Provides type-safe localStorage access with JSON serialization.
 * Designed for extensibility - add new storage keys as needed.
 */

/** Storage key definitions */
export const STORAGE_KEYS = {
  THEME: 'fgdp-theme',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Get a value from localStorage
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns Parsed value or default
 */
export function getStorageItem<T>(key: StorageKey, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a value in localStorage
 * @param key Storage key
 * @param value Value to store (will be JSON serialized)
 */
export function setStorageItem<T>(key: StorageKey, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage might be full or disabled
    console.warn(`Failed to save to localStorage: ${key}`);
  }
}

/**
 * Remove a value from localStorage
 * @param key Storage key
 */
export function removeStorageItem(key: StorageKey): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}
