/**
 * Pattern Store - Zustand store for drum pattern state management
 *
 * Manages the current pattern state including:
 * - Pattern creation and reset
 * - Step toggling (active/inactive)
 * - Finger designation updates
 */

import { create } from 'zustand';
import type {
  DrumPattern,
  PatternTrack,
  PatternStep,
  FingerDesignation,
  Subdivision,
} from '../types/pattern';
import { getTotalSteps, getStepsPerBeat } from '../types/pattern';
import { PAD_IDS, PADS, FINGER_DEFAULTS, type PadId } from '../config/padMapping';

/**
 * Pattern store state interface
 */
interface PatternState {
  /** Current pattern being edited, null if no pattern loaded */
  currentPattern: DrumPattern | null;
  /** Whether URL pattern check is complete (prevents race condition) */
  urlCheckComplete: boolean;
}

/**
 * Pattern store actions interface
 */
interface PatternActions {
  /** Create a new empty pattern with configurable bars and subdivision */
  createEmptyPattern: (name?: string, bars?: 1 | 2 | 3 | 4, subdivision?: Subdivision) => void;
  /** Set the current pattern to a specific pattern */
  setPattern: (pattern: DrumPattern) => void;
  /** Reset the current pattern to null */
  resetPattern: () => void;
  /** Set the pattern name (Story 4.4) */
  setPatternName: (name: string) => void;
  /** Mark URL pattern check as complete */
  setUrlCheckComplete: (complete: boolean) => void;
  /** Set the number of bars (1-4) */
  setBars: (bars: 1 | 2 | 3 | 4) => void;
  /** Set the subdivision (8n, 16n, 32n) */
  setSubdivision: (subdivision: Subdivision) => void;
  /** Toggle a step's active state */
  toggleStep: (trackIndex: number, stepIndex: number) => void;
  /** Update a step's finger designation */
  updateStepFinger: (
    trackIndex: number,
    stepIndex: number,
    finger: FingerDesignation
  ) => void;
}

type PatternStore = PatternState & PatternActions;

/**
 * Generate a unique pattern ID
 */
function generatePatternId(): string {
  return `pattern-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create empty steps array for a track
 * @param count Number of steps to create
 */
function createEmptySteps(count: number): PatternStep[] {
  return Array.from({ length: count }, () => ({
    active: false,
    velocity: undefined,
    finger: undefined,
  }));
}

/**
 * Create a track for a specific pad
 * @param padId The pad identifier
 * @param stepCount Number of steps for this track
 */
function createTrack(padId: PadId, stepCount: number): PatternTrack {
  const padInfo = PADS[padId];
  const defaultFinger = FINGER_DEFAULTS[padId];

  return {
    padId,
    label: padInfo.label,
    defaultFinger,
    steps: createEmptySteps(stepCount),
  };
}

/**
 * Create an empty drum pattern with configurable settings
 * @param name Optional pattern name
 * @param bars Number of bars (1-4)
 * @param subdivision Note subdivision (8n, 16n, 32n)
 */
function createPattern(
  name?: string,
  bars: 1 | 2 | 3 | 4 = 1,
  subdivision: Subdivision = '16n'
): DrumPattern {
  const totalSteps = getTotalSteps(bars, subdivision);
  return {
    id: generatePatternId(),
    name: name ?? 'New Pattern',
    bpm: 120,
    subdivision,
    bars,
    tracks: PAD_IDS.map((padId) => createTrack(padId, totalSteps)),
  };
}

/**
 * Resize track steps when bars changes (simple extend/truncate)
 * Preserves existing step data where possible
 */
function resizeTrackSteps(track: PatternTrack, newStepCount: number): PatternTrack {
  const currentSteps = track.steps;
  const newSteps: PatternStep[] = [];

  for (let i = 0; i < newStepCount; i++) {
    if (i < currentSteps.length) {
      newSteps.push({ ...currentSteps[i] });
    } else {
      newSteps.push({ active: false, velocity: undefined, finger: undefined });
    }
  }

  return { ...track, steps: newSteps };
}

/**
 * Convert track steps when subdivision changes (interleaving)
 * 8n→16n: steps spread out with gaps (0→0, 1→2, 2→4...)
 * 16n→8n: every other step kept (0→0, 2→1, 4→2...)
 */
function convertTrackSubdivision(
  track: PatternTrack,
  fromSubdivision: Subdivision,
  toSubdivision: Subdivision,
  bars: number
): PatternTrack {
  const fromStepsPerBeat = getStepsPerBeat(fromSubdivision);
  const toStepsPerBeat = getStepsPerBeat(toSubdivision);
  const newTotalSteps = getTotalSteps(bars, toSubdivision);

  const newSteps: PatternStep[] = Array.from({ length: newTotalSteps }, () => ({
    active: false,
    velocity: undefined,
    finger: undefined,
  }));

  const ratio = toStepsPerBeat / fromStepsPerBeat;

  if (ratio > 1) {
    // Subdividing (e.g., 8n→16n): spread steps out
    // Each old step maps to oldIndex * ratio
    track.steps.forEach((step, oldIndex) => {
      const newIndex = oldIndex * ratio;
      if (newIndex < newTotalSteps) {
        newSteps[newIndex] = { ...step };
      }
    });
  } else {
    // Combining (e.g., 16n→8n): keep every Nth step
    // Each new step comes from newIndex / ratio (only integer positions)
    const step = 1 / ratio; // e.g., ratio=0.5 → step=2
    for (let newIndex = 0; newIndex < newTotalSteps; newIndex++) {
      const oldIndex = newIndex * step;
      if (oldIndex < track.steps.length && Number.isInteger(oldIndex)) {
        newSteps[newIndex] = { ...track.steps[oldIndex] };
      }
    }
  }

  return { ...track, steps: newSteps };
}

/**
 * Pattern store for managing drum patterns
 */
export const usePatternStore = create<PatternStore>((set) => ({
  // Initial state
  currentPattern: null,
  urlCheckComplete: false,

  // Actions
  createEmptyPattern: (name?: string, bars?: 1 | 2 | 3 | 4, subdivision?: Subdivision) => {
    set({ currentPattern: createPattern(name, bars, subdivision) });
  },

  setPattern: (pattern: DrumPattern) => {
    set({ currentPattern: pattern });
  },

  resetPattern: () => {
    set({ currentPattern: null });
  },

  setUrlCheckComplete: (complete: boolean) => {
    set({ urlCheckComplete: complete });
  },

  // Story 4.4: Set pattern name
  setPatternName: (name: string) => {
    set((state) => {
      if (!state.currentPattern) return state;

      // Default to 'Untitled Pattern' if empty
      const trimmedName = name.trim();
      const finalName = trimmedName || 'Untitled Pattern';

      return {
        currentPattern: {
          ...state.currentPattern,
          name: finalName,
        },
      };
    });
  },

  // Set number of bars (resizes all tracks)
  setBars: (bars: 1 | 2 | 3 | 4) => {
    set((state) => {
      if (!state.currentPattern) return state;

      const newStepCount = getTotalSteps(bars, state.currentPattern.subdivision);
      const resizedTracks = state.currentPattern.tracks.map((track) =>
        resizeTrackSteps(track, newStepCount)
      );

      return {
        currentPattern: {
          ...state.currentPattern,
          bars,
          tracks: resizedTracks,
        },
      };
    });
  },

  // Set subdivision (converts tracks with interleaving)
  setSubdivision: (subdivision: Subdivision) => {
    set((state) => {
      if (!state.currentPattern) return state;

      const fromSubdivision = state.currentPattern.subdivision;
      const bars = state.currentPattern.bars;

      // Convert tracks with proper interleaving
      const convertedTracks = state.currentPattern.tracks.map((track) =>
        convertTrackSubdivision(track, fromSubdivision, subdivision, bars)
      );

      return {
        currentPattern: {
          ...state.currentPattern,
          subdivision,
          tracks: convertedTracks,
        },
      };
    });
  },

  toggleStep: (trackIndex: number, stepIndex: number) => {
    set((state) => {
      if (!state.currentPattern) return state;

      const tracks = [...state.currentPattern.tracks];
      const track = { ...tracks[trackIndex] };
      const steps = [...track.steps];
      const step = { ...steps[stepIndex] };

      // Toggle active state
      step.active = !step.active;

      // If activating, set default finger; if deactivating, clear finger
      if (step.active) {
        step.finger = { ...track.defaultFinger };
      } else {
        step.finger = undefined;
      }

      steps[stepIndex] = step;
      track.steps = steps;
      tracks[trackIndex] = track;

      return {
        currentPattern: {
          ...state.currentPattern,
          tracks,
        },
      };
    });
  },

  updateStepFinger: (
    trackIndex: number,
    stepIndex: number,
    finger: FingerDesignation
  ) => {
    set((state) => {
      if (!state.currentPattern) return state;

      const tracks = [...state.currentPattern.tracks];
      const track = { ...tracks[trackIndex] };
      const steps = [...track.steps];
      const step = { ...steps[stepIndex] };

      // Only update finger if step is active
      if (step.active) {
        step.finger = { ...finger };
      }

      steps[stepIndex] = step;
      track.steps = steps;
      tracks[trackIndex] = track;

      return {
        currentPattern: {
          ...state.currentPattern,
          tracks,
        },
      };
    });
  },
}));

// Expose store to window for browser console debugging (development only)
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).usePatternStore = usePatternStore;
}
