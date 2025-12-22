/**
 * PatternNameEditor Component
 *
 * Story 4.4: Pattern Name Editor
 * - Inline editing of pattern name
 * - Click to edit, Enter/blur to save
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePatternStore } from '../../stores/usePatternStore';

export function PatternNameEditor() {
  const currentPattern = usePatternStore((state) => state.currentPattern);
  const setPatternName = usePatternStore((state) => state.setPatternName);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Enter edit mode
  const handleStartEdit = useCallback(() => {
    if (!currentPattern) return;
    setEditValue(currentPattern.name);
    setIsEditing(true);
  }, [currentPattern]);

  // Save and exit edit mode
  const handleSave = useCallback(() => {
    setPatternName(editValue);
    setIsEditing(false);
  }, [editValue, setPatternName]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        // Cancel editing
        setIsEditing(false);
      }
    },
    [handleSave]
  );

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!currentPattern) {
    return null;
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="text-sm font-medium text-slate-200 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 w-48"
        placeholder="Pattern name"
        maxLength={50}
      />
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded px-2 py-0.5 transition-colors cursor-text"
      title="Click to edit name"
    >
      {currentPattern.name}
    </button>
  );
}
