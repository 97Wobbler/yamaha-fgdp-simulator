/**
 * Layout View Configuration
 *
 * Defines different track ordering views for the step sequencer:
 * - Default: Original FGDP-50 layout
 * - Right Hand: Optimized for right-hand patterns
 * - Left Hand: Optimized for left-hand patterns
 * - Simplified: Merged L/R tracks (13 tracks instead of 18)
 */

import type { PadId } from './padMapping';

/**
 * Available layout view types
 */
export type LayoutView = 'default' | 'right-hand' | 'left-hand' | 'simplified';

/**
 * Layout view display names
 */
export const LAYOUT_NAMES: Record<LayoutView, string> = {
  'default': 'Default',
  'right-hand': 'Right Hand (Beta)',
  'left-hand': 'Left Hand (Beta)',
  'simplified': 'Simplified (Beta)',
};

/**
 * Right Hand Pattern view order
 * Prioritizes right-hand pads at the top
 */
export const RIGHT_HAND_ORDER: PadId[] = [
  'crash_r',          // Crash R
  'crash_l',          // Crash L
  'hihat_close_r',    // Hi-hat R
  'hihat_close_l',    // Hi-hat L
  'hihat_open',       // Hi-hat Open
  'ride_bow',         // Ride Bow
  'ride_cup',         // Ride Cup
  'splash',           // Splash
  'snare',            // Snare
  'snare_rim_open',   // Open Rim Snare
  'snare_rim_closed', // Closed Rim Snare
  'tom_high_r',       // Small Tom R
  'tom_high_l',       // Small Tom L
  'tom_mid_r',        // Large Tom R
  'tom_mid_l',        // Large Tom L
  'tom_low_r',        // Floor Tom R
  'tom_low_l',        // Floor Tom L
  'kick',             // Kick
];

/**
 * Left Hand Pattern view order
 * Prioritizes left-hand pads at the top
 */
export const LEFT_HAND_ORDER: PadId[] = [
  'crash_l',          // Crash L
  'crash_r',          // Crash R
  'hihat_open',       // Hi-hat Open
  'hihat_close_l',    // Hi-hat L
  'hihat_close_r',    // Hi-hat R
  'ride_bow',         // Ride Bow
  'ride_cup',         // Ride Cup
  'splash',           // Splash
  'snare',            // Snare
  'snare_rim_open',   // Open Rim Snare
  'snare_rim_closed', // Closed Rim Snare
  'tom_high_l',       // Small Tom L
  'tom_high_r',       // Small Tom R
  'tom_mid_l',        // Large Tom L
  'tom_mid_r',        // Large Tom R
  'tom_low_l',        // Floor Tom L
  'tom_low_r',        // Floor Tom R
  'kick',             // Kick
];

/**
 * Simplified track configuration
 * Merges L/R pads into single tracks
 */
export interface SimplifiedTrackConfig {
  /** Unique ID for this simplified track */
  id: string;
  /** Display label */
  label: string;
  /** Source pad IDs (1 for single pads, 2 for merged L/R) */
  sources: PadId[];
}

/**
 * Simplified view tracks (13 tracks)
 * L/R pads are merged, click shows popup to select hand
 */
export const SIMPLIFIED_TRACKS: SimplifiedTrackConfig[] = [
  { id: 'crash', label: 'Crash', sources: ['crash_l', 'crash_r'] },
  { id: 'hihat_open', label: 'Hi-hat Open', sources: ['hihat_open'] },
  { id: 'hihat', label: 'Hi-hat', sources: ['hihat_close_l', 'hihat_close_r'] },
  { id: 'ride_bow', label: 'Ride Bow', sources: ['ride_bow'] },
  { id: 'ride_cup', label: 'Ride Cup', sources: ['ride_cup'] },
  { id: 'splash', label: 'Splash', sources: ['splash'] },
  { id: 'snare', label: 'Snare', sources: ['snare'] },
  { id: 'snare_rim_open', label: 'Open Rim Snare', sources: ['snare_rim_open'] },
  { id: 'snare_rim_closed', label: 'Closed Rim Snare', sources: ['snare_rim_closed'] },
  { id: 'tom_high', label: 'Small Tom', sources: ['tom_high_l', 'tom_high_r'] },
  { id: 'tom_mid', label: 'Large Tom', sources: ['tom_mid_l', 'tom_mid_r'] },
  { id: 'tom_low', label: 'Floor Tom', sources: ['tom_low_l', 'tom_low_r'] },
  { id: 'kick', label: 'Kick', sources: ['kick'] },
];

/**
 * Get track order for a layout view
 * Returns array of pad IDs in display order
 */
export function getLayoutOrder(layout: LayoutView): PadId[] | null {
  switch (layout) {
    case 'right-hand':
      return RIGHT_HAND_ORDER;
    case 'left-hand':
      return LEFT_HAND_ORDER;
    case 'simplified':
      return null; // Simplified uses SIMPLIFIED_TRACKS instead
    default:
      return null; // Default uses original PAD_IDS order
  }
}
