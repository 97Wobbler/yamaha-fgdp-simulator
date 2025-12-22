/**
 * ShareButton Component
 *
 * Story 4.2: Share Button and URL Generation
 * - Encodes current pattern to URL
 * - Copies to clipboard
 * - Shows "Copied!" feedback
 */

import { useState, useCallback } from 'react';
import { usePatternStore } from '../../stores/usePatternStore';
import { encodePattern } from '../../utils/patternUrl';

type ShareState = 'idle' | 'copied' | 'error' | 'show-url';

/**
 * Share icon (link/share symbol)
 */
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

/**
 * Check icon for success state
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export function ShareButton() {
  const currentPattern = usePatternStore((state) => state.currentPattern);
  const [state, setState] = useState<ShareState>('idle');
  const [shareUrl, setShareUrl] = useState<string>('');

  const handleShare = useCallback(async () => {
    if (!currentPattern) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      return;
    }

    // Encode pattern
    const encoded = encodePattern(currentPattern);
    if (!encoded) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      return;
    }

    // Build URL
    const url = `${window.location.origin}${window.location.pathname}?pattern=${encoded}`;

    // Try clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setState('copied');
        setTimeout(() => setState('idle'), 2000);
        return;
      } catch {
        // Clipboard API failed, fall through to modal
      }
    }

    // Fallback: show URL in modal-like state
    setShareUrl(url);
    setState('show-url');
  }, [currentPattern]);

  const handleCloseUrl = useCallback(() => {
    setState('idle');
    setShareUrl('');
  }, []);

  // Show URL fallback modal
  if (state === 'show-url') {
    return (
      <div className="relative">
        <div className="absolute right-0 top-full mt-2 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 w-72">
          <p className="text-xs text-slate-400 mb-2">Copy this URL:</p>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded text-slate-200 font-mono"
            onFocus={(e) => e.target.select()}
            autoFocus
          />
          <button
            onClick={handleCloseUrl}
            className="mt-2 w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            Close
          </button>
        </div>
        <button
          className="flex items-center justify-center gap-1.5 w-24 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg"
          disabled
        >
          <ShareIcon className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    );
  }

  // Button text and style based on state
  const buttonText =
    state === 'copied' ? 'Copied!' : state === 'error' ? 'Error' : 'Share';
  const buttonClass =
    state === 'copied'
      ? 'bg-emerald-600 border-emerald-500 text-white'
      : state === 'error'
        ? 'bg-rose-600 border-rose-500 text-white'
        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600';

  return (
    <button
      onClick={handleShare}
      disabled={!currentPattern || state !== 'idle'}
      className={`flex items-center justify-center gap-1.5 w-24 py-1.5 text-sm rounded-lg border transition-all duration-200 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
      title={currentPattern ? 'Copy pattern URL' : 'No pattern'}
    >
      {state === 'copied' ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <ShareIcon className="w-4 h-4" />
      )}
      <span>{buttonText}</span>
    </button>
  );
}
