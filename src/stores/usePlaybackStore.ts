/**
 * Playback Store - Manages pattern playback state and Tone.Transport
 *
 * Story 3.1: Playback Store and Transport Setup
 * - Controls play/stop state
 * - Manages current step position (0-N based on bars/subdivision)
 * - Syncs BPM with Tone.Transport
 *
 * Story 3.5: Sequenced Audio Playback
 * - Plays drum sounds for active notes on each step
 * - Synchronized with Transport timing
 *
 * Story 4.5: Dynamic subdivision support
 * - Supports 8n, 16n, 32n subdivisions
 * - Step count varies based on bars and subdivision
 */

import { create } from 'zustand';
import * as Tone from 'tone';
import { Draw } from 'tone';
import { usePatternStore } from './usePatternStore';
import { useAudioStore } from './useAudioStore';
import type { PadId } from '../config/padMapping';
import type { Subdivision } from '../types/pattern';

/** Default BPM */
const DEFAULT_BPM = 120;

/** BPM range limits */
const MIN_BPM = 40;
const MAX_BPM = 200;

interface PlaybackStore {
  /** Whether pattern is currently playing */
  isPlaying: boolean;
  /** Current step position (0-15) */
  currentStep: number;
  /** Tempo in BPM */
  bpm: number;

  /** Start playback */
  play: () => void;
  /** Stop playback */
  stop: () => void;
  /** Toggle play/stop */
  toggle: () => void;
  /** Set BPM (clamped to 40-200) */
  setBpm: (bpm: number) => void;
  /** Increment BPM by delta */
  adjustBpm: (delta: number) => void;
  /** Reset playback state */
  reset: () => void;
}

/** ID for scheduled transport event */
let scheduleId: number | null = null;

/**
 * Clamp BPM to valid range
 */
function clampBpm(value: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(value)));
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => {
  // Initialize Transport BPM
  Tone.getTransport().bpm.value = DEFAULT_BPM;

  return {
    isPlaying: false,
    currentStep: 0,
    bpm: DEFAULT_BPM,

    play: () => {
      const state = get();
      if (state.isPlaying) return;

      // Clear any existing schedule
      if (scheduleId !== null) {
        Tone.getTransport().clear(scheduleId);
        scheduleId = null;
      }

      // Get pattern subdivision for scheduling interval
      const pattern = usePatternStore.getState().currentPattern;
      const subdivision: Subdivision = pattern?.subdivision ?? '16n';
      const totalSteps = pattern?.tracks[0]?.steps.length ?? 16;

      // Schedule step advance based on pattern subdivision
      // Timing Fix: Use Web Audio API's precise scheduling via `time` parameter
      // This ensures sample-accurate playback instead of relying on JS event loop
      scheduleId = Tone.getTransport().scheduleRepeat(
        (time) => {
          const currentStep = get().currentStep;
          const currentPattern = usePatternStore.getState().currentPattern;
          const currentTotalSteps = currentPattern?.tracks[0]?.steps.length ?? 16;
          const nextStep = (currentStep + 1) % currentTotalSteps;

          // Story 3.5: Play sounds for active notes in the current step
          const { playPad, isAudioReady } = useAudioStore.getState();

          if (currentPattern && isAudioReady) {
            // Play all active notes for this step (polyphonic)
            // Pass `time` for precise audio scheduling
            currentPattern.tracks.forEach((track) => {
              const step = track.steps[currentStep];
              if (step?.active) {
                playPad(track.padId as PadId, time);
              }
            });
          }

          // Use Tone.Draw to sync visual updates with audio timing
          // This schedules the state update to happen at the correct visual frame
          // aligned with the audio event, reducing audio-visual desync
          Draw.schedule(() => {
            set({ currentStep: nextStep });
          }, time);
        },
        subdivision,
        0 // Start immediately
      );

      // Start transport
      Tone.getTransport().start();
      set({ isPlaying: true });
    },

    stop: () => {
      const state = get();
      if (!state.isPlaying) return;

      // Stop transport
      Tone.getTransport().stop();

      // Clear scheduled event
      if (scheduleId !== null) {
        Tone.getTransport().clear(scheduleId);
        scheduleId = null;
      }

      // Reset position
      Tone.getTransport().position = 0;

      set({ isPlaying: false, currentStep: 0 });
    },

    toggle: () => {
      const { isPlaying, play, stop } = get();
      if (isPlaying) {
        stop();
      } else {
        play();
      }
    },

    setBpm: (newBpm: number) => {
      const clampedBpm = clampBpm(newBpm);
      Tone.getTransport().bpm.value = clampedBpm;
      set({ bpm: clampedBpm });
    },

    adjustBpm: (delta: number) => {
      const { bpm, setBpm } = get();
      setBpm(bpm + delta);
    },

    reset: () => {
      const { stop } = get();
      stop();
      Tone.getTransport().bpm.value = DEFAULT_BPM;
      set({ bpm: DEFAULT_BPM });
    },
  };
});

/** Export constants for external use */
export { DEFAULT_BPM, MIN_BPM, MAX_BPM };
