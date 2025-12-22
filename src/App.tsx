import { useCallback, useEffect } from 'react';
import { PadVisualizer } from './components/visualization/PadVisualizer';
import { StepSequencer } from './components/sequencer';
import { PlaybackControls } from './components/playback';
import { ShareButton } from './components/sharing';
import { useAudioStore } from './stores/useAudioStore';
import { APP_VERSION } from './config/version';
import { usePlaybackStore } from './stores/usePlaybackStore';
import { useUrlPatternLoader, useUrlSync } from './hooks';

/**
 * Main Application Layout
 *
 * New Layout (2025-01):
 * - Header: Title (left) + PlaybackControls (center) + ShareButton (right)
 * - Main: Step Sequencer (top, ~60%) + Visualizer (bottom, ~40%)
 * - No footer, no page scroll (viewport fixed)
 *
 * Story 2.5: Audio initialization on first interaction
 * Story 3.4: Global keyboard shortcuts
 * Story 4.3: URL Pattern Loading
 */
function App() {
  const { isAudioReady, isLoading, initAudio } = useAudioStore();
  const toggle = usePlaybackStore((state) => state.toggle);
  const adjustBpm = usePlaybackStore((state) => state.adjustBpm);

  // Story 4.3: Load pattern from URL
  const { error: urlError, clearError: clearUrlError } = useUrlPatternLoader();

  // Story 4.6: Sync pattern changes to URL in real-time
  useUrlSync();

  // Initialize audio on first click anywhere in the app
  const handleFirstInteraction = useCallback(() => {
    if (!isAudioReady && !isLoading) {
      initAudio();
    }
  }, [isAudioReady, isLoading, initAudio]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on input/textarea
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        return;
      }

      // Space: Toggle play/stop
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        toggle();
        return;
      }

      // Arrow keys: Adjust BPM by 5
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustBpm(5);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustBpm(-5);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, adjustBpm]);

  return (
    <div
      className="h-screen bg-slate-950 text-slate-50 flex flex-col overflow-hidden"
      onClick={handleFirstInteraction}
    >
      {/* Header: Title + PlaybackControls (center) + ShareButton */}
      <header className="border-b border-slate-800 px-4 lg:px-6 py-3 shrink-0">
        <div className="flex items-center">
          {/* Left: Title (fixed width to balance right side) */}
          <div className="w-32 lg:w-40 shrink-0">
            <h1 className="text-base lg:text-lg font-semibold tracking-tight">
              FGDP Trainer
            </h1>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex-1 flex justify-center">
            <PlaybackControls />
          </div>

          {/* Right: Share + Version (fixed width to match left) */}
          <div className="w-32 lg:w-40 shrink-0 flex items-center justify-end gap-3">
            <ShareButton />
            <span className="text-xs text-slate-400 hidden sm:inline">v{APP_VERSION}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Vertical split (no scroll) */}
      <main className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">
        {/* Top: Step Sequencer (~60%, internal scroll) */}
        <section
          className="flex-[3] min-h-0 bg-slate-900 rounded-lg border border-slate-800 overflow-auto"
          aria-label="Step Sequencer Section"
        >
          <StepSequencer />
        </section>

        {/* Bottom: Pad Visualizer (~40%) */}
        <section
          className="flex-[2] min-h-0 flex items-center justify-center"
          aria-label="Pad Visualizer Section"
        >
          <PadVisualizer />
        </section>
      </main>

      {/* Story 4.3: URL Error Toast */}
      {urlError && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-rose-600 text-white text-sm rounded-lg shadow-lg flex items-center gap-2 z-50"
          role="alert"
        >
          <span>{urlError}</span>
          <button
            onClick={clearUrlError}
            className="ml-2 hover:bg-rose-700 rounded p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
