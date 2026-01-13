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
import { useThemeStore } from '../../stores/useThemeStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { StepCell } from './StepCell';
import { PatternNameEditor } from './PatternNameEditor';
import { LayoutSelector } from './LayoutSelector';
import { SimplifiedHandSelector, type HandSelection } from './SimplifiedHandSelector';
import { getStepsPerBeat, type FingerDesignation, type Subdivision } from '../../types/pattern';
import { getLayoutOrder, SIMPLIFIED_TRACKS, type SimplifiedTrackConfig } from '../../config/layoutViews';
import { PAD_IDS, type PadId } from '../../config/padMapping';

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
 * Clicking on a step moves the playhead to that position
 * Supports drag to continuously move playhead
 */
interface StepHeaderProps {
  totalSteps: number;
  stepsPerBeat: number;
  cellWidth: number;
  isDark: boolean;
  onStepClick: (step: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  /** Disable interaction (e.g., during playback) */
  disabled?: boolean;
}

const StepHeader = memo(function StepHeader({
  totalSteps,
  stepsPerBeat,
  cellWidth,
  isDark,
  onStepClick,
  onDragStart,
  onDragEnd,
  disabled = false,
}: StepHeaderProps) {
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const borderColor = isDark ? 'border-slate-600' : 'border-slate-400';
  const textColor = isDark ? 'text-slate-400' : 'text-slate-600';
  const subTextColor = isDark ? 'text-slate-600' : 'text-slate-400';

  const handleMouseDown = useCallback((step: number) => {
    if (disabled) return;
    onStepClick(step);
    onDragStart();
  }, [onStepClick, onDragStart, disabled]);

  const handleMouseEnter = useCallback((step: number, e: React.MouseEvent) => {
    if (disabled) return;
    // Only update if mouse button is pressed (dragging)
    if (e.buttons === 1) {
      onStepClick(step);
    }
  }, [onStepClick, disabled]);

  const handleMouseUp = useCallback(() => {
    if (disabled) return;
    onDragEnd();
  }, [onDragEnd, disabled]);

  return (
    <div className={`sticky top-0 z-20 flex ${bgColor}`} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Empty cell above track labels - also sticky left */}
      <div className={`sticky left-0 z-30 w-24 shrink-0 ${bgColor}`} />
      {/* Step number headers */}
      <div className="flex gap-x-0.5">
        {Array.from({ length: totalSteps }, (_, i) => {
          const label = formatStepLabel(i, stepsPerBeat);
          const isFirstInBeat = i % stepsPerBeat === 0;

          return (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={(e) => handleMouseEnter(i, e)}
              className={`
                flex items-center justify-center
                font-mono
                h-6
                ${bgColor}
                ${isFirstInBeat ? `border-l-2 ${borderColor} ${textColor} text-xs` : `${subTextColor} text-[10px]`}
                ${disabled ? 'cursor-default opacity-60' : 'hover:bg-purple-500/20 cursor-pointer'} transition-colors
                focus:outline-none
                select-none
              `}
              style={{ width: cellWidth }}
              title={`Click to move playhead to Bar ${Math.floor(i / (stepsPerBeat * 4)) + 1}, Beat ${Math.floor((i % (stepsPerBeat * 4)) / stepsPerBeat) + 1}`}
              aria-label={`Move playhead to step ${i + 1}`}
            >
              {label || '·'}
            </button>
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
  isDark: boolean;
}

const TrackRow = memo(function TrackRow({
  trackIndex,
  padId,
  label,
  shortLabel,
  steps,
  stepsPerBeat,
  cellWidth,
  isDark,
}: TrackRowProps) {
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const textColor = isDark ? 'text-slate-300' : 'text-slate-700';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-300';

  return (
    <div className="flex">
      {/* Track label - sticky on horizontal scroll */}
      <div
        className={`
          sticky left-0 z-10
          flex items-center
          px-2
          ${bgColor}
          text-xs ${textColor}
          border-r ${borderColor}
          w-24 shrink-0
          truncate
        `}
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
            stepsPerBeat={stepsPerBeat}
            cellWidth={cellWidth}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Simplified track row for merged L/R pads
 * Shows combined state and allows selection via popup
 */
interface SimplifiedTrackRowProps {
  config: SimplifiedTrackConfig;
  /** The original tracks from pattern that this simplified track merges */
  sourceTracks: { padId: PadId; trackIndex: number; steps: { active: boolean; finger?: FingerDesignation }[] }[];
  stepsPerBeat: number;
  cellWidth: number;
  isDark: boolean;
  onCellClick: (trackId: string, stepIndex: number, e: React.MouseEvent) => void;
}

const SimplifiedTrackRow = memo(function SimplifiedTrackRow({
  config,
  sourceTracks,
  stepsPerBeat,
  cellWidth,
  isDark,
  onCellClick,
}: SimplifiedTrackRowProps) {
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const textColor = isDark ? 'text-slate-300' : 'text-slate-700';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-300';
  const activeBg = isDark ? 'bg-purple-600' : 'bg-purple-500';
  const inactiveBg = isDark ? 'bg-slate-700' : 'bg-slate-300';
  const beatBorderColor = isDark ? 'border-slate-500' : 'border-slate-400';

  // Get step count from first source track
  const stepCount = sourceTracks[0]?.steps.length ?? 16;

  // For each step, check if any source track has it active
  const getMergedStep = (stepIndex: number) => {
    // Find which source tracks have this step active
    const activeSourcesInfo = sourceTracks
      .filter(t => t.steps[stepIndex]?.active)
      .map(t => ({
        padId: t.padId,
        finger: t.steps[stepIndex]?.finger,
      }));

    return {
      isActive: activeSourcesInfo.length > 0,
      activeSources: activeSourcesInfo,
    };
  };

  return (
    <div className="flex">
      {/* Track label - sticky on horizontal scroll */}
      <div
        className={`
          sticky left-0 z-10
          flex items-center
          px-2
          ${bgColor}
          text-xs ${textColor}
          border-r ${borderColor}
          w-24 shrink-0
          truncate
        `}
        title={config.label}
      >
        <span className="hidden sm:inline">{config.label}</span>
        <span className="sm:hidden">{config.label.slice(0, 3)}</span>
      </div>
      {/* Step cells */}
      <div className="flex gap-x-0.5">
        {Array.from({ length: stepCount }, (_, stepIndex) => {
          const { isActive, activeSources } = getMergedStep(stepIndex);
          const isFirstInBeat = stepIndex % stepsPerBeat === 0;

          // Determine display for merged step
          let fingerDisplay = '';
          if (activeSources.length === 1 && activeSources[0].finger) {
            const f = activeSources[0].finger;
            fingerDisplay = f.hand === 'L' ? `(${f.finger})` : `${f.finger}`;
          } else if (activeSources.length === 2) {
            // Both hands active
            fingerDisplay = 'R+L';
          }

          return (
            <button
              key={stepIndex}
              type="button"
              onClick={(e) => onCellClick(config.id, stepIndex, e)}
              className={`
                flex items-center justify-center
                rounded-sm
                text-[10px] font-mono
                transition-colors
                ${isActive ? `${activeBg} text-white` : `${inactiveBg}`}
                ${isFirstInBeat ? `border-l-2 ${beatBorderColor}` : ''}
                hover:ring-2 hover:ring-purple-400/50
                focus:outline-none focus:ring-2 focus:ring-purple-400
              `}
              style={{ width: cellWidth, height: 24 }}
            >
              {fingerDisplay}
            </button>
          );
        })}
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
  isDark: boolean;
}

const BarsSelector = memo(function BarsSelector({ bars, onChange, disabled, isDark }: BarsSelectorProps) {
  const labelColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const selectStyle = isDark
    ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-slate-500'
    : 'bg-white border-slate-300 text-slate-700 focus:ring-slate-400';

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs ${labelColor}`}>Bars:</span>
      <select
        value={bars}
        onChange={(e) => onChange(Number(e.target.value) as 1 | 2 | 3 | 4)}
        disabled={disabled}
        className={`
          border rounded
          text-xs
          px-1.5 py-0.5
          focus:outline-none focus:ring-1
          disabled:opacity-50
          ${selectStyle}
        `}
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
  isDark: boolean;
}

const SubdivisionSelector = memo(function SubdivisionSelector({
  subdivision,
  onChange,
  disabled,
  isDark
}: SubdivisionSelectorProps) {
  const labelColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const selectStyle = isDark
    ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-slate-500'
    : 'bg-white border-slate-300 text-slate-700 focus:ring-slate-400';

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs ${labelColor}`}>Grid:</span>
      <select
        value={subdivision}
        onChange={(e) => onChange(e.target.value as Subdivision)}
        disabled={disabled}
        className={`
          border rounded
          text-xs
          px-1.5 py-0.5
          focus:outline-none focus:ring-1
          disabled:opacity-50
          ${selectStyle}
        `}
      >
        <option value="4n">1/4</option>
        <option value="4t">1/4T</option>
        <option value="8n">1/8</option>
        <option value="8t">1/8T</option>
        <option value="16n">1/16</option>
        <option value="16t">1/16T</option>
        <option value="32n">1/32</option>
        <option value="32t">1/32T</option>
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
  const toggleStep = usePatternStore((state) => state.toggleStep);

  // Story 3.6: Playhead state
  const currentStep = usePlaybackStore((state) => state.currentStep);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const isPaused = usePlaybackStore((state) => state.isPaused);
  const bpm = usePlaybackStore((state) => state.bpm);
  const pausedPosition = usePlaybackStore((state) => state.pausedPosition);
  const setPlayhead = usePlaybackStore((state) => state.setPlayhead);

  // Theme state
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'fgdp-50';

  // Layout state
  const currentLayout = useLayoutStore((state) => state.currentLayout);

  // Selection state for drag box overlay
  const isSelecting = useSelectionStore((state) => state.isSelecting);
  const selectionStart = useSelectionStore((state) => state.selectionStart);
  const selectionEnd = useSelectionStore((state) => state.selectionEnd);

  // Zoom state for cell width
  const [cellWidth, setCellWidth] = useState(DEFAULT_CELL_WIDTH);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);

  // Real-time playhead position based on Transport.position
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);

  // Hand selection popup state for simplified view
  const [handSelection, setHandSelection] = useState<HandSelection | null>(null);

  // Step header drag state
  const [isDraggingHeader, setIsDraggingHeader] = useState(false);

  // Header drag handlers
  const handleHeaderDragStart = useCallback(() => {
    setIsDraggingHeader(true);
  }, []);

  const handleHeaderDragEnd = useCallback(() => {
    setIsDraggingHeader(false);
  }, []);

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
    // In stopped state, use currentStep from store (allows user to move playhead)
    if (!isPlaying && !isPaused) {
      setPlayheadPosition(currentStep);
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
      // Check current store state directly (not stale closure value)
      // This prevents race conditions when stop() is called
      const currentState = usePlaybackStore.getState();
      if (!currentState.isPlaying) {
        // If stopped, ensure playhead is at currentStep (usually 0 after stop)
        setPlayheadPosition(currentState.currentStep);
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
  }, [isPlaying, isPaused, currentPattern, bpm, pausedPosition, currentStep]);

  // Handle simplified view cell click - show popup for hand selection
  const handleSimplifiedCellClick = useCallback((trackId: string, stepIndex: number, e: React.MouseEvent) => {
    const config = SIMPLIFIED_TRACKS.find(t => t.id === trackId);
    if (!config || !currentPattern) return;

    // For single-source tracks, just toggle directly
    if (config.sources.length === 1) {
      const padId = config.sources[0];
      const trackIndex = PAD_IDS.indexOf(padId);
      if (trackIndex !== -1) {
        toggleStep(trackIndex, stepIndex);
      }
      return;
    }

    // For merged tracks, show the hand selection popup
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHandSelection({
      trackId,
      stepIndex,
      position: {
        x: rect.left,
        y: rect.bottom + 4,
      },
    });
  }, [currentPattern, toggleStep]);

  // Handle hand selection from popup
  const handleHandSelect = useCallback((hand: 'L' | 'R') => {
    if (!handSelection || !currentPattern) return;

    const config = SIMPLIFIED_TRACKS.find(t => t.id === handSelection.trackId);
    if (!config || config.sources.length < 2) return;

    // Find the correct source pad based on hand selection
    // Convention: L variant is first, R variant is second in sources array
    const padId = hand === 'L' ? config.sources[0] : config.sources[1];
    const trackIndex = PAD_IDS.indexOf(padId);

    if (trackIndex !== -1) {
      toggleStep(trackIndex, handSelection.stepIndex);
    }

    setHandSelection(null);
  }, [handSelection, currentPattern, toggleStep]);

  // Close hand selection popup
  const handleCloseHandSelection = useCallback(() => {
    setHandSelection(null);
  }, []);

  // Get ordered tracks based on current layout
  const getOrderedTracks = useCallback(() => {
    if (!currentPattern) return [];

    const layoutOrder = getLayoutOrder(currentLayout);

    if (layoutOrder) {
      // Reorder tracks according to layout
      return layoutOrder.map(padId => {
        const trackIndex = PAD_IDS.indexOf(padId);
        return {
          ...currentPattern.tracks[trackIndex],
          originalIndex: trackIndex,
        };
      });
    }

    // Default order - use original
    return currentPattern.tracks.map((track, index) => ({
      ...track,
      originalIndex: index,
    }));
  }, [currentPattern, currentLayout]);

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

  const headerBorderColor = isDark ? 'border-slate-700' : 'border-slate-300';
  const zoomTextColor = isDark ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="flex flex-col h-full">
      {/* Header: Pattern name and controls */}
      <div className={`shrink-0 px-3 py-2 border-b ${headerBorderColor}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <PatternNameEditor isDark={isDark} />
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <BarsSelector
            bars={currentPattern.bars}
            onChange={setBars}
            disabled={isPlaying}
            isDark={isDark}
          />
          <SubdivisionSelector
            subdivision={currentPattern.subdivision}
            onChange={handleSubdivisionChange}
            disabled={isPlaying}
            isDark={isDark}
          />
          <LayoutSelector isDark={isDark} />
            <span className={`text-xs ${zoomTextColor} hidden sm:inline`} title="Alt/Option + Scroll to zoom">
            {zoomPercent}%
          </span>
          </div>
        </div>
      </div>

      {/* Grid container with scroll - sticky headers */}
      <div ref={gridContainerRef} className="flex-1 overflow-auto relative">
        {/* Vertical playhead line - always visible, color indicates state */}
        {gridHeight > 0 && (
          <div
            className={`
              absolute top-0 w-0.5 z-40 pointer-events-none
              ${isPlaying
                ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                : isPaused
                  ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                  : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'}
            `}
            style={{
              left: `${96 + playheadPosition * (cellWidth + 2)}px`, // Track label width (w-24 = 96px) + real-time step position
              height: `${gridHeight}px`, // Use actual grid height
            }}
          />
        )}
        {/* Drag box overlay during selection */}
        {isSelecting && selectionStart && selectionEnd && (() => {
          const minStep = Math.min(selectionStart.step, selectionEnd.step);
          const maxStep = Math.max(selectionStart.step, selectionEnd.step);
          const minTrack = Math.min(selectionStart.track, selectionEnd.track);
          const maxTrack = Math.max(selectionStart.track, selectionEnd.track);

          // Cell dimensions: cellWidth + 2px gap, 30px height + 2px gap
          const cellTotalWidth = cellWidth + 2;
          const cellTotalHeight = 32; // 30px + 2px gap
          const headerHeight = 26; // 24px h-6 + 2px gap
          const labelWidth = 96; // w-24

          // Theme-aware colors: cyan for dark, violet for light
          const boxClass = isDark
            ? 'bg-cyan-400/20 border-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.4)]'
            : 'bg-violet-500/20 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.4)]';

          return (
            <div
              className={`absolute border-2 pointer-events-none z-30 rounded-sm ${boxClass}`}
              style={{
                left: labelWidth + minStep * cellTotalWidth,
                top: headerHeight + minTrack * cellTotalHeight,
                width: (maxStep - minStep + 1) * cellTotalWidth - 2,
                height: (maxTrack - minTrack + 1) * cellTotalHeight - 2,
              }}
            />
          );
        })()}
        <div ref={gridContentRef} className="flex flex-col gap-y-0.5 min-w-max">
          {/* Step number header row - sticky top */}
          <StepHeader
            totalSteps={totalSteps}
            stepsPerBeat={stepsPerBeat}
            cellWidth={cellWidth}
            isDark={isDark}
            onStepClick={setPlayhead}
            onDragStart={handleHeaderDragStart}
            onDragEnd={handleHeaderDragEnd}
            disabled={isPlaying}
          />

          {/* Track rows - render based on current layout */}
          {currentLayout === 'simplified' ? (
            // Simplified view with merged L/R tracks
            SIMPLIFIED_TRACKS.map((config) => {
              // Get source tracks for this simplified track
              const sourceTracks = config.sources.map(padId => {
                const trackIndex = PAD_IDS.indexOf(padId);
                return {
                  padId,
                  trackIndex,
                  steps: currentPattern.tracks[trackIndex]?.steps ?? [],
                };
              });

              return (
                <SimplifiedTrackRow
                  key={config.id}
                  config={config}
                  sourceTracks={sourceTracks}
                  stepsPerBeat={stepsPerBeat}
                  cellWidth={cellWidth}
                  isDark={isDark}
                  onCellClick={handleSimplifiedCellClick}
                />
              );
            })
          ) : (
            // Default, right-hand, or left-hand view
            getOrderedTracks().map((track) => (
              <TrackRow
                key={track.padId}
                trackIndex={track.originalIndex}
                padId={track.padId}
                label={track.label}
                shortLabel={track.label.slice(0, 3)}
                steps={track.steps}
                stepsPerBeat={stepsPerBeat}
                cellWidth={cellWidth}
                isDark={isDark}
              />
            ))
          )}
        </div>
      </div>

      {/* Hand selection popup for simplified view */}
      {handSelection && (
        <SimplifiedHandSelector
          selection={handSelection}
          onSelect={handleHandSelect}
          onClose={handleCloseHandSelection}
          isDark={isDark}
        />
      )}
    </div>
  );
}
