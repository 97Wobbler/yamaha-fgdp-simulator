/**
 * PlaybackControls - Play/Stop button and playback state display
 *
 * Story 3.2: Play/Stop Controls
 * Story 3.3: BPM Control
 */

import { memo, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { usePlaybackStore, MIN_BPM, MAX_BPM } from '../../stores/usePlaybackStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useThemeStore } from '../../stores/useThemeStore';

/**
 * Play icon (triangle pointing right)
 */
function PlayIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * Pause icon (two vertical bars)
 */
function PauseIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

/**
 * Stop icon (square)
 */
function StopIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );
}

/**
 * PlaybackControls component
 */
export const PlaybackControls = memo(function PlaybackControls() {
  const { isPlaying, isPaused, play, pause, stop, bpm, setBpm, adjustBpm } = usePlaybackStore();
  const { isAudioReady, isLoading: isAudioLoading, initAudio } = useAudioStore();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'fgdp-50';

  // Disable playback if audio not ready
  const canPlay = isAudioReady && !isAudioLoading;

  // Handle play with audio initialization
  const handlePlay = useCallback(async () => {
    // If audio is not ready, initialize it first
    // App.tsx handleFirstInteraction will also trigger on click, but we ensure it here
    if (!isAudioReady && !isAudioLoading) {
      await initAudio();
    }
    // Play will be handled after audio is ready via App.tsx or on next click
    // For now, just trigger play - if audio isn't ready, it will be disabled
    if (isAudioReady || isAudioLoading) {
      // Wait a bit for audio to be ready if it's loading
      if (isAudioLoading) {
        // Audio is initializing, play will be enabled after it's ready
        return;
      }
      play();
    }
  }, [isAudioReady, isAudioLoading, initAudio, play]);

  // Handle BPM input change
  const handleBpmChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value)) {
        setBpm(value);
      }
    },
    [setBpm]
  );

  // Handle BPM keyboard navigation
  const handleBpmKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustBpm(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustBpm(-1);
      }
    },
    [adjustBpm]
  );

  // Theme-aware button styles
  const buttonBase = isDark
    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
    : 'bg-slate-200 hover:bg-slate-300 text-slate-700';

  const ringOffset = isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-slate-100';

  return (
    <div className="flex items-center gap-2">
      {/* Play Button */}
      <button
        type="button"
        onClick={handlePlay}
        disabled={isPlaying}
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2 ${ringOffset}
          ${
            isPlaying
              ? 'bg-emerald-500 text-white ring-2 ring-emerald-400'
              : `${buttonBase} focus:ring-slate-400`
          }
        `}
        aria-label="Start playback"
      >
        <PlayIcon />
      </button>

      {/* Pause Button */}
      <button
        type="button"
        onClick={pause}
        disabled={!isPlaying || !canPlay}
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2 ${ringOffset}
          ${
            isPaused
              ? 'bg-amber-500 text-white ring-2 ring-amber-400'
              : `${buttonBase} focus:ring-slate-400`
          }
        `}
        aria-label="Pause playback"
      >
        <PauseIcon />
      </button>

      {/* Stop Button */}
      <button
        type="button"
        onClick={stop}
        disabled={(!isPlaying && !isPaused) || !canPlay}
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2 ${ringOffset}
          ${buttonBase} focus:ring-slate-400
        `}
        aria-label="Stop playback"
      >
        <StopIcon />
      </button>

      {/* BPM Control */}
      <div className="flex items-center gap-2 ml-2">
        <button
          type="button"
          onClick={() => adjustBpm(-5)}
          className={`
            w-6 h-6 rounded text-sm font-bold
            focus:outline-none focus:ring-2 focus:ring-slate-400
            ${buttonBase}
          `}
          aria-label="Decrease BPM by 5"
        >
          -
        </button>

        <div className="flex items-center gap-1">
          <label htmlFor="bpm-input" className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            BPM:
          </label>
          <input
            id="bpm-input"
            type="number"
            value={bpm}
            onChange={handleBpmChange}
            onKeyDown={handleBpmKeyDown}
            min={MIN_BPM}
            max={MAX_BPM}
            className={`
              w-14 px-1 py-0.5 rounded text-sm font-mono text-center
              focus:outline-none focus:ring-2 focus:ring-slate-400
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              ${isDark
                ? 'bg-slate-800 border border-slate-600 text-slate-200 focus:border-slate-400'
                : 'bg-white border border-slate-300 text-slate-800 focus:border-slate-400'
              }
            `}
            aria-label={`BPM: ${bpm}. Use arrow keys to adjust.`}
          />
        </div>

        <button
          type="button"
          onClick={() => adjustBpm(5)}
          className={`
            w-6 h-6 rounded text-sm font-bold
            focus:outline-none focus:ring-2 focus:ring-slate-400
            ${buttonBase}
          `}
          aria-label="Increase BPM by 5"
        >
          +
        </button>
      </div>
    </div>
  );
});
