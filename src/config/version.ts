/**
 * Application Version
 *
 * Reads version from package.json via Vite's define plugin.
 * Only update package.json when releasing new versions.
 */
declare const __APP_VERSION__: string;

export const APP_VERSION = __APP_VERSION__;
