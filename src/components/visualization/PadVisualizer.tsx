import React, { FC, useEffect, useState, useRef, useCallback } from 'react';
import { usePlaybackStore } from '../../stores/usePlaybackStore';
import { usePatternStore } from '../../stores/usePatternStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { PAD_IDS, PADS, type PadId } from '../../config/padMapping';

/**
 * Calculate duration of half a 16th note in milliseconds
 * @param bpm - Current tempo in BPM
 * @returns Duration in milliseconds
 */
function getHalfStepDuration(bpm: number): number {
  // 1 beat = 60000ms / bpm
  // 1 16th note = 1 beat / 4
  // Half 16th note = 1 beat / 8
  return (60000 / bpm) / 8;
}

interface PadVisualizerProps {
  highlightedPads?: number[];
}

/**
 * Mapping from padId to SVG padIndex (1-based)
 * PAD_IDS array index + 1 = padIndex
 */
function getPadIndexFromId(padId: string): number {
  const index = PAD_IDS.indexOf(padId as (typeof PAD_IDS)[number]);
  return index >= 0 ? index + 1 : -1;
}

/**
 * Check if a padIndex corresponds to a long bar pad (snare, kick)
 */
function isLongBarPad(padIndex: number): boolean {
  const padId = PAD_IDS[padIndex - 1] as PadId;
  return padId ? PADS[padId]?.isLongBar ?? false : false;
}

/**
 * Pre-calculated center coordinates for each pad (1-18)
 * These are approximate centers of each SVG path's bounding box
 */
const PAD_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 180, y: 155 },
  2: { x: 300, y: 160 },
  3: { x: 420, y: 165 },
  4: { x: 540, y: 160 },
  5: { x: 660, y: 155 },
  6: { x: 175, y: 230 },
  7: { x: 420, y: 240 },
  8: { x: 665, y: 230 },
  9: { x: 175, y: 305 },
  10: { x: 255, y: 315 },
  11: { x: 320, y: 320 },
  12: { x: 420, y: 325 },
  13: { x: 520, y: 320 },
  14: { x: 590, y: 315 },
  15: { x: 665, y: 305 },
  16: { x: 175, y: 400 },
  17: { x: 420, y: 410 },
  18: { x: 665, y: 400 },
};

/**
 * Bounding box info for long bar pads (for L/R 1/3 position calculation)
 * minX, maxX used to calculate left (1/3) and right (2/3) positions
 */
const LONG_BAR_BOUNDS: Record<number, { minX: number; maxX: number; y: number }> = {
  7: { minX: 234, maxX: 608, y: 240 },   // Snare (row 2)
  17: { minX: 200, maxX: 640, y: 410 },  // Kick (row 4)
};

/** Fixed radius for circular gradients (in SVG units) */
const GRADIENT_RADIUS = 60;

/**
 * FGDP Pad Visualizer Component
 * Renders the 18-pad FGDP layout with data-pad-index attributes for each pad
 * Story 3.7: Highlights pads during playback based on current step
 */
export const PadVisualizer: FC<PadVisualizerProps> = ({ highlightedPads = [] }) => {
  // Story 3.7: Subscribe to playback and pattern stores
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const currentStep = usePlaybackStore((state) => state.currentStep);
  const bpm = usePlaybackStore((state) => state.bpm);
  const currentPattern = usePatternStore((state) => state.currentPattern);

  // Audio store for pad click sound playback
  const { playPad, isAudioReady, initAudio } = useAudioStore();

  // Track active pads with their hand designation for colored highlighting
  const [activePads, setActivePads] = useState<Map<number, 'L' | 'R'>>(new Map());
  // Track clicked pad for visual feedback
  const [clickedPad, setClickedPad] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle pad click to play sound
  const handlePadClick = useCallback(async (padIndex: number) => {
    // Initialize audio if not ready (browser autoplay policy)
    if (!isAudioReady) {
      await initAudio();
    }

    // Convert padIndex (1-based) to padId
    const padId = PAD_IDS[padIndex - 1];
    if (padId) {
      playPad(padId);

      // Visual feedback for click
      setClickedPad(padIndex);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        setClickedPad(null);
      }, 100);
    }
  }, [playPad, isAudioReady, initAudio]);

  // Handle keyboard activation (Enter/Space)
  const handlePadKeyDown = useCallback((e: React.KeyboardEvent, padIndex: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePadClick(padIndex);
    }
  }, [handlePadClick]);

  // Cleanup click timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Calculate which pads are active for the current step
  // Pads light up immediately and turn off after half a 16th note
  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!isPlaying || !currentPattern) {
      setActivePads(new Map());
      return;
    }

    // Set active pads immediately
    const newActivePads = new Map<number, 'L' | 'R'>();
    currentPattern.tracks.forEach((track) => {
      const step = track.steps[currentStep];
      if (step.active && step.finger) {
        const padIndex = getPadIndexFromId(track.padId);
        if (padIndex > 0) {
          newActivePads.set(padIndex, step.finger.hand);
        }
      }
    });
    setActivePads(newActivePads);

    // Turn off after half the 16th note duration
    if (newActivePads.size > 0) {
      const halfStepMs = getHalfStepDuration(bpm);
      timeoutRef.current = setTimeout(() => {
        setActivePads(new Map());
      }, halfStepMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isPlaying, currentStep, currentPattern, bpm]);

  // Get fill style based on hand designation
  // Returns either a class name or an inline fill URL for pad-specific gradients
  const getHighlightFill = (padIndex: number): { className: string; fill?: string } => {
    // Check if this pad was just clicked (for visual feedback)
    // Use white-to-gray gradient similar to playback gradients
    if (clickedPad === padIndex) {
      return { className: '', fill: `url(#radial-click-${padIndex})` };
    }
    // Check external highlight
    if (highlightedPads.includes(padIndex)) {
      return { className: 'pad-highlighted' };
    }
    // Check active pads from playback
    const hand = activePads.get(padIndex);
    if (!hand) return { className: '' };

    // Use pad-specific circular gradient with fixed radius
    const gradientId = hand === 'R' ? `radial-r-${padIndex}` : `radial-l-${padIndex}`;
    return { className: '', fill: `url(#${gradientId})` };
  };

  // SVG paths from res/pad.svg, each representing one FGDP pad (1-18)
  const padPaths = [
    "M237.9,121.8c9.1,3.3,11.9,8.2,10,17.9-2.6,13.3-5.2,26.6-7.9,39.8-1.4,7.2-7.6,11.6-14.9,10.5-27.9-4.2-55.6-9.1-83.1-15-8.2-1.7-12.4-6.9-12.5-15.3v-21.9c0-9.1,2.2-12.5,10.5-16,0,0,97.9,0,97.9,0Z",
    "M351.3,121.8c6.9,2.2,11.2,6.7,11.4,14.1.1,5.4-.6,10.8-1,16.1-.6,9-1.2,18-1.9,27-.3,4.6-.5,9.3-1.1,13.9-.8,6.3-6.8,10.4-13.5,9.7-8.5-.8-17-1.2-25.6-2-13.6-1.2-27.3-2.5-40.9-3.8-6.3-.6-12.5-1.4-18.8-2.2-6.7-.9-11-7.1-9.7-13.8,2.9-14.9,6-29.8,8.6-44.8,1.3-7.1,4.1-12.4,11.5-14.3h81Z",
    "M462.7,121.8c10.2,2.8,11.7,10.2,12.1,17.9.7,14.6,2,29.1,2.7,43.7.2,3.8,1.1,7.7,0,11.6-1.4,5.4-5.8,8.9-11.4,9.1-23.2.7-46.4.7-69.6.4-5.2,0-10.5-.2-15.7-.4-7.5-.2-12.3-6-11.7-13.4,1-12.7,1.7-25.5,2.6-38.2.4-6.3.8-12.6,1.6-18.8.8-6.6,5.4-10,11.3-11.8h78.1Z",
    "M574.6,121.8c7.3,2.3,10,7.7,11.3,14.9,2.6,14.7,5.8,29.3,8.7,44,1.4,7.1-2.7,13.4-9.9,14.3-11.4,1.5-22.9,2.6-34.4,3.7-13.1,1.2-26.3,2.3-39.4,3.4-3.3.3-6.6.6-9.9.5-7.4,0-11.5-5.1-12.3-14.1-1.2-14.7-2.6-29.4-3.9-44.1-.3-3.4-.8-6.8-.4-10.2.7-6.7,5.1-10.5,11.3-12.4h78.9Z",
    "M716.5,162.2c-1.6,9.2-8.1,12.3-16.5,13.9-26.1,5.1-52.3,9.9-78.6,13.9-7.9,1.2-13.9-3-15.4-11-2.7-13.2-5.3-26.4-7.9-39.6-1.9-9.5.9-14.4,10-17.7h97.9c5.9,1.9,9.4,5.8,10.5,12v28.4h0Z",
    "M143.9,184.7c7.3,1.4,15.4,3,23.5,4.6,17.9,3.6,36,6.6,54,9.4,8.5,1.3,13.3,8.1,11.7,16.5-3,15.2-6,30.5-9,45.7-1.3,6.7-7.1,10.6-13.9,9.5-22.3-3.6-44.5-7.8-66.7-12.3-10.4-2.1-13.9-6.4-13.9-17v-42.1c0-8.2,5.9-14.2,14.3-14.2h0Z",
    "M445.8,287.1c-7.7-.6-15.8.6-24,.4-16.2-.4-32.4-.4-48.6-1.1-17.5-.7-35-1.7-52.5-3-25.4-1.9-50.8-4.6-76-8-7.3-1-11.6-7-10.2-14.4,2.9-15.3,5.9-30.5,9-45.7,1.8-8.8,8.6-12.3,19.2-11.1,14.3,1.7,28.5,3.1,42.8,4.4,15,1.3,29.9,2.4,44.9,3.4,7.3.5,14.6.8,21.9,1,9.6.3,19.1.4,28.7.5,8.6.2,17.3.5,25.9.5,15.6-.2,31.3-.4,46.9-1,17.1-.7,34.2-1.7,51.2-3,19.5-1.5,39-3.3,58.5-5.8,10.7-1.4,16.5,2.9,18.6,13.5,2.8,14.3,5.7,28.7,8.6,43,1.6,7.9-2.8,13.7-10.8,14.8-18.6,2.6-37.3,4.5-55.9,6.3-12.2,1.2-24.5,1.8-36.8,2.6-15.1,1.1-30.2,1.7-45.3,2.1-5.2.1-10.5.2-16.1.4v.2Z",
    "M716.5,245.1c-1.4,9-7.6,11.9-15.6,13.4-21.5,4.2-43.1,8.3-64.7,11.9-7,1.2-12.7-2.4-14.1-9.3-3.2-15.7-6.4-31.4-9.3-47.2-1.4-7.4,3.7-13.9,11.5-15.1,25.8-4,51.5-8.6,77-13.9,6.1-1.3,12.4,3.1,14.4,9.7.3.9.5,1.7.8,2.6v47.9h0Z",
    "M129.5,300.2v-18.5c0-9.8,8-16.3,17.6-14.3,19.4,4,38.8,7.5,58.3,11,8.9,1.6,13.5,8.5,11.8,17.4-2.4,12.4-4.8,24.8-7.3,37.2-1.6,7.8-8.9,12.5-16.8,11.1-17.3-3.1-34.6-6.8-51.8-10.7-7.1-1.6-11.7-7.1-11.8-14.4v-18.7h0Z",
    "M283.8,302.7c-1,8-2.1,17.6-3.2,27.1-.6,4.8-1.1,9.6-1.8,14.3-1,6.8-7.7,11.6-14.5,10.6-10.8-1.5-21.5-3-32.3-4.3-8.3-1-13.4-7.6-11.8-15.8,2.6-13.4,5.2-26.7,7.8-40.1,1.5-7.5,7.9-11.5,16.2-10.4,9.1,1.2,18.3,2.4,27.4,3.4,7.7.9,12.3,5.9,12.3,15.2h-.1Z",
    "M289.4,344.8c1.2-8.8,2.4-18.5,3.7-28.1.6-4.5,1.3-9,1.8-13.6.8-7,5.9-11.9,12.9-11.6,10.4.4,20.7,1.1,31.1,2.1,7.9.7,13.2,8.6,12.3,16.5-1,8.4-1.2,16.9-1.8,25.3-.3,5-.5,9.9-1.1,14.9-.8,6.8-7.5,11.5-14.4,10.8-9.8-1-19.7-1.7-29.5-2.2-9.1-.5-15-5.4-14.9-14.1h-.1Z",
    "M459.9,363.2c-19.5,1.1-39.2.6-58.9.6s-21.1-.5-31.6-1c-7.1-.3-12.2-6.6-11.7-13.8.9-12.9,1.8-25.8,2.6-38.7.6-9.3,6.2-15,15.5-14.8,14.5.2,28.9.8,43.4.9,14.7,0,29.4-.2,44.1-.5,4.2,0,8.5-1,12.6.5,6.8,2.4,9.3,7.9,9.7,14.6.8,13,1.5,26,2,39,.3,7.6-5.2,12.8-12.8,12.9-4.9,0-9.8,1-14.9.4h0Z",
    "M514.7,360.9c-12.3,0-17.2-5.1-17.6-14.8-.5-12.5-1.3-25-2.2-37.5-.4-6,4-12.6,10-14.2,4.5-1.2,9.2-.9,13.9-1.4,5.9-.6,11.8-.8,17.6-1.5,7.8-.9,14.2,3.7,15.3,11.5,1.9,13.3,3.7,26.6,5.4,40,1.1,8.8-4.4,14.8-13.3,15.4-10.6.7-21.2,1.8-29.1,2.4h0Z",
    "M582.8,354.4c-10.9,0-15.1-4.7-16.2-15-1.3-12.4-2.9-24.7-4.4-37.1-.8-6.2,3.5-12.9,9.9-13.9,10.8-1.7,21.7-3,32.6-3.9,6.6-.6,11.6,4,12.9,10.5,2.6,12.9,5.3,25.7,7.8,38.6,1.7,8.5-2.4,14.9-11,16.3-11.3,1.8-22.7,3.2-31.6,4.4h0Z",
    "M716.5,319.9c-1.7,11.3-10.7,12.9-19.6,14.8-14.6,3-29.2,6-43.8,8.9-8.6,1.7-15.3-2.6-17.1-11.2-2.6-12.4-5.1-24.7-7.3-37.2-1.5-8.2,3.7-14.9,12-16.3,18.5-3.2,37-6.4,55.4-10.3,11.4-2.4,16.4.6,20.3,12.4v38.9h0Z",
    "M129.5,397.3c0-13.3.2-26.6,0-39.9-.2-9.2,7.8-16.2,17.3-13.7,14.9,3.9,30,6.6,45.1,9.6,8,1.6,12.4,7.7,10.9,15.7-4.7,24.7-9.6,49.4-14.5,74.1-1.2,6.2-4.5,8.7-10.9,8.7h-33.7c-9.2,0-14.1-5-14.1-14.2v-40.2h0Z",
    "M422.7,451.7h-209.3c-9.7,0-14.9-6.1-13.1-15.5,4.3-22.4,8.7-44.9,13.1-67.3,1.3-6.7,7.8-10.8,14.6-9.8,16.8,2.5,33.7,4.7,50.7,6.2,16.8,1.5,33.5,3.1,50.3,4.4,11.5.8,23.1,1,34.6,1.6,14,.8,28.1.5,42.1,1.1,18.3.9,36.6-.3,54.9-.3s30.4-.9,45.5-1.9c22.4-1.5,44.9-3.2,67.2-5.8,14.5-1.7,29-3.5,43.5-5.5,8.4-1.2,14.1,2.9,15.8,11.2,4.5,22.1,9,44.3,13.4,66.5,1.7,8.4-3.9,15.1-12.4,15.1h-211,.1Z",
    "M716.5,439.7c-1,5.2-3.5,9.3-8.6,11.3-1.4.5-2.7.6-4.1.6h-35.9c-5.3,0-9.1-2.9-10.1-8.1-5-25.5-10-51-14.9-76.5-1.2-6.1,3.7-12.7,10.4-14,15.8-3.1,31.6-6.4,47.3-10,7.6-1.8,14.1,2.9,15.6,10.5,0,.5.3.9.5,1.4v84.8h-.2Z",
  ];

  return (
    <div
      className="w-full h-full max-w-2xl mx-auto p-4 flex items-center justify-center"
      data-testid="pad-visualizer"
    >
      <svg
        viewBox="115 110 605 355"
        className="w-full h-full max-h-full object-contain"
        aria-label="FGDP Pad Layout"
      >
        <defs>
          {/* Generate fixed-radius circular gradients for each pad */}
          {Array.from({ length: 18 }, (_, i) => {
            const padIndex = i + 1;
            const center = PAD_CENTERS[padIndex];
            const longBarBounds = LONG_BAR_BOUNDS[padIndex];

            // For long bar pads, create L/R gradients at 1/3 and 2/3 positions
            if (longBarBounds) {
              const width = longBarBounds.maxX - longBarBounds.minX;
              const leftX = longBarBounds.minX + width / 3;
              const rightX = longBarBounds.minX + (width * 2) / 3;
              const centerX = longBarBounds.minX + width / 2;
              return (
                <React.Fragment key={padIndex}>
                  {/* Right hand: 2/3 position */}
                  <radialGradient
                    id={`radial-r-${padIndex}`}
                    gradientUnits="userSpaceOnUse"
                    cx={rightX}
                    cy={longBarBounds.y}
                    r={GRADIENT_RADIUS}
                  >
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </radialGradient>
                  {/* Left hand: 1/3 position */}
                  <radialGradient
                    id={`radial-l-${padIndex}`}
                    gradientUnits="userSpaceOnUse"
                    cx={leftX}
                    cy={longBarBounds.y}
                    r={GRADIENT_RADIUS}
                  >
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                  </radialGradient>
                  {/* Click gradient: center position (white center, gray outer) */}
                  <radialGradient
                    id={`radial-click-${padIndex}`}
                    gradientUnits="userSpaceOnUse"
                    cx={centerX}
                    cy={longBarBounds.y}
                    r={GRADIENT_RADIUS}
                  >
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#9ca3af" />
                  </radialGradient>
                </React.Fragment>
              );
            }

            // Regular pads: centered gradient
            return (
              <React.Fragment key={padIndex}>
                {/* Right hand gradient for this pad */}
                <radialGradient
                  id={`radial-r-${padIndex}`}
                  gradientUnits="userSpaceOnUse"
                  cx={center.x}
                  cy={center.y}
                  r={GRADIENT_RADIUS}
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </radialGradient>
                {/* Left hand gradient for this pad */}
                <radialGradient
                  id={`radial-l-${padIndex}`}
                  gradientUnits="userSpaceOnUse"
                  cx={center.x}
                  cy={center.y}
                  r={GRADIENT_RADIUS}
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </radialGradient>
                {/* Click gradient for this pad (white center, gray outer) */}
                <radialGradient
                  id={`radial-click-${padIndex}`}
                  gradientUnits="userSpaceOnUse"
                  cx={center.x}
                  cy={center.y}
                  r={GRADIENT_RADIUS}
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </radialGradient>
              </React.Fragment>
            );
          })}
          <style>
            {`
              .pad-default {
                fill: #707070;
                stroke-width: 0px;
                cursor: pointer;
                transition: filter 0.1s ease;
              }
              .pad-default:hover {
                filter: brightness(1.2);
              }
              .pad-default:focus {
                outline: none;
              }
              .pad-highlighted {
                fill: #3b82f6;
              }
            `}
          </style>
        </defs>
        {padPaths.map((d, index) => {
          const padIndex = index + 1;
          const highlight = getHighlightFill(padIndex);
          const padId = PAD_IDS[index];
          const padInfo = padId ? PADS[padId] : null;
          return (
            <path
              key={padIndex}
              d={d}
              data-pad-index={padIndex}
              className={`pad-default ${highlight.className}`}
              style={highlight.fill ? { fill: highlight.fill } : undefined}
              data-testid={`pad-${padIndex}`}
              onMouseDown={() => handlePadClick(padIndex)}
              onKeyDown={(e) => handlePadKeyDown(e, padIndex)}
              tabIndex={0}
              role="button"
              aria-label={padInfo ? `Play ${padInfo.label}` : `Play pad ${padIndex}`}
            />
          );
        })}
      </svg>
    </div>
  );
};



