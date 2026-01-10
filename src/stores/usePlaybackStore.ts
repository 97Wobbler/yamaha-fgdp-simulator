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
import { getStepsPerBeat } from '../types/pattern';
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
  /** Whether playback is paused (distinct from stopped) */
  isPaused: boolean;
  /** Current step position (0-15) */
  currentStep: number;
  /** Tempo in BPM */
  bpm: number;
  /** Saved Transport position when paused (in seconds) */
  pausedPosition: number;

  /** Start playback */
  play: () => void;
  /** Pause playback (maintains position) */
  pause: () => void;
  /** Stop playback (resets position) */
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
    isPaused: false,
    currentStep: 0,
    bpm: DEFAULT_BPM,
    pausedPosition: 0,

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
      const stepsPerBeat = getStepsPerBeat(subdivision);
      const bpm = state.bpm;

      // Calculate step duration in seconds
      const stepDuration = (60 / bpm) / stepsPerBeat;
      
      // Restore Transport.position if resuming from pause (already snapped to step boundary)
      let transportPosition: number;
      let calculatedStep: number;
      if (state.isPaused && state.pausedPosition > 0) {
        // Restore snapped position (already at step boundary)
        // Use the currentStep that was set during pause() to maintain consistency
        Tone.getTransport().position = state.pausedPosition;
        transportPosition = state.pausedPosition;
        calculatedStep = state.currentStep; // Use the step that was calculated during pause()
      } else {
        // Get current Transport.position (should be 0 for fresh start)
        const transportPos = Tone.getTransport().position;
        transportPosition = typeof transportPos === 'number' 
          ? transportPos 
          : Tone.Time(transportPos).toSeconds();
        // Always round down (Math.floor) to ensure consistent forward snapping
        calculatedStep = Math.floor((transportPosition / stepDuration) % totalSteps);
      }
      
      // Update currentStep to match Transport.position
      set({ currentStep: calculatedStep, pausedPosition: 0 });

      // Calculate time until next step boundary (in Transport time)
      // Since pausedPosition is already snapped to step boundary, timeUntilNextStep = stepDuration
      const timeUntilNextStep = state.isPaused && state.pausedPosition > 0
        ? stepDuration // Already at step boundary, scheduleRepeat starts at next step
        : stepDuration - (transportPosition % stepDuration); // Calculate for fresh start

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
        timeUntilNextStep // Start at next step boundary
      );

      // Start transport
      Tone.getTransport().start();
      
      // When resuming from pause, play current step at the Transport start time
      // This is scheduled separately to avoid conflict with scheduleRepeat
      const { playPad, isAudioReady } = useAudioStore.getState();
      if (pattern && isAudioReady && state.isPaused && state.pausedPosition > 0) {
        // Schedule current step to play at Transport start + small offset
        // This ensures it plays after Transport.start() but before scheduleRepeat's first callback
        Tone.getTransport().scheduleOnce((time) => {
          pattern.tracks.forEach((track) => {
            const step = track.steps[calculatedStep];
            if (step?.active) {
              playPad(track.padId as PadId, time);
            }
          });
        }, 0); // Schedule at Transport time 0 (current position)
      }
      
      set({ isPlaying: true, isPaused: false });
    },

    pause: () => {
      const state = get();
      if (!state.isPlaying) return;

      // Get current Transport.position
      const transportPos = Tone.getTransport().position;
      const transportPosition = typeof transportPos === 'number' 
        ? transportPos 
        : Tone.Time(transportPos).toSeconds();

      // Get pattern info for step calculation
      const pattern = usePatternStore.getState().currentPattern;
      const stepsPerBeat = pattern ? getStepsPerBeat(pattern.subdivision) : 4;
      const stepDuration = (60 / state.bpm) / stepsPerBeat;
      const totalSteps = pattern?.tracks[0]?.steps.length ?? 16;

      // Calculate current step index first (always round down for consistent forward snapping)
      const currentStepIndex = Math.floor((transportPosition / stepDuration) % totalSteps);
      
      // Snap to the start of the current step (always forward, never backward)
      const snappedPosition = currentStepIndex * stepDuration;
      
      // Use the calculated step index directly (already rounded down)
      const snappedStep = currentStepIndex;

      // Stop transport
      Tone.getTransport().stop();

      // Set Transport.position to snapped position
      Tone.getTransport().position = snappedPosition;

      // Clear scheduled event
      if (scheduleId !== null) {
        Tone.getTransport().clear(scheduleId);
        scheduleId = null;
      }

      set({ 
        isPlaying: false, 
        isPaused: true, 
        pausedPosition: snappedPosition,
        currentStep: snappedStep 
      });
    },

    stop: () => {
      const state = get();
      // Allow stop from both playing and paused states
      if (!state.isPlaying && !state.isPaused) return;

      // Stop transport
      Tone.getTransport().stop();

      // Clear scheduled event
      if (scheduleId !== null) {
        Tone.getTransport().clear(scheduleId);
        scheduleId = null;
      }

      // Reset position
      Tone.getTransport().position = 0;

      set({ isPlaying: false, isPaused: false, currentStep: 0, pausedPosition: 0 });
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
