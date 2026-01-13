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
  /** Whether looping is enabled */
  isLooping: boolean;

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
  /** Seek forward by one beat */
  seekForward: () => void;
  /** Seek backward by one beat */
  seekBackward: () => void;
  /** Toggle loop on/off */
  toggleLoop: () => void;
  /** Set playhead to specific step */
  setPlayhead: (step: number) => void;
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
    isLooping: true,

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
      
      // Restore Transport.position if resuming from pause
      let transportPosition: number;
      if (state.isPaused && state.pausedPosition > 0) {
        // Restore exact paused position (no snapping)
        Tone.getTransport().position = state.pausedPosition;
        transportPosition = state.pausedPosition;
      } else {
        // Get current Transport.position (should be 0 for fresh start)
        const transportPos = Tone.getTransport().position;
        transportPosition = typeof transportPos === 'number' 
          ? transportPos 
          : Tone.Time(transportPos).toSeconds();
      }
      
      // Calculate current step from transport position
      const currentStepFloat = transportPosition / stepDuration;
      const calculatedStep = Math.floor(currentStepFloat % totalSteps);
      
      // Calculate time until next step boundary
      const positionInStep = transportPosition % stepDuration;
      const isAtStepBoundary = positionInStep === 0;
      const timeUntilNextStep = isAtStepBoundary ? 0 : stepDuration - positionInStep;

      // Determine which step to play first
      // If at step boundary, play current step; otherwise, wait for next step
      let nextStepToPlay = isAtStepBoundary ? calculatedStep : (calculatedStep + 1) % totalSteps;
      
      // Update state
      set({ currentStep: calculatedStep, pausedPosition: 0 });

      // Schedule step playback based on pattern subdivision
      // State-based step tracking for consistency with Transport.position
      scheduleId = Tone.getTransport().scheduleRepeat(
        (time) => {
          const currentPattern = usePatternStore.getState().currentPattern;
          const currentTotalSteps = currentPattern?.tracks[0]?.steps.length ?? 16;
          const { isLooping } = get();

          // Use tracked step (not calculated from time)
          const stepToPlay = nextStepToPlay;

          // Play sounds for active notes in this step
          const { playPad, isAudioReady } = useAudioStore.getState();

          if (currentPattern && isAudioReady) {
            currentPattern.tracks.forEach((track) => {
              const step = track.steps[stepToPlay];
              if (step?.active) {
                playPad(track.padId as PadId, time);
              }
            });
          }

          // Update step for next callback
          const nextStep = stepToPlay + 1;

          // If not looping and we've reached the end, stop playback
          const shouldStop = !isLooping && nextStep >= currentTotalSteps;
          if (shouldStop) {
            // Schedule stop after this step plays
            // Note: Don't update currentStep here - stop() will reset it to 0
            Draw.schedule(() => {
              get().stop();
            }, time);
            nextStepToPlay = 0; // Reset for next play
          } else {
            nextStepToPlay = nextStep % currentTotalSteps;
            // Use Tone.Draw to sync visual updates with audio timing
            // Only update currentStep if we're not stopping
            Draw.schedule(() => {
              set({ currentStep: stepToPlay });
            }, time);
          }
        },
        subdivision,
        timeUntilNextStep // Start at next step boundary (0 if at boundary)
      );

      // Start transport
      Tone.getTransport().start();
      
      set({ isPlaying: true, isPaused: false });
    },

    pause: () => {
      const state = get();
      if (!state.isPlaying) return;

      // Get current Transport.position (no snapping - store exact position)
      const transportPos = Tone.getTransport().position;
      const transportPosition = typeof transportPos === 'number' 
        ? transportPos 
        : Tone.Time(transportPos).toSeconds();

      // Stop transport
      Tone.getTransport().stop();

      // Clear scheduled event
      if (scheduleId !== null) {
        Tone.getTransport().clear(scheduleId);
        scheduleId = null;
      }

      // Store exact position without snapping
      // Playhead will display real-time position from pausedPosition
      set({ 
        isPlaying: false, 
        isPaused: true, 
        pausedPosition: transportPosition
      });
    },

    stop: () => {
      const state = get();
      const wasAlreadyStopped = !state.isPlaying && !state.isPaused;

      // If already stopped, just reset playhead to beginning
      if (wasAlreadyStopped) {
        Tone.getTransport().position = 0;
        set({ currentStep: 0, pausedPosition: 0 });
        return;
      }

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

    seekForward: () => {
      const state = get();
      const pattern = usePatternStore.getState().currentPattern;
      if (!pattern) return;

      const stepsPerBeat = getStepsPerBeat(pattern.subdivision);
      const totalSteps = pattern.tracks[0]?.steps.length ?? 16;

      // Calculate new step (move forward by one beat)
      const newStep = (state.currentStep + stepsPerBeat) % totalSteps;

      // Update position
      const stepDuration = (60 / state.bpm) / stepsPerBeat;
      const newPosition = newStep * stepDuration;

      Tone.getTransport().position = newPosition;
      set({ currentStep: newStep, pausedPosition: newPosition });
    },

    seekBackward: () => {
      const state = get();
      const pattern = usePatternStore.getState().currentPattern;
      if (!pattern) return;

      const stepsPerBeat = getStepsPerBeat(pattern.subdivision);
      const totalSteps = pattern.tracks[0]?.steps.length ?? 16;

      // Calculate new step (move backward by one beat)
      let newStep = state.currentStep - stepsPerBeat;
      if (newStep < 0) {
        newStep = totalSteps + newStep; // Wrap around
      }

      // Update position
      const stepDuration = (60 / state.bpm) / stepsPerBeat;
      const newPosition = newStep * stepDuration;

      Tone.getTransport().position = newPosition;
      set({ currentStep: newStep, pausedPosition: newPosition });
    },

    toggleLoop: () => {
      set((state) => ({ isLooping: !state.isLooping }));
    },

    setPlayhead: (step: number) => {
      const state = get();
      const pattern = usePatternStore.getState().currentPattern;
      if (!pattern) return;

      const stepsPerBeat = getStepsPerBeat(pattern.subdivision);
      const totalSteps = pattern.tracks[0]?.steps.length ?? 16;

      // Clamp step to valid range
      const clampedStep = Math.max(0, Math.min(step, totalSteps - 1));

      // Update position
      const stepDuration = (60 / state.bpm) / stepsPerBeat;
      const newPosition = clampedStep * stepDuration;

      Tone.getTransport().position = newPosition;
      set({ currentStep: clampedStep, pausedPosition: newPosition });
    },
  };
});

/** Export constants for external use */
export { DEFAULT_BPM, MIN_BPM, MAX_BPM };
