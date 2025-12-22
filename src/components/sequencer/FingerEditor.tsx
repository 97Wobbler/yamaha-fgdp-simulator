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

  return (
    <div
      ref={popoverRef}
      className="
        fixed z-50
        bg-slate-800 border border-slate-600 rounded-lg shadow-xl
        p-3 min-w-[140px]
      "
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      role="dialog"
      aria-label="Edit finger designation"
    >
      {/* Hand selection */}
      <div className="mb-3">
        <div className="text-xs text-slate-400 mb-1">Hand</div>
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
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
        <div className="text-xs text-slate-400 mb-1">Finger</div>
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
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
