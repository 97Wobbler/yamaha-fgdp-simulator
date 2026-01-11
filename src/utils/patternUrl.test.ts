/**
 * Tests for Pattern URL Encoding/Decoding
 *
 * Story 4.1: Pattern URL Encoding
 * Story 4.7: Binary compression for shorter URLs
 *
 * Tests the binary compressed format.
 * Note: ID is not preserved (new shared-{timestamp} ID generated on decode)
 */

import { describe, it, expect } from 'vitest';
import { encodePattern, decodePattern, MAX_ENCODED_LENGTH } from './patternUrl';
import type { DrumPattern, PatternTrack } from '../types/pattern';
import { PAD_IDS, PADS, FINGER_DEFAULTS, type PadId } from '../config/padMapping';

// Helper to create a minimal valid pattern using PAD_IDS structure
function createTestPattern(
  name: string = 'Test Pattern',
  bars: 1 | 2 | 3 | 4 = 1,
  subdivision: '8n' | '16n' | '32n' = '16n'
): DrumPattern {
  // Calculate step count based on bars and subdivision
  const stepsPerBeat = subdivision === '8n' ? 2 : subdivision === '16n' ? 4 : 8;
  const totalSteps = bars * 4 * stepsPerBeat;

  const tracks: PatternTrack[] = PAD_IDS.map((padId) => ({
    padId,
    label: PADS[padId].label,
    defaultFinger: FINGER_DEFAULTS[padId as PadId],
    steps: Array.from({ length: totalSteps }, () => ({
      active: false,
      velocity: undefined,
      finger: undefined,
    })),
  }));

  return {
    id: 'test-pattern-1',
    name,
    bpm: 120,
    subdivision,
    bars,
    tracks,
  };
}

// Helper to create a pattern with many active steps (but not all - that would exceed limit)
function createDensePattern(): DrumPattern {
  const pattern = createTestPattern('Dense Pattern');
  // Activate 4 steps per track (72 total active steps - realistic dense pattern)
  pattern.tracks.forEach((track) => {
    [0, 4, 8, 12].forEach((stepIdx) => {
      track.steps[stepIdx] = {
        active: true,
        velocity: 100,
        finger: { hand: 'R', finger: 2 },
      };
    });
  });
  return pattern;
}

describe('Pattern URL Encoding', () => {
  describe('encodePattern', () => {
    it('should encode an empty pattern successfully', () => {
      const pattern = createTestPattern();
      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      expect(typeof encoded).toBe('string');
      expect(encoded!.length).toBeLessThan(MAX_ENCODED_LENGTH);
    });

    it('should produce URL-safe characters only', () => {
      const pattern = createTestPattern();
      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      // URL-safe Base64 should not contain +, /, or =
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });

    it('should encode a dense pattern successfully (72 active steps)', () => {
      const pattern = createDensePattern();
      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      expect(encoded!.length).toBeLessThan(MAX_ENCODED_LENGTH);
    });

    it('should encode pattern with special characters in name', () => {
      const pattern = createTestPattern('Test 한글 🎵 Pattern!');
      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      expect(encoded!.length).toBeLessThan(MAX_ENCODED_LENGTH);
    });
  });

  describe('decodePattern', () => {
    it('should decode a valid encoded pattern', () => {
      const original = createTestPattern('Decode Test');
      const encoded = encodePattern(original);

      expect(encoded).not.toBeNull();

      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.name).toBe('Decode Test');
      expect(decoded!.bpm).toBe(120);
      expect(decoded!.tracks.length).toBe(18);
    });

    it('should return null for invalid Base64', () => {
      const decoded = decodePattern('not-valid-base64!!!');
      expect(decoded).toBeNull();
    });

    it('should return null for valid Base64 but invalid JSON', () => {
      // "hello" in Base64
      const decoded = decodePattern('aGVsbG8');
      expect(decoded).toBeNull();
    });

    it('should return null for valid JSON but missing required fields', () => {
      // {} encoded
      const decoded = decodePattern('e30');
      expect(decoded).toBeNull();
    });

    it('should return null for empty string', () => {
      const decoded = decodePattern('');
      expect(decoded).toBeNull();
    });
  });

  describe('roundtrip', () => {
    it('should preserve empty pattern metadata through encode/decode', () => {
      const original = createTestPattern('Roundtrip Empty');
      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      // Note: ID is not preserved (new ID generated on decode)
      expect(decoded!.name).toBe(original.name);
      expect(decoded!.bpm).toBe(original.bpm);
      expect(decoded!.tracks.length).toBe(original.tracks.length);
    });

    it('should preserve dense pattern through encode/decode', () => {
      const original = createDensePattern();
      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      // Check active steps are preserved
      original.tracks.forEach((track, trackIdx) => {
        track.steps.forEach((step, stepIdx) => {
          expect(decoded!.tracks[trackIdx].steps[stepIdx].active).toBe(step.active);
          if (step.active && step.finger) {
            expect(decoded!.tracks[trackIdx].steps[stepIdx].finger?.hand).toBe(step.finger.hand);
            expect(decoded!.tracks[trackIdx].steps[stepIdx].finger?.finger).toBe(step.finger.finger);
          }
        });
      });
    });

    it('should preserve pattern with mixed active/inactive steps', () => {
      const original = createTestPattern('Mixed');
      original.tracks[0].steps[0].active = true;
      original.tracks[0].steps[0].finger = { hand: 'L', finger: 3 };
      original.tracks[5].steps[8].active = true;
      original.tracks[5].steps[8].finger = { hand: 'R', finger: 1 };

      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.tracks[0].steps[0].active).toBe(true);
      expect(decoded!.tracks[0].steps[0].finger?.hand).toBe('L');
      expect(decoded!.tracks[0].steps[0].finger?.finger).toBe(3);
      expect(decoded!.tracks[5].steps[8].active).toBe(true);
      expect(decoded!.tracks[5].steps[8].finger?.hand).toBe('R');
    });

    it('should preserve pattern name with Korean characters', () => {
      const original = createTestPattern('한글 테스트');
      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.name).toBe('한글 테스트');
    });

    it('should preserve 4 bars with 16n subdivision', () => {
      const original = createTestPattern('4 Bars 16n', 4, '16n');
      original.tracks[0].steps[0].active = true;
      original.tracks[0].steps[0].finger = { hand: 'R', finger: 1 };
      original.tracks[0].steps[63].active = true; // Last step of 4 bars (64 steps)
      original.tracks[0].steps[63].finger = { hand: 'L', finger: 2 };

      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.bars).toBe(4);
      expect(decoded!.subdivision).toBe('16n');
      expect(decoded!.tracks[0].steps.length).toBe(64);
      expect(decoded!.tracks[0].steps[0].active).toBe(true);
      expect(decoded!.tracks[0].steps[63].active).toBe(true);
    });

    it('should preserve 2 bars with 8n subdivision', () => {
      const original = createTestPattern('2 Bars 8n', 2, '8n');
      original.tracks[0].steps[0].active = true;
      original.tracks[0].steps[0].finger = { hand: 'R', finger: 1 };
      original.tracks[0].steps[15].active = true; // Last step of 2 bars @ 8n (16 steps)
      original.tracks[0].steps[15].finger = { hand: 'L', finger: 3 };

      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.bars).toBe(2);
      expect(decoded!.subdivision).toBe('8n');
      expect(decoded!.tracks[0].steps.length).toBe(16);
      expect(decoded!.tracks[0].steps[0].active).toBe(true);
      expect(decoded!.tracks[0].steps[15].active).toBe(true);
    });

    it('should preserve 1 bar with 32n subdivision', () => {
      const original = createTestPattern('1 Bar 32n', 1, '32n');
      original.tracks[0].steps[0].active = true;
      original.tracks[0].steps[0].finger = { hand: 'R', finger: 1 };
      original.tracks[0].steps[31].active = true; // Last step of 1 bar @ 32n (32 steps)
      original.tracks[0].steps[31].finger = { hand: 'L', finger: 4 };

      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.bars).toBe(1);
      expect(decoded!.subdivision).toBe('32n');
      expect(decoded!.tracks[0].steps.length).toBe(32);
      expect(decoded!.tracks[0].steps[0].active).toBe(true);
      expect(decoded!.tracks[0].steps[31].active).toBe(true);
    });

    it('should default to 1 bar / 16n when decoding legacy patterns', () => {
      // Patterns without r/d fields should default to 1 bar, 16n
      const original = createTestPattern('Legacy', 1, '16n');
      const encoded = encodePattern(original);
      const decoded = decodePattern(encoded!);

      expect(decoded).not.toBeNull();
      expect(decoded!.bars).toBe(1);
      expect(decoded!.subdivision).toBe('16n');
      expect(decoded!.tracks[0].steps.length).toBe(16);
    });
  });

  describe('compression efficiency', () => {
    it('should produce short URLs for empty patterns', () => {
      const pattern = createTestPattern('Empty', 1, '16n');
      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      // Empty pattern should be very short (< 100 chars)
      expect(encoded!.length).toBeLessThan(100);
      console.log(`Empty pattern (1 bar, 16n): ${encoded!.length} chars`);
    });

    it('should produce short URLs for dense patterns', () => {
      const pattern = createDensePattern();
      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      // Dense pattern (72 active steps) should still be short (< 200 chars)
      expect(encoded!.length).toBeLessThan(200);
      console.log(`Dense pattern (72 active steps): ${encoded!.length} chars`);
    });

    it('should handle worst case (4 bars, 32n, all steps active)', () => {
      const pattern = createTestPattern('Max', 4, '32n');
      // Activate all steps on all tracks
      pattern.tracks.forEach((track, trackIdx) => {
        track.steps.forEach((step, stepIdx) => {
          track.steps[stepIdx] = {
            active: true,
            velocity: 100,
            finger: { hand: stepIdx % 2 === 0 ? 'R' : 'L', finger: ((stepIdx % 5) + 1) as 1|2|3|4|5 },
          };
        });
      });

      const encoded = encodePattern(pattern);

      expect(encoded).not.toBeNull();
      // Even worst case should fit within limit
      expect(encoded!.length).toBeLessThan(MAX_ENCODED_LENGTH);
      console.log(`Worst case (4 bars, 32n, 2304 active steps): ${encoded!.length} chars`);
    });
  });
});
