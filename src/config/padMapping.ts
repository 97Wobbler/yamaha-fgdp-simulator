/**
 * FGDP-50 Pad Mapping Configuration
 *
 * Complete mapping of all 18 pads for the Step Sequencer system.
 * Includes pad information, display labels, and default finger designations.
 */

import type { FingerDesignation } from '../types/pattern';

/**
 * Pad information structure for the Step Sequencer
 */
export interface PadInfo {
  /** Unique pad identifier */
  id: string;
  /** Display label for UI */
  label: string;
  /** Short label for compact display */
  shortLabel: string;
  /** Row position in the grid (1-5) */
  row: number;
  /** Whether this is a "long bar" pad (snare, kick) that supports L/R highlighting */
  isLongBar: boolean;
}

/**
 * Complete list of FGDP-50 pad IDs in display order (top to bottom, left to right)
 */
export const PAD_IDS = [
  'crash_l',
  'hihat_close_l',
  'hihat_open',
  'hihat_close_r',
  'crash_r',
  'ride_cup',
  'snare',
  'ride_bow',
  'tom_low_l',
  'tom_mid_l',
  'tom_high_l',
  'snare_rim_open',
  'tom_high_r',
  'tom_mid_r',
  'tom_low_r',
  'snare_rim_closed',
  'kick',
  'splash',
] as const;

export type PadId = (typeof PAD_IDS)[number];

/**
 * Complete pad information for all 18 FGDP-50 pads
 */
export const PADS: Record<PadId, PadInfo> = {
  crash_l: { id: 'crash_l', label: 'Crash L', shortLabel: 'CrL', row: 1, isLongBar: false },
  hihat_close_l: { id: 'hihat_close_l', label: 'Hi-hat L', shortLabel: 'HHL', row: 1, isLongBar: false },
  hihat_open: { id: 'hihat_open', label: 'Hi-hat Open', shortLabel: 'HHO', row: 1, isLongBar: false },
  hihat_close_r: { id: 'hihat_close_r', label: 'Hi-hat R', shortLabel: 'HHR', row: 1, isLongBar: false },
  crash_r: { id: 'crash_r', label: 'Crash R', shortLabel: 'CrR', row: 1, isLongBar: false },
  ride_cup: { id: 'ride_cup', label: 'Ride Cup', shortLabel: 'RdC', row: 2, isLongBar: false },
  ride_bow: { id: 'ride_bow', label: 'Ride Bow', shortLabel: 'RdB', row: 2, isLongBar: false },
  snare: { id: 'snare', label: 'Snare', shortLabel: 'Snr', row: 2, isLongBar: true },
  tom_low_l: { id: 'tom_low_l', label: 'Low Tom L', shortLabel: 'LTL', row: 3, isLongBar: false },
  tom_mid_l: { id: 'tom_mid_l', label: 'Mid Tom L', shortLabel: 'MTL', row: 3, isLongBar: false },
  tom_high_l: { id: 'tom_high_l', label: 'Hi Tom L', shortLabel: 'HTL', row: 3, isLongBar: false },
  snare_rim_open: { id: 'snare_rim_open', label: 'Rim Open', shortLabel: 'RmO', row: 3, isLongBar: false },
  tom_high_r: { id: 'tom_high_r', label: 'Hi Tom R', shortLabel: 'HTR', row: 3, isLongBar: false },
  tom_mid_r: { id: 'tom_mid_r', label: 'Mid Tom R', shortLabel: 'MTR', row: 3, isLongBar: false },
  tom_low_r: { id: 'tom_low_r', label: 'Low Tom R', shortLabel: 'LTR', row: 3, isLongBar: false },
  snare_rim_closed: { id: 'snare_rim_closed', label: 'Rim Closed', shortLabel: 'RmC', row: 4, isLongBar: false },
  kick: { id: 'kick', label: 'Kick', shortLabel: 'Kck', row: 4, isLongBar: true },
  splash: { id: 'splash', label: 'Splash', shortLabel: 'Spl', row: 4, isLongBar: false },
};

/**
 * Default finger designation for each pad.
 * Based on Architecture document mapping rules:
 * - Left pads (_l suffix) → Left hand (L)
 * - Right pads (_r suffix) → Right hand (R)
 * - Center/long bar pads (snare, kick) → Right hand (R) default
 */
export const FINGER_DEFAULTS: Record<PadId, FingerDesignation> = {
  crash_l: { hand: 'L', finger: 4 },
  hihat_close_l: { hand: 'L', finger: 3 },
  hihat_open: { hand: 'R', finger: 3 },
  hihat_close_r: { hand: 'R', finger: 3 },
  crash_r: { hand: 'R', finger: 4 },
  ride_cup: { hand: 'L', finger: 4 },
  ride_bow: { hand: 'R', finger: 4 },
  snare: { hand: 'R', finger: 2 },
  tom_low_l: { hand: 'L', finger: 4 },
  tom_mid_l: { hand: 'L', finger: 3 },
  tom_high_l: { hand: 'L', finger: 2 },
  snare_rim_open: { hand: 'R', finger: 2 },
  tom_high_r: { hand: 'R', finger: 2 },
  tom_mid_r: { hand: 'R', finger: 3 },
  tom_low_r: { hand: 'R', finger: 4 },
  snare_rim_closed: { hand: 'L', finger: 1 },
  kick: { hand: 'R', finger: 1 },
  splash: { hand: 'R', finger: 1 },
};

/**
 * Get pad information by pad ID
 * @param padId - The pad identifier
 * @returns PadInfo object or undefined if not found
 */
export function getPadById(padId: string): PadInfo | undefined {
  return PADS[padId as PadId];
}

/**
 * Get default finger designation for a pad
 * @param padId - The pad identifier
 * @returns FingerDesignation or undefined if pad not found
 */
export function getDefaultFinger(padId: string): FingerDesignation | undefined {
  return FINGER_DEFAULTS[padId as PadId];
}

/**
 * Check if a pad ID is valid
 * @param padId - The pad identifier to check
 * @returns true if valid FGDP-50 pad ID
 */
export function isValidPadId(padId: string): padId is PadId {
  return PAD_IDS.includes(padId as PadId);
}

/**
 * Get all pads as an array in display order
 * @returns Array of PadInfo objects
 */
export function getAllPads(): PadInfo[] {
  return PAD_IDS.map((id) => PADS[id]);
}
