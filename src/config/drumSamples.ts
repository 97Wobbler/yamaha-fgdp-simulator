/**
 * Drum Sample Configuration
 *
 * Maps each FGDP-50 pad to its corresponding audio sample file.
 * Samples should be placed in /public/samples/ directory.
 *
 * GM (General MIDI) Standard Drum Note Mapping:
 * - Kick: 35/36 (Acoustic/Bass Drum)
 * - Snare: 38 (Acoustic Snare)
 * - Hi-hat Closed: 42
 * - Hi-hat Open: 46
 * - Ride Cymbal: 51 (Ride Bow), 59 (Ride Cup/Bell)
 * - Crash Cymbal: 49, 57
 * - Toms: 41, 43, 45 (Low), 47, 48 (Mid), 50 (High)
 */

import type { PadId } from './padMapping';

/**
 * Audio engine mode
 */
export type AudioMode = 'samples' | 'synthesis';

/**
 * Sample file URL configuration for each pad
 * Base path is relative to public directory
 */
export const DRUM_SAMPLE_URLS: Record<PadId, string> = {
  kick: '/samples/kick.wav',
  snare: '/samples/snare.wav',
  snare_rim_open: '/samples/snare_rim_open.wav',
  snare_rim_closed: '/samples/snare_rim_closed.wav',
  hihat_close_l: '/samples/hihat_closed.wav',
  hihat_close_r: '/samples/hihat_closed.wav', // Same sample as left
  hihat_open: '/samples/hihat_open.wav',
  crash_l: '/samples/crash.wav',
  crash_r: '/samples/crash.wav', // Same sample, slightly different playback
  ride_cup: '/samples/ride_bell.wav',
  ride_bow: '/samples/ride.wav',
  splash: '/samples/splash.wav',
  tom_low_l: '/samples/tom_low.wav',
  tom_low_r: '/samples/tom_low.wav',
  tom_mid_l: '/samples/tom_mid.wav',
  tom_mid_r: '/samples/tom_mid.wav',
  tom_high_l: '/samples/tom_high.wav',
  tom_high_r: '/samples/tom_high.wav',
};

/**
 * Volume adjustments for each sample (in dB)
 * Negative values make the sample quieter
 */
export const SAMPLE_VOLUMES: Record<PadId, number> = {
  kick: 0,
  snare: -3,
  snare_rim_open: -6,
  snare_rim_closed: -8,
  hihat_close_l: -6,
  hihat_close_r: -6,
  hihat_open: -6,
  crash_l: -3,
  crash_r: -3,
  ride_cup: -6,
  ride_bow: -6,
  splash: -6,
  tom_low_l: -3,
  tom_low_r: -3,
  tom_mid_l: -3,
  tom_mid_r: -3,
  tom_high_l: -3,
  tom_high_r: -3,
};

/**
 * Playback rate adjustments for L/R variations
 * Slight pitch variations to differentiate left/right hits
 */
export const SAMPLE_RATES: Partial<Record<PadId, number>> = {
  crash_r: 1.03, // Slightly higher pitch for right crash
  tom_low_r: 1.05,
  tom_mid_r: 1.05,
  tom_high_r: 1.05,
};

/**
 * Get all unique sample URLs (for preloading)
 */
export function getUniqueSampleUrls(): string[] {
  const urls = new Set(Object.values(DRUM_SAMPLE_URLS));
  return Array.from(urls);
}
