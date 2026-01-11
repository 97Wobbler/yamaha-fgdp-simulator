/**
 * StepSequencer - Main grid UI for drum pattern editing
 *
 * Displays an 18-track × N-step grid with track labels,
 * beat separators, and scrollable layout.
 * Story 3.6: Playhead highlight for current step
 * Story 4.4: Pattern name editor
 * Story 4.5: Dynamic bars (1-4) and subdivision (8n/16n/32n)
 */

import { memo, useEffect, useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { usePatternStore } from '../../stores/usePatternStore';
import { usePlaybackStore } from '../../stores/usePlaybackStore';
import { StepCell } from './StepCell';
import { PatternNameEditor } from './PatternNameEditor';
import { getStepsPerBeat, type FingerDesignation, type Subdivision } from '../../types/pattern';

/** Zoom level constants */
const MIN_CELL_WIDTH = 20;
const MAX_CELL_WIDTH = 60;
const DEFAULT_CELL_WIDTH = 28;
const ZOOM_STEP = 4;

/**
 * Format step index as bar.beat notation
 * e.g., step 0 with 4 steps/beat = "1.1", step 4 = "1.2", step 16 = "2.1"
 */
function formatStepLabel(stepIndex: number, stepsPerBeat: number): string {
  const beatsPerBar = 4;
  const stepsPerBar = stepsPerBeat * beatsPerBar;

  const bar = Math.floor(stepIndex / stepsPerBar) + 1;
  const beatInBar = Math.floor((stepIndex % stepsPerBar) / stepsPerBeat) + 1;
  const subBeat = (stepIndex % stepsPerBeat) + 1;

  // Only show bar.beat for first subdivision of beat, otherwise show sub-position
  if (subBeat === 1) {
    return `${bar}.${beatInBar}`;
  }
  // For subdivisions, show smaller indicator
  return '';
}

/**
 * Step header showing step numbers (sticky top)
 */
interface StepHeaderProps {
  totalSteps: number;
  stepsPerBeat: number;
  cellWidth: number;
}

const StepHeader = memo(function StepHeader({ totalSteps, stepsPerBeat, cellWidth }: StepHeaderProps) {
  return (
    <div className="sticky top-0 z-20 flex bg-slate-900">
      {/* Empty cell above track labels - also sticky left */}
      <div className="sticky left-0 z-30 w-24 shrink-0 bg-slate-900" />
      {/* Step number headers */}
      <div className="flex gap-x-0.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const label = formatStepLabel(i, stepsPerBeat);
          const isFirstInBeat = i % stepsPerBeat === 0;

          return (
            <div
              key={i}
              className={`
                flex items-center justify-center
                font-mono
                h-6
                bg-slate-900
                ${isFirstInBeat ? 'border-l-2 border-slate-600 text-slate-400 text-xs' : 'text-slate-600 text-[10px]'}
              `}
              style={{ width: cellWidth }}
              title={`Bar ${Math.floor(i / (stepsPerBeat * 4)) + 1}, Beat ${Math.floor((i % (stepsPerBeat * 4)) / stepsPerBeat) + 1}, Step ${(i % stepsPerBeat) + 1}`}
            >
              {label || '·'}
            </div>
          );
        })}
      </div>
    </div>
  );
});

/**
 * Track row component for a single pad
 */
interface TrackRowProps {
  trackIndex: number;
  padId: string;
  label: string;
  shortLabel: string;
  steps: { active: boolean; finger?: FingerDesignation }[];
  /** Steps per beat for visual separation */
  stepsPerBeat: number;
  /** Cell width for zoom */
  cellWidth: number;
}

const TrackRow = memo(function TrackRow({
  trackIndex,
  padId,
  label,
  shortLabel,
  steps,
  stepsPerBeat,
  cellWidth,
}: TrackRowProps) {
  return (
    <div className="flex">
      {/* Track label - sticky on horizontal scroll */}
      <div
        className="
          sticky left-0 z-10
          flex items-center
          px-2
          bg-slate-900
          text-xs text-slate-300
          border-r border-slate-700
          w-24 shrink-0
          truncate
        "
        title={label}
      >
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{shortLabel}</span>
      </div>
      {/* Step cells */}
      <div className="flex gap-x-0.5">
        {steps.map((step, stepIndex) => (
          <StepCell
            key={stepIndex}
            trackIndex={trackIndex}
            stepIndex={stepIndex}
            padId={padId}
            active={step.active}
            finger={step.finger}
            isFirstInBeat={stepIndex % stepsPerBeat === 0}
            cellWidth={cellWidth}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Bars selector component
 */
interface BarsSelectorProps {
  bars: 1 | 2 | 3 | 4;
  onChange: (bars: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}

const BarsSelector = memo(function BarsSelector({ bars, onChange, disabled }: BarsSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400">Bars:</span>
      <select
        value={bars}
        onChange={(e) => onChange(Number(e.target.value) as 1 | 2 | 3 | 4)}
        disabled={disabled}
        className="
          bg-slate-800 border border-slate-600 rounded
          text-xs text-slate-200
          px-1.5 py-0.5
          focus:outline-none focus:ring-1 focus:ring-slate-500
          disabled:opacity-50
        "
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
      </select>
    </div>
  );
});

/**
 * Subdivision selector component
 */
interface SubdivisionSelectorProps {
  subdivision: Subdivision;
  onChange: (subdivision: Subdivision) => void;
  disabled?: boolean;
}

const SubdivisionSelector = memo(function SubdivisionSelector({
  subdivision,
  onChange,
  disabled
}: SubdivisionSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400">Grid:</span>
      <select
        value={subdivision}
        onChange={(e) => onChange(e.target.value as Subdivision)}
        disabled={disabled}
        className="
          bg-slate-800 border border-slate-600 rounded
          text-xs text-slate-200
          px-1.5 py-0.5
          focus:outline-none focus:ring-1 focus:ring-slate-500
          disabled:opacity-50
        "
      >
        <option value="8n">1/8</option>
        <option value="16n">1/16</option>
        <option value="32n">1/32</option>
      </select>
    </div>
  );
});

/**
 * Main StepSequencer component
 */
export function StepSequencer() {
  const currentPattern = usePatternStore((state) => state.currentPattern);
  const urlCheckComplete = usePatternStore((state) => state.urlCheckComplete);
  const createEmptyPattern = usePatternStore((state) => state.createEmptyPattern);
  const setBars = usePatternStore((state) => state.setBars);
  const setSubdivisionStore = usePatternStore((state) => state.setSubdivision);

  // Story 3.6: Playhead state
  const currentStep = usePlaybackStore((state) => state.currentStep);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const isPaused = usePlaybackStore((state) => state.isPaused);
  const bpm = usePlaybackStore((state) => state.bpm);
  const pausedPosition = usePlaybackStore((state) => state.pausedPosition);

  // Zoom state for cell width
  const [cellWidth, setCellWidth] = useState(DEFAULT_CELL_WIDTH);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  
  // Real-time playhead position based on Transport.position
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);

  // Handle subdivision change with cell width adjustment
  const handleSubdivisionChange = useCallback((newSubdivision: Subdivision) => {
    if (!currentPattern) return;

    const oldStepsPerBeat = getStepsPerBeat(currentPattern.subdivision);
    const newStepsPerBeat = getStepsPerBeat(newSubdivision);
    const ratio = oldStepsPerBeat / newStepsPerBeat;

    // Adjust cell width to keep beat width constant
    // More steps = smaller cells, fewer steps = larger cells
    const newCellWidth = Math.round(cellWidth * ratio);
    const clampedWidth = Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, newCellWidth));

    setCellWidth(clampedWidth);
    setSubdivisionStore(newSubdivision);
  }, [currentPattern, cellWidth, setSubdivisionStore]);

  // Handle Alt/Option + scroll for zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.altKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setCellWidth((prev) => Math.max(MIN_CELL_WIDTH, Math.min(MAX_CELL_WIDTH, prev + delta)));
    }
  }, []);

  // Attach wheel listener with passive: false to allow preventDefault
  // Re-run when currentPattern changes because the container only renders when pattern exists
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel, currentPattern]);

  // Update grid height when pattern or cell width changes
  useEffect(() => {
    if (!gridContentRef.current || !currentPattern) return;

    const updateHeight = () => {
      if (gridContentRef.current) {
        setGridHeight(gridContentRef.current.offsetHeight);
      }
    };

    // Initial measurement
    updateHeight();

    // Use ResizeObserver to track height changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(gridContentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [currentPattern, cellWidth]);

  // Initialize empty pattern on mount if none exists
  // Wait for URL check to complete before creating empty pattern
  useEffect(() => {
    if (urlCheckComplete && !currentPattern) {
      createEmptyPattern();
    }
  }, [urlCheckComplete, currentPattern, createEmptyPattern]);

  // Real-time playhead position update using requestAnimationFrame
  // Single time source principle: Transport.position is the source of truth
  useEffect(() => {
    if (!isPlaying && !isPaused) {
      setPlayheadPosition(0);
      return;
    }

    if (!currentPattern) return;

    const stepsPerBeat = getStepsPerBeat(currentPattern.subdivision);
    const totalSteps = currentPattern.tracks[0]?.steps.length ?? 16;
    
    // Calculate step duration in seconds
    const stepDuration = (60 / bpm) / stepsPerBeat;

    // When paused, calculate playhead position from pausedPosition (no snapping)
    if (isPaused) {
      // Use exact pausedPosition (no snapping - shows real-time position)
      const stepPosition = pausedPosition / stepDuration;
      const normalizedPosition = stepPosition % totalSteps;
      setPlayheadPosition(normalizedPosition);
      return;
    }

    let animationFrameId: number;
    
    const updatePlayhead = () => {
      if (!isPlaying) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        return;
      }

      // Get current Transport position in seconds (single source of truth)
      const transportPos = Tone.getTransport().position;
      const transportPosition = typeof transportPos === 'number' 
        ? transportPos 
        : Tone.Time(transportPos).toSeconds();
      
      // Calculate current step position (fractional for smooth movement)
      const stepPosition = transportPosition / stepDuration;
      
      // Handle loop (modulo totalSteps)
      const normalizedPosition = stepPosition % totalSteps;
      
      setPlayheadPosition(normalizedPosition);
      
      animationFrameId = requestAnimationFrame(updatePlayhead);
    };

    animationFrameId = requestAnimationFrame(updatePlayhead);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, isPaused, currentPattern, bpm, pausedPosition]);

  if (!currentPattern) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading pattern...
      </div>
    );
  }

  const totalSteps = currentPattern.tracks[0]?.steps.length ?? 16;
  const stepsPerBeat = getStepsPerBeat(currentPattern.subdivision);

  // Calculate zoom percentage for display
  const zoomPercent = Math.round((cellWidth / DEFAULT_CELL_WIDTH) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header: Pattern name and controls */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <PatternNameEditor />
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <BarsSelector
            bars={currentPattern.bars}
            onChange={setBars}
            disabled={isPlaying}
          />
          <SubdivisionSelector
            subdivision={currentPattern.subdivision}
            onChange={handleSubdivisionChange}
            disabled={isPlaying}
          />
            <span className="text-xs text-slate-500 hidden sm:inline" title="Alt/Option + Scroll to zoom">
            {zoomPercent}%
          </span>
          </div>
        </div>
      </div>

      {/* Grid container with scroll - sticky headers */}
      <div ref={gridContainerRef} className="flex-1 overflow-auto relative">
        {/* Vertical playhead line - real-time smooth movement */}
        {(isPlaying || isPaused) && gridHeight > 0 && (
          <div
            className={`
              absolute top-0 w-0.5 z-40 pointer-events-none
              ${isPlaying ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]'}
            `}
            style={{
              left: `${96 + playheadPosition * (cellWidth + 2)}px`, // Track label width (w-24 = 96px) + real-time step position
              height: `${gridHeight}px`, // Use actual grid height
            }}
          />
        )}
        <div ref={gridContentRef} className="flex flex-col gap-y-0.5 min-w-max">
          {/* Step number header row - sticky top */}
          <StepHeader totalSteps={totalSteps} stepsPerBeat={stepsPerBeat} cellWidth={cellWidth} />

          {/* Track rows */}
          {currentPattern.tracks.map((track, trackIndex) => (
            <TrackRow
              key={track.padId}
              trackIndex={trackIndex}
              padId={track.padId}
              label={track.label}
              shortLabel={track.label.slice(0, 3)}
              steps={track.steps}
              stepsPerBeat={stepsPerBeat}
              cellWidth={cellWidth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
