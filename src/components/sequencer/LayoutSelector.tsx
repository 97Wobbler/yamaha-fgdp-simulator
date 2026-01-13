/**
 * LayoutSelector - Dropdown to select track layout view
 */

import { memo } from 'react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { LAYOUT_NAMES, type LayoutView } from '../../config/layoutViews';

interface LayoutSelectorProps {
  isDark: boolean;
}

export const LayoutSelector = memo(function LayoutSelector({ isDark }: LayoutSelectorProps) {
  const { currentLayout, setLayout } = useLayoutStore();

  const labelColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const selectStyle = isDark
    ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-slate-500'
    : 'bg-white border-slate-300 text-slate-700 focus:ring-slate-400';

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs ${labelColor}`}>Layout:</span>
      <select
        value={currentLayout}
        onChange={(e) => setLayout(e.target.value as LayoutView)}
        className={`
          border rounded
          text-xs
          px-1.5 py-0.5
          focus:outline-none focus:ring-1
          ${selectStyle}
        `}
      >
        {Object.entries(LAYOUT_NAMES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
});
