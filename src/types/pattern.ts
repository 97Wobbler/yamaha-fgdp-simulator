/**
 * Pattern Data Model Types
 *
 * Core TypeScript interfaces for the Step Sequencer pattern system.
 * All pattern-related data structures are defined here.
 */

/**
 * Finger designation for a drum hit.
 * Represents which hand and finger should be used.
 *
 * Display format:
 * - Right hand: 1, 2, 3, 4, 5
 * - Left hand: (1), (2), (3), (4), (5)
 */
export interface FingerDesignation {
  /** Hand to use: 'L' (left) or 'R' (right) */
  hand: 'L' | 'R';
  /** Finger number: 1 (thumb/index) through 5 (pinky) */
  finger: 1 | 2 | 3 | 4 | 5;
}

/**
 * A single step in a pattern track.
 * Represents one 16th note position in the sequence.
 */
export interface PatternStep {
  /** Whether this step has a note active */
  active: boolean;
  /** MIDI velocity (0-127), optional for future expansion */
  velocity?: number;
  /** Finger designation for this specific step (overrides track default when active) */
  finger?: FingerDesignation;
}

/**
 * A single track in the pattern (one pad/instrument).
 * Contains 16 steps representing one bar of 16th notes.
 */
export interface PatternTrack {
  /** Unique pad identifier (e.g., 'kick', 'snare', 'hihat_l') */
  padId: string;
  /** Display label for the track (e.g., 'Kick', 'Snare', 'Hi-hat L') */
  label: string;
  /** Default finger designation for this pad */
  defaultFinger: FingerDesignation;
  /** Array of 16 steps (16th notes in one bar) */
  steps: PatternStep[];
}

/**
 * Note subdivision type for the sequencer.
 * Determines how many steps per beat.
 */
export type Subdivision = '8n' | '16n' | '32n';

/**
 * Get steps per beat for a subdivision.
 */
export function getStepsPerBeat(subdivision: Subdivision): number {
  switch (subdivision) {
    case '8n': return 2;   // 2 eighth notes per beat
    case '16n': return 4;  // 4 sixteenth notes per beat
    case '32n': return 8;  // 8 thirty-second notes per beat
  }
}

/**
 * Calculate total steps for a pattern.
 */
export function getTotalSteps(bars: number, subdivision: Subdivision): number {
  const stepsPerBeat = getStepsPerBeat(subdivision);
  const beatsPerBar = 4; // 4/4 time signature
  return bars * beatsPerBar * stepsPerBeat;
}

/**
 * Complete drum pattern with all tracks and metadata.
 * This is the top-level data structure for pattern storage and sharing.
 */
export interface DrumPattern {
  /** Unique pattern identifier (UUID) */
  id: string;
  /** User-defined pattern name */
  name: string;
  /** Tempo in beats per minute */
  bpm: number;
  /** Note subdivision: 8n (eighth), 16n (sixteenth), 32n (thirty-second) */
  subdivision: Subdivision;
  /** Number of bars in the pattern (1-4) */
  bars: 1 | 2 | 3 | 4;
  /** Array of tracks (18 for FGDP-50) */
  tracks: PatternTrack[];
}

/**
 * Helper type for finger display format conversion.
 * Used by UI components to format finger designation.
 */
export type FingerDisplayFormat = string; // e.g., "1", "2", "(1)", "(2)"

/**
 * Helper function type for getting display format of finger designation.
 */
export function formatFingerDesignation(finger: FingerDesignation): FingerDisplayFormat {
  return finger.hand === 'L' ? `(${finger.finger})` : `${finger.finger}`;
}
