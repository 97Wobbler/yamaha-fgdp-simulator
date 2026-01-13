/**
 * StepCell - Individual cell in the step sequencer grid
 *
 * Displays active/inactive state with visual styling.
 * Story 2.1: Basic display only
 * Story 2.2: Click interaction for toggle
 * Story 2.3: Finger designation display with hand-based colors
 * Story 2.4: Right-click to edit finger designation
 * Story 2.6: Sound preview on cell activation
 */

import { memo, useCallback, useState } from 'react';
import { usePatternStore } from '../../stores/usePatternStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { formatFingerDesignation, type FingerDesignation } from '../../types/pattern';
import { FingerEditor } from './FingerEditor';
import type { PadId } from '../../config/padMapping';

interface StepCellProps {
  /** Track index (0-17) */
  trackIndex: number;
  /** Step index (0-15) */
  stepIndex: number;
  /** Pad ID for audio playback */
  padId: string;
  /** Whether this step is active */
  active: boolean;
  /** Finger designation for this step */
  finger?: FingerDesignation;
  /** Whether this is the first step in a beat (for visual separator) */
  isFirstInBeat: boolean;
  /** Steps per beat for beat grouping */
  stepsPerBeat: number;
  /** Cell width for zoom */
  cellWidth?: number;
  /** Dark theme mode */
  isDark?: boolean;
}

/**
 * Get color classes based on hand (R = red/rose, L = blue)
 */
function getHandColors(hand: 'L' | 'R') {
  if (hand === 'R') {
    return {
      bg: 'bg-rose-500/80',
      border: 'border-rose-400',
      hover: 'hover:bg-rose-400',
      ring: 'focus:ring-rose-400',
      text: 'text-rose-100',
    };
  }
  return {
    bg: 'bg-sky-500/80',
    border: 'border-sky-400',
    hover: 'hover:bg-sky-400',
    ring: 'focus:ring-sky-400',
    text: 'text-sky-100',
  };
}

/**
 * StepCell component - displays a single step in the sequencer grid
 */
export const StepCell = memo(function StepCell({
  trackIndex,
  stepIndex,
  padId,
  active,
  finger,
  isFirstInBeat,
  stepsPerBeat,
  cellWidth = 28,
  isDark = true,
}: StepCellProps) {
  const toggleStep = usePatternStore((state) => state.toggleStep);
  const updateStepFinger = usePatternStore((state) => state.updateStepFinger);
  const playPad = useAudioStore((state) => state.playPad);

  // Selection store
  const {
    isSelecting,
    selectionStart,
    selectionEnd,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    isCellSelected,
  } = useSelectionStore();

  // Check if there's any selection active
  const hasSelection = selectionStart !== null && selectionEnd !== null;

  // Only show selection highlight on ACTIVE cells within selection bounds
  const isInSelectionBounds = isCellSelected(trackIndex, stepIndex);
  const isSelected = isInSelectionBounds && active;

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPosition, setEditorPosition] = useState({ x: 0, y: 0 });

  const handleClick = useCallback((e: React.MouseEvent) => {
    // If Shift is held, don't toggle - selection mode will handle it
    if (e.shiftKey) return;

    // If there's an active selection, clear it instead of toggling
    if (hasSelection) {
      clearSelection();
      return;
    }

    // Play sound only when activating (not when deactivating)
    if (!active) {
      playPad(padId as PadId);
    }
    toggleStep(trackIndex, stepIndex);
  }, [toggleStep, trackIndex, stepIndex, active, playPad, padId, hasSelection, clearSelection]);

  // Selection handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      // Clear any existing selection and start new
      clearSelection();
      startSelection(trackIndex, stepIndex);
    }
  }, [startSelection, clearSelection, trackIndex, stepIndex]);

  const handleMouseEnter = useCallback(() => {
    if (isSelecting) {
      updateSelection(trackIndex, stepIndex);
    }
  }, [isSelecting, updateSelection, trackIndex, stepIndex]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      endSelection();
    }
  }, [isSelecting, endSelection]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Only show editor for active cells with finger designation
      if (active && finger) {
        setEditorPosition({ x: e.clientX, y: e.clientY });
        setEditorOpen(true);
      }
    },
    [active, finger]
  );

  const handleFingerChange = useCallback(
    (newFinger: FingerDesignation) => {
      updateStepFinger(trackIndex, stepIndex, newFinger);
    },
    [updateStepFinger, trackIndex, stepIndex]
  );

  const handleEditorClose = useCallback(() => {
    setEditorOpen(false);
  }, []);

  // Get colors based on finger hand
  const colors = finger ? getHandColors(finger.hand) : null;
  const fingerDisplay = finger ? formatFingerDesignation(finger) : null;

  // Calculate beat index (0-based) for alternating background
  const beatIndex = Math.floor(stepIndex / stepsPerBeat);
  const isOddBeat = beatIndex % 2 === 1; // 2nd, 4th beats are "odd" (0-indexed: 1, 3)

  // Inactive cell background based on beat grouping
  // Dark mode: subtle difference between beats (slate-800 vs slightly lighter)
  const inactiveBg = isDark
    ? isOddBeat
      ? 'bg-[#293548] border-[#3a4a5e] hover:bg-[#3a4a5e]'
      : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
    : isOddBeat
      ? 'bg-slate-300 border-slate-400 hover:bg-slate-400'
      : 'bg-slate-200 border-slate-300 hover:bg-slate-300';

  // Selection highlight style - theme-aware colors with glow for visibility
  // Dark mode: cyan glow, Light mode: violet glow
  const selectionStyle = isSelected
    ? isDark
      ? 'ring-2 ring-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)] z-10'
      : 'ring-2 ring-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)] z-10'
    : '';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        className={`
          h-[30px]
          rounded-sm
          border
          transition-colors duration-75
          cursor-pointer
          flex items-center justify-center
          text-xs font-bold
          focus:outline-none focus:ring-2 focus:ring-offset-1 ${isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-slate-100'}
          ${selectionStyle}
          ${
            active && colors
              ? `${colors.bg} ${colors.border} ${colors.hover} ${colors.ring} ${colors.text}`
              : active
                ? 'bg-amber-500/80 border-amber-400 hover:bg-amber-400 focus:ring-amber-400 text-amber-100'
                : `${inactiveBg} focus:ring-slate-400`
          }
        `}
        style={{ width: cellWidth }}
        role="gridcell"
        aria-pressed={active}
        aria-label={`Step ${stepIndex + 1}, ${active ? `active, ${fingerDisplay}` : 'inactive'}. Right-click to edit finger. Shift+drag to select.`}
      >
        {active && fingerDisplay && (
          <span className="select-none">{fingerDisplay}</span>
        )}
      </button>

      {/* Finger designation editor popover */}
      {editorOpen && finger && (
        <FingerEditor
          currentFinger={finger}
          onFingerChange={handleFingerChange}
          onClose={handleEditorClose}
          position={editorPosition}
          isDark={isDark}
        />
      )}
    </>
  );
});
