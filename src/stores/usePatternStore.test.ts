import { describe, it, expect, beforeEach } from 'vitest';
import { usePatternStore } from './usePatternStore';
import { PAD_IDS, FINGER_DEFAULTS } from '../config/padMapping';

describe('usePatternStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePatternStore.getState().resetPattern();
  });

  describe('createEmptyPattern', () => {
    it('creates a pattern with 18 tracks', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern).not.toBeNull();
      expect(pattern!.tracks).toHaveLength(18);
    });

    it('creates tracks with 16 steps each', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      pattern!.tracks.forEach((track) => {
        expect(track.steps).toHaveLength(16);
      });
    });

    it('sets default BPM to 120', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.bpm).toBe(120);
    });

    it('sets subdivision to 16n and bars to 1', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.subdivision).toBe('16n');
      expect(pattern!.bars).toBe(1);
      // Default: 1 bar × 4 beats × 4 steps per beat = 16 steps
      expect(pattern!.tracks[0].steps.length).toBe(16);
    });

    it('uses custom name when provided', () => {
      usePatternStore.getState().createEmptyPattern('My Custom Pattern');
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.name).toBe('My Custom Pattern');
    });

    it('uses default name when not provided', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.name).toBe('New Pattern');
    });

    it('creates tracks in PAD_IDS order', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      pattern!.tracks.forEach((track, index) => {
        expect(track.padId).toBe(PAD_IDS[index]);
      });
    });

    it('sets each track defaultFinger from FINGER_DEFAULTS', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      pattern!.tracks.forEach((track) => {
        const expectedFinger =
          FINGER_DEFAULTS[track.padId as keyof typeof FINGER_DEFAULTS];
        expect(track.defaultFinger).toEqual(expectedFinger);
      });
    });

    it('creates all steps as inactive', () => {
      usePatternStore.getState().createEmptyPattern();
      const pattern = usePatternStore.getState().currentPattern;

      pattern!.tracks.forEach((track) => {
        track.steps.forEach((step) => {
          expect(step.active).toBe(false);
          expect(step.finger).toBeUndefined();
        });
      });
    });
  });

  describe('toggleStep', () => {
    beforeEach(() => {
      usePatternStore.getState().createEmptyPattern();
    });

    it('activates an inactive step', () => {
      usePatternStore.getState().toggleStep(0, 0);
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.tracks[0].steps[0].active).toBe(true);
    });

    it('deactivates an active step', () => {
      usePatternStore.getState().toggleStep(0, 0);
      usePatternStore.getState().toggleStep(0, 0);
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.tracks[0].steps[0].active).toBe(false);
    });

    it('sets default finger when activating', () => {
      usePatternStore.getState().toggleStep(0, 0);
      const pattern = usePatternStore.getState().currentPattern;
      const track = pattern!.tracks[0];

      expect(pattern!.tracks[0].steps[0].finger).toEqual(track.defaultFinger);
    });

    it('clears finger when deactivating', () => {
      usePatternStore.getState().toggleStep(0, 0);
      usePatternStore.getState().toggleStep(0, 0);
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.tracks[0].steps[0].finger).toBeUndefined();
    });

    it('does nothing when no pattern exists', () => {
      usePatternStore.getState().resetPattern();
      usePatternStore.getState().toggleStep(0, 0);

      expect(usePatternStore.getState().currentPattern).toBeNull();
    });
  });

  describe('updateStepFinger', () => {
    beforeEach(() => {
      usePatternStore.getState().createEmptyPattern();
      usePatternStore.getState().toggleStep(0, 0); // Activate step first
    });

    it('updates finger designation on active step', () => {
      const newFinger = { hand: 'L' as const, finger: 2 as const };
      usePatternStore.getState().updateStepFinger(0, 0, newFinger);
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.tracks[0].steps[0].finger).toEqual(newFinger);
    });

    it('does not update finger on inactive step', () => {
      usePatternStore.getState().toggleStep(0, 0); // Deactivate
      const newFinger = { hand: 'L' as const, finger: 2 as const };
      usePatternStore.getState().updateStepFinger(0, 0, newFinger);
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern!.tracks[0].steps[0].finger).toBeUndefined();
    });

    it('does nothing when no pattern exists', () => {
      usePatternStore.getState().resetPattern();
      const newFinger = { hand: 'L' as const, finger: 2 as const };
      usePatternStore.getState().updateStepFinger(0, 0, newFinger);

      expect(usePatternStore.getState().currentPattern).toBeNull();
    });
  });

  describe('setPattern', () => {
    it('sets the current pattern', () => {
      const customPattern = {
        id: 'custom-id',
        name: 'Custom Pattern',
        bpm: 140,
        stepsPerBar: 16 as const,
        bars: 1,
        tracks: [],
      };

      usePatternStore.getState().setPattern(customPattern);
      const pattern = usePatternStore.getState().currentPattern;

      expect(pattern).toEqual(customPattern);
    });
  });

  describe('resetPattern', () => {
    it('sets currentPattern to null', () => {
      usePatternStore.getState().createEmptyPattern();
      usePatternStore.getState().resetPattern();

      expect(usePatternStore.getState().currentPattern).toBeNull();
    });
  });
});
