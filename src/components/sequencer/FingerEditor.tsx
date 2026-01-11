/**
 * FingerEditor - Popover for editing finger designation
 *
 * Allows users to change the hand (L/R) and finger number (1-5)
 * for an active step cell.
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import type { FingerDesignation } from '../../types/pattern';

interface FingerEditorProps {
  /** Current finger designation */
  currentFinger: FingerDesignation;
  /** Callback when finger is changed */
  onFingerChange: (finger: FingerDesignation) => void;
  /** Callback to close the editor */
  onClose: () => void;
  /** Position for the popover */
  position: { x: number; y: number };
  /** Dark theme mode */
  isDark?: boolean;
}

const HANDS: Array<'L' | 'R'> = ['L', 'R'];
const FINGERS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

/**
 * FingerEditor popover component
 */
export const FingerEditor = memo(function FingerEditor({
  currentFinger,
  onFingerChange,
  onClose,
  position,
  isDark = true,
}: FingerEditorProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid immediate close from the triggering click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleHandChange = useCallback(
    (hand: 'L' | 'R') => {
      onFingerChange({ hand, finger: currentFinger.finger });
    },
    [currentFinger.finger, onFingerChange]
  );

  const handleFingerChange = useCallback(
    (finger: 1 | 2 | 3 | 4 | 5) => {
      onFingerChange({ hand: currentFinger.hand, finger });
      onClose();
    },
    [currentFinger.hand, onFingerChange, onClose]
  );

  // Theme-aware styles
  const popoverStyle = isDark
    ? 'bg-slate-800 border-slate-600'
    : 'bg-white border-slate-300';
  const labelStyle = isDark ? 'text-slate-400' : 'text-slate-500';
  const inactiveButtonStyle = isDark
    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div
      ref={popoverRef}
      className={`
        fixed z-50
        border rounded-lg shadow-xl
        p-3 min-w-[140px]
        ${popoverStyle}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      role="dialog"
      aria-label="Edit finger designation"
    >
      {/* Hand selection */}
      <div className="mb-3">
        <div className={`text-xs mb-1 ${labelStyle}`}>Hand</div>
        <div className="flex gap-1">
          {HANDS.map((hand) => (
            <button
              key={hand}
              type="button"
              onClick={() => handleHandChange(hand)}
              className={`
                flex-1 py-1 px-2 rounded text-sm font-medium
                transition-colors
                ${
                  currentFinger.hand === hand
                    ? hand === 'R'
                      ? 'bg-rose-500 text-white'
                      : 'bg-sky-500 text-white'
                    : inactiveButtonStyle
                }
              `}
            >
              {hand === 'L' ? 'Left' : 'Right'}
            </button>
          ))}
        </div>
      </div>

      {/* Finger selection */}
      <div>
        <div className={`text-xs mb-1 ${labelStyle}`}>Finger</div>
        <div className="flex gap-1">
          {FINGERS.map((finger) => (
            <button
              key={finger}
              type="button"
              onClick={() => handleFingerChange(finger)}
              className={`
                flex-1 py-1 px-2 rounded text-sm font-medium
                transition-colors
                ${
                  currentFinger.finger === finger
                    ? currentFinger.hand === 'R'
                      ? 'bg-rose-500 text-white'
                      : 'bg-sky-500 text-white'
                    : inactiveButtonStyle
                }
              `}
            >
              {finger}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
