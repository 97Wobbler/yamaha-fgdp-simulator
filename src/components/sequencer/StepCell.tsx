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
  /** Whether this step is the current playhead position (Story 3.6) */
  isCurrentStep?: boolean;
  /** Cell width for zoom */
  cellWidth?: number;
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
  isCurrentStep = false,
  cellWidth = 28,
}: StepCellProps) {
  const toggleStep = usePatternStore((state) => state.toggleStep);
  const updateStepFinger = usePatternStore((state) => state.updateStepFinger);
  const playPad = useAudioStore((state) => state.playPad);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorPosition, setEditorPosition] = useState({ x: 0, y: 0 });

  const handleClick = useCallback(() => {
    // Play sound only when activating (not when deactivating)
    if (!active) {
      playPad(padId as PadId);
    }
    toggleStep(trackIndex, stepIndex);
  }, [toggleStep, trackIndex, stepIndex, active, playPad, padId]);

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

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          h-[30px]
          rounded-sm
          border
          transition-colors duration-75
          cursor-pointer
          flex items-center justify-center
          text-xs font-bold
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900
          ${isCurrentStep ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900' : ''}
          ${
            active && colors
              ? `${colors.bg} ${colors.border} ${colors.hover} ${colors.ring} ${colors.text}`
              : active
                ? 'bg-amber-500/80 border-amber-400 hover:bg-amber-400 focus:ring-amber-400 text-amber-100'
                : isCurrentStep
                  ? 'bg-emerald-900/50 border-emerald-600 hover:bg-slate-700 focus:ring-slate-400'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 focus:ring-slate-400'
          }
        `}
        style={{ width: cellWidth }}
        role="gridcell"
        aria-pressed={active}
        aria-label={`Step ${stepIndex + 1}, ${active ? `active, ${fingerDisplay}` : 'inactive'}. Right-click to edit finger.`}
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
        />
      )}
    </>
  );
});
