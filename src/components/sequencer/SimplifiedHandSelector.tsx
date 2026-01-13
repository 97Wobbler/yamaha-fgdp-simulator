/**
 * SimplifiedHandSelector - Popup to select hand (R/L) for merged tracks in simplified view
 */

import { memo, useCallback, useEffect, useRef } from 'react';

export interface HandSelection {
  trackId: string;
  stepIndex: number;
  position: { x: number; y: number };
}

interface SimplifiedHandSelectorProps {
  selection: HandSelection;
  onSelect: (hand: 'L' | 'R') => void;
  onClose: () => void;
  isDark: boolean;
}

export const SimplifiedHandSelector = memo(function SimplifiedHandSelector({
  selection,
  onSelect,
  onClose,
  isDark,
}: SimplifiedHandSelectorProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSelectRight = useCallback(() => {
    onSelect('R');
  }, [onSelect]);

  const handleSelectLeft = useCallback(() => {
    onSelect('L');
  }, [onSelect]);

  const bgColor = isDark ? 'bg-slate-700' : 'bg-white';
  const borderColor = isDark ? 'border-slate-600' : 'border-slate-300';
  const textColor = isDark ? 'text-slate-200' : 'text-slate-700';
  const hoverBg = isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100';

  return (
    <div
      ref={popupRef}
      className={`
        fixed z-50
        ${bgColor} ${borderColor} ${textColor}
        border rounded-lg shadow-lg
        py-1 min-w-[80px]
      `}
      style={{
        left: selection.position.x,
        top: selection.position.y,
      }}
    >
      <button
        onClick={handleSelectRight}
        className={`
          w-full px-4 py-2 text-left text-sm
          ${hoverBg}
          flex items-center gap-2
        `}
      >
        <span className="font-mono font-bold text-blue-500">R</span>
        <span>Right Hand</span>
      </button>
      <button
        onClick={handleSelectLeft}
        className={`
          w-full px-4 py-2 text-left text-sm
          ${hoverBg}
          flex items-center gap-2
        `}
      >
        <span className="font-mono font-bold text-orange-500">(L)</span>
        <span>Left Hand</span>
      </button>
    </div>
  );
});
