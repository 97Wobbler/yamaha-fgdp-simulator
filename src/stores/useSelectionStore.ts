/**
 * Selection Store - Manages block selection and clipboard for pattern editing
 *
 * Features:
 * - Shift+drag to select rectangular regions
 * - Ctrl/Cmd+C to copy selection
 * - Ctrl/Cmd+V to paste at playhead position
 * - Click on step header to move playhead
 */

import { create } from 'zustand';
import type { PatternStep } from '../types/pattern';
import { usePatternStore } from './usePatternStore';
import { usePlaybackStore } from './usePlaybackStore';

/**
 * Selection bounds (inclusive, 0-indexed)
 */
interface SelectionBounds {
  startTrack: number;
  endTrack: number;
  startStep: number;
  endStep: number;
}

/**
 * Clipboard data structure
 * 2D array: [track offset][step offset] -> PatternStep
 */
interface ClipboardData {
  /** Pattern steps organized by relative track and step position */
  steps: (PatternStep | null)[][];
  /** Number of tracks in clipboard */
  trackCount: number;
  /** Number of steps in clipboard */
  stepCount: number;
}

interface SelectionState {
  /** Whether user is currently selecting (dragging) */
  isSelecting: boolean;
  /** Selection start point (where user started dragging) */
  selectionStart: { track: number; step: number } | null;
  /** Selection end point (current drag position) */
  selectionEnd: { track: number; step: number } | null;
  /** Clipboard data for paste operation */
  clipboard: ClipboardData | null;
}

interface SelectionActions {
  /** Start selection at a cell (called on Shift+mousedown) */
  startSelection: (track: number, step: number) => void;
  /** Update selection during drag (called on mouseenter while selecting) */
  updateSelection: (track: number, step: number) => void;
  /** End selection (called on mouseup) */
  endSelection: () => void;
  /** Clear the current selection */
  clearSelection: () => void;
  /** Copy the current selection to clipboard */
  copySelection: () => void;
  /** Paste clipboard contents at playhead position */
  pasteAtPlayhead: () => void;
  /** Check if a cell is within the current selection */
  isCellSelected: (track: number, step: number) => boolean;
  /** Get normalized selection bounds (start <= end) */
  getSelectionBounds: () => SelectionBounds | null;
}

type SelectionStore = SelectionState & SelectionActions;

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  // Initial state
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null,
  clipboard: null,

  // Actions
  startSelection: (track: number, step: number) => {
    set({
      isSelecting: true,
      selectionStart: { track, step },
      selectionEnd: { track, step },
    });
  },

  updateSelection: (track: number, step: number) => {
    const { isSelecting } = get();
    if (!isSelecting) return;

    set({
      selectionEnd: { track, step },
    });
  },

  endSelection: () => {
    set({ isSelecting: false });
  },

  clearSelection: () => {
    set({
      isSelecting: false,
      selectionStart: null,
      selectionEnd: null,
    });
  },

  copySelection: () => {
    const bounds = get().getSelectionBounds();
    if (!bounds) return;

    const pattern = usePatternStore.getState().currentPattern;
    if (!pattern) return;

    const { startTrack, endTrack, startStep, endStep } = bounds;
    const trackCount = endTrack - startTrack + 1;
    const stepCount = endStep - startStep + 1;

    // Create 2D array of steps - only copy ACTIVE notes, skip inactive cells
    const steps: (PatternStep | null)[][] = [];

    for (let t = 0; t < trackCount; t++) {
      const trackSteps: (PatternStep | null)[] = [];
      const track = pattern.tracks[startTrack + t];

      for (let s = 0; s < stepCount; s++) {
        const step = track?.steps[startStep + s];
        // Only copy if step exists AND is active
        if (step?.active) {
          trackSteps.push({ ...step });
        } else {
          trackSteps.push(null);
        }
      }

      steps.push(trackSteps);
    }

    set({
      clipboard: { steps, trackCount, stepCount },
    });
  },

  pasteAtPlayhead: () => {
    const { clipboard } = get();
    if (!clipboard) return;

    const pattern = usePatternStore.getState().currentPattern;
    if (!pattern) return;

    const { currentStep } = usePlaybackStore.getState();
    const totalSteps = pattern.tracks[0]?.steps.length ?? 16;

    // Create new tracks with pasted data
    // Only paste active notes from clipboard, don't overwrite existing notes
    const newTracks = pattern.tracks.map((track, trackIndex) => {
      if (trackIndex >= clipboard.trackCount) {
        return track; // Track not affected by paste
      }

      const newSteps = [...track.steps];
      const clipboardTrack = clipboard.steps[trackIndex];

      for (let s = 0; s < clipboard.stepCount; s++) {
        const targetStep = (currentStep + s) % totalSteps;
        const clipboardStep = clipboardTrack[s];

        // Only paste if clipboard has an active note at this position
        // This adds notes without overwriting existing data
        if (clipboardStep?.active) {
          newSteps[targetStep] = { ...clipboardStep };
        }
      }

      return { ...track, steps: newSteps };
    });

    usePatternStore.getState().setPattern({
      ...pattern,
      tracks: newTracks,
    });

    // Clear selection after paste
    get().clearSelection();
  },

  isCellSelected: (track: number, step: number) => {
    const bounds = get().getSelectionBounds();
    if (!bounds) return false;

    return (
      track >= bounds.startTrack &&
      track <= bounds.endTrack &&
      step >= bounds.startStep &&
      step <= bounds.endStep
    );
  },

  getSelectionBounds: () => {
    const { selectionStart, selectionEnd } = get();
    if (!selectionStart || !selectionEnd) return null;

    return {
      startTrack: Math.min(selectionStart.track, selectionEnd.track),
      endTrack: Math.max(selectionStart.track, selectionEnd.track),
      startStep: Math.min(selectionStart.step, selectionEnd.step),
      endStep: Math.max(selectionStart.step, selectionEnd.step),
    };
  },
}));
