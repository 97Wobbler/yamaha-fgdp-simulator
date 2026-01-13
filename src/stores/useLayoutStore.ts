/**
 * Layout Store - Manages track layout view state
 *
 * Controls which track ordering view is active:
 * - Default: Original FGDP-50 layout
 * - Right Hand: Right-hand optimized order
 * - Left Hand: Left-hand optimized order
 * - Simplified: Merged L/R tracks (13 instead of 18)
 */

import { create } from 'zustand';
import type { LayoutView } from '../config/layoutViews';

interface LayoutState {
  /** Current layout view */
  currentLayout: LayoutView;
}

interface LayoutActions {
  /** Set the layout view */
  setLayout: (layout: LayoutView) => void;
}

type LayoutStore = LayoutState & LayoutActions;

export const useLayoutStore = create<LayoutStore>((set) => ({
  // Initial state - default layout
  currentLayout: 'default',

  // Actions
  setLayout: (layout: LayoutView) => {
    set({ currentLayout: layout });
  },
}));
