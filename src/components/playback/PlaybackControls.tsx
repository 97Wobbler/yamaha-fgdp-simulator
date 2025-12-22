/**
 * PlaybackControls - Play/Stop button and playback state display
 *
 * Story 3.2: Play/Stop Controls
 * Story 3.3: BPM Control
 */

import { memo, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { usePlaybackStore, MIN_BPM, MAX_BPM } from '../../stores/usePlaybackStore';
import { useAudioStore } from '../../stores/useAudioStore';

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
  const { isPlaying, toggle, bpm, setBpm, adjustBpm } = usePlaybackStore();
  const { isAudioReady, isLoading: isAudioLoading, error: audioError } = useAudioStore();

  // Disable playback if audio not ready
  const canPlay = isAudioReady && !isAudioLoading;

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

  return (
    <div className="flex items-center gap-4">
      {/* Play/Stop Button */}
      <button
        type="button"
        onClick={toggle}
        disabled={!canPlay}
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-full
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
          ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-400 focus:ring-rose-400 text-white'
              : canPlay
                ? 'bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-400 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }
        `}
        aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
      >
        {isPlaying ? <StopIcon /> : <PlayIcon />}
      </button>

      {/* BPM Control */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => adjustBpm(-5)}
          className="
            w-6 h-6 rounded
            bg-slate-700 hover:bg-slate-600
            text-slate-300 text-sm font-bold
            focus:outline-none focus:ring-2 focus:ring-slate-400
          "
          aria-label="Decrease BPM by 5"
        >
          -
        </button>

        <div className="flex items-center gap-1">
          <label htmlFor="bpm-input" className="text-slate-400 text-sm">
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
            className="
              w-14 px-1 py-0.5
              bg-slate-800 border border-slate-600 rounded
              text-slate-200 text-sm font-mono text-center
              focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            "
            aria-label={`BPM: ${bpm}. Use arrow keys to adjust.`}
          />
        </div>

        <button
          type="button"
          onClick={() => adjustBpm(5)}
          className="
            w-6 h-6 rounded
            bg-slate-700 hover:bg-slate-600
            text-slate-300 text-sm font-bold
            focus:outline-none focus:ring-2 focus:ring-slate-400
          "
          aria-label="Increase BPM by 5"
        >
          +
        </button>
      </div>

      {/* Audio Status */}
      <div className="text-xs">
        {!isAudioReady && !isAudioLoading && (
          <span className="text-slate-500">Click to enable audio</span>
        )}
        {isAudioLoading && (
          <span className="text-amber-400 animate-pulse">Loading...</span>
        )}
        {audioError && <span className="text-rose-400">{audioError}</span>}
      </div>
    </div>
  );
});
