import { useCallback, useEffect } from 'react';
import { PadVisualizer } from './components/visualization/PadVisualizer';
import { StepSequencer } from './components/sequencer';
import { PlaybackControls } from './components/playback';
import { ShareButton, GitHubLink } from './components/sharing';
import { ToastContainer } from './components/ui/Toast';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { useAudioStore } from './stores/useAudioStore';
import { useToastStore } from './stores/useToastStore';
import { useThemeStore } from './stores/useThemeStore';
import { useSelectionStore } from './stores/useSelectionStore';
import { APP_VERSION } from './config/version';
import { usePlaybackStore } from './stores/usePlaybackStore';
import { useUrlPatternLoader, useUrlSync } from './hooks';

/**
 * Main Application Layout
 *
 * Layout:
 * - Header: Title + Version + GitHub (left) | PlaybackControls (center) | Share + Theme (right)
 * - Main: Step Sequencer (top, ~60%) + Visualizer (bottom, ~40%)
 * - No footer, no page scroll (viewport fixed)
 *
 * Story 2.5: Audio initialization on first interaction
 * Story 3.4: Global keyboard shortcuts
 * Story 4.3: URL Pattern Loading
 */
function App() {
  const { isAudioReady, isLoading: isAudioLoading, error: audioError, initAudio } = useAudioStore();
  const showToast = useToastStore((state) => state.showToast);
  const theme = useThemeStore((state) => state.theme);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const play = usePlaybackStore((state) => state.play);
  const pause = usePlaybackStore((state) => state.pause);
  const adjustBpm = usePlaybackStore((state) => state.adjustBpm);
  const seekForward = usePlaybackStore((state) => state.seekForward);
  const seekBackward = usePlaybackStore((state) => state.seekBackward);
  const toggleLoop = usePlaybackStore((state) => state.toggleLoop);

  // Selection store for copy/paste
  const {
    copySelection,
    pasteAtPlayhead,
    clearSelection,
    selectionStart,
  } = useSelectionStore();

  // Story 4.3: Load pattern from URL
  const { error: urlError } = useUrlPatternLoader();

  // Show URL error as toast
  useEffect(() => {
    if (urlError) {
      showToast(urlError, 'error');
    }
  }, [urlError, showToast]);

  // Show audio error as toast
  useEffect(() => {
    if (audioError) {
      showToast(audioError, 'error');
    }
  }, [audioError, showToast]);

  // Story 4.6: Sync pattern changes to URL in real-time
  useUrlSync();

  // Initialize audio on first click anywhere in the app
  const handleFirstInteraction = useCallback(() => {
    if (!isAudioReady && !isAudioLoading) {
      initAudio();
    }
  }, [isAudioReady, isAudioLoading, initAudio]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on input/textarea
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Escape: Clear selection
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      // Cmd/Ctrl + C: Copy selection
      if (modifierKey && e.key === 'c') {
        if (selectionStart) {
          e.preventDefault();
          copySelection();
          showToast('Copied to clipboard', 'success');
        }
        return;
      }

      // Cmd/Ctrl + V: Paste at playhead
      if (modifierKey && e.key === 'v') {
        e.preventDefault();
        pasteAtPlayhead();
        return;
      }

      // Space: Toggle play/pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        if (isPlaying) {
          pause();
        } else {
          play();
        }
        return;
      }

      // Left/Right Arrow: Seek backward/forward (when not playing)
      if (e.key === 'ArrowLeft' && !isPlaying) {
        e.preventDefault();
        seekBackward();
        return;
      }
      if (e.key === 'ArrowRight' && !isPlaying) {
        e.preventDefault();
        seekForward();
        return;
      }

      // Up/Down Arrow: Adjust BPM by 5
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

      // L: Toggle loop
      if (e.key === 'l' || e.key === 'L') {
        toggleLoop();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, adjustBpm, seekForward, seekBackward, toggleLoop, copySelection, pasteAtPlayhead, clearSelection, selectionStart, showToast]);

  const isDark = theme === 'fgdp-50';

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden ${
        isDark
          ? 'bg-slate-950 text-slate-50'
          : 'bg-slate-100 text-slate-900'
      }`}
      onClick={handleFirstInteraction}
    >
      {/* Header: Title + Version + GitHub (left) | PlaybackControls (center) | Share + Theme (right) */}
      <header className={`px-4 lg:px-6 py-4 shrink-0 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-300'
      }`}>
        <div className="flex items-center">
          {/* Left: Title + Version + GitHub */}
          <div className="w-40 lg:w-48 shrink-0 flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-semibold tracking-tight">
              FGDP Trainer
            </h1>
            <span className={`text-xs hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              v{APP_VERSION}
            </span>
            <GitHubLink />
          </div>

          {/* Center: Playback Controls */}
          <div className="flex-1 flex justify-center">
            <PlaybackControls />
          </div>

          {/* Right: Share + Theme */}
          <div className="w-40 lg:w-48 shrink-0 flex items-center justify-end gap-2">
            <ShareButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area: Vertical split (no scroll) */}
      <main className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">
        {/* Top: Step Sequencer (~60%, internal scroll) */}
        <section
          className={`flex-[3] min-h-0 rounded-lg border overflow-auto ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-300'
          }`}
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

      {/* Audio Status Indicator */}
      {!isAudioReady && !isAudioLoading && !audioError && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm rounded-lg shadow-lg z-40 ${
            isDark
              ? 'bg-slate-800 border border-slate-700 text-slate-300'
              : 'bg-white border border-slate-300 text-slate-600'
          }`}
          role="status"
        >
          Click anywhere to enable audio
        </div>
      )}
      {isAudioLoading && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg shadow-lg flex items-center gap-2 z-40"
          role="status"
        >
          <span className="animate-pulse">Loading audio...</span>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
