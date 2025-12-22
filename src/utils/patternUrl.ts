/**
 * Pattern URL Encoding/Decoding Utilities
 *
 * Story 4.1: Pattern URL Encoding
 * - Encodes DrumPattern to URL-safe Base64 string
 * - Decodes Base64 string back to DrumPattern
 *
 * Story 4.5: Dynamic bars/subdivision support
 * - Includes bars (1-4) and subdivision (8n/16n/32n) in encoded data
 *
 * Story 4.7: Binary compression for shorter URLs
 * - Uses bitmap for active steps (1 bit per step)
 * - Uses 4 bits per active step for finger info (1 bit hand + 3 bits finger)
 * - Compresses with pako (gzip) for further size reduction
 */

import type { DrumPattern, Subdivision } from '../types/pattern';
import { getTotalSteps } from '../types/pattern';
import { PAD_IDS, FINGER_DEFAULTS, type PadId } from '../config/padMapping';
import pako from 'pako';

/** Maximum allowed encoded string length */
const MAX_ENCODED_LENGTH = 2000;

/** Binary format version for future compatibility */
const BINARY_VERSION = 1;

/** Number of tracks (fixed at 18) */
const NUM_TRACKS = 18;

/** Subdivision encoding: 0=8n, 1=16n, 2=32n */
const SUBDIVISION_MAP: Record<Subdivision, number> = { '8n': 0, '16n': 1, '32n': 2 };
const SUBDIVISION_REVERSE: Subdivision[] = ['8n', '16n', '32n'];

/**
 * Convert standard Base64 to URL-safe Base64
 * + → -, / → _, = → removed
 */
function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert URL-safe Base64 back to standard Base64
 * - → +, _ → /, add padding
 */
function fromUrlSafe(urlSafe: string): string {
  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += '='.repeat(4 - padding);
  }
  return base64;
}

/**
 * Encode pattern name to UTF-8 bytes with length prefix
 */
function encodePatternName(name: string): Uint8Array {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name);
  // 1 byte for length (max 255 chars), then name bytes
  const result = new Uint8Array(1 + nameBytes.length);
  result[0] = Math.min(nameBytes.length, 255);
  result.set(nameBytes.slice(0, 255), 1);
  return result;
}

/**
 * Decode pattern name from UTF-8 bytes
 */
function decodePatternName(data: Uint8Array, offset: number): { name: string; bytesRead: number } {
  const length = data[offset];
  const decoder = new TextDecoder();
  const name = decoder.decode(data.slice(offset + 1, offset + 1 + length));
  return { name, bytesRead: 1 + length };
}

/**
 * Binary format structure:
 * - 1 byte: version
 * - 1 byte: bars (1-4) << 4 | subdivision (0-2) << 2 | reserved
 * - 2 bytes: BPM (big-endian)
 * - 1 byte: name length
 * - N bytes: name (UTF-8)
 * - For each track (18 total):
 *   - ceil(totalSteps/8) bytes: bitmap of active steps
 * - For each active step (in order):
 *   - 4 bits: hand (0=L, 1=R) << 3 | finger (0-4 for 1-5)
 *   - Packed 2 per byte, with padding if odd count
 */

/**
 * Encode a DrumPattern to binary format
 */
function toBinary(pattern: DrumPattern): Uint8Array {
  const totalSteps = pattern.tracks[0]?.steps.length ?? 16;
  const bitmapBytesPerTrack = Math.ceil(totalSteps / 8);

  // Calculate size
  const nameBytes = encodePatternName(pattern.name);
  const headerSize = 1 + 1 + 2 + nameBytes.length; // version + flags + bpm + name
  const bitmapSize = NUM_TRACKS * bitmapBytesPerTrack;

  // Count active steps for finger data size
  let activeCount = 0;
  pattern.tracks.forEach(track => {
    track.steps.forEach(step => {
      if (step.active) activeCount++;
    });
  });
  const fingerDataSize = Math.ceil(activeCount / 2); // 4 bits each, 2 per byte

  const totalSize = headerSize + bitmapSize + fingerDataSize;
  const buffer = new Uint8Array(totalSize);
  let offset = 0;

  // Version
  buffer[offset++] = BINARY_VERSION;

  // Flags: bars (2 bits) | subdivision (2 bits) | reserved (4 bits)
  const barsValue = pattern.bars - 1; // 0-3 for 1-4 bars
  const subdivValue = SUBDIVISION_MAP[pattern.subdivision];
  buffer[offset++] = (barsValue << 6) | (subdivValue << 4);

  // BPM (big-endian 16-bit)
  buffer[offset++] = (pattern.bpm >> 8) & 0xFF;
  buffer[offset++] = pattern.bpm & 0xFF;

  // Name
  buffer.set(nameBytes, offset);
  offset += nameBytes.length;

  // Bitmaps for each track
  const fingerData: number[] = []; // Collect finger info for active steps

  for (let trackIdx = 0; trackIdx < NUM_TRACKS; trackIdx++) {
    const track = pattern.tracks[trackIdx];
    if (!track) {
      // Empty track - fill with zeros
      offset += bitmapBytesPerTrack;
      continue;
    }

    for (let byteIdx = 0; byteIdx < bitmapBytesPerTrack; byteIdx++) {
      let byte = 0;
      for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
        const stepIdx = byteIdx * 8 + bitIdx;
        if (stepIdx < totalSteps) {
          const step = track.steps[stepIdx];
          if (step?.active) {
            byte |= (1 << (7 - bitIdx)); // MSB first
            // Collect finger data
            if (step.finger) {
              const hand = step.finger.hand === 'R' ? 1 : 0;
              const finger = (step.finger.finger - 1) & 0x07; // 0-4 for fingers 1-5
              fingerData.push((hand << 3) | finger);
            } else {
              fingerData.push(0); // Default: L hand, finger 1
            }
          }
        }
      }
      buffer[offset++] = byte;
    }
  }

  // Pack finger data (2 per byte)
  for (let i = 0; i < fingerData.length; i += 2) {
    const high = fingerData[i] << 4;
    const low = fingerData[i + 1] ?? 0;
    buffer[offset++] = high | low;
  }

  return buffer;
}

/**
 * Decode binary format to DrumPattern
 */
function fromBinary(data: Uint8Array): DrumPattern | null {
  try {
    let offset = 0;

    // Version check
    const version = data[offset++];
    if (version !== BINARY_VERSION) {
      return null;
    }

    // Flags
    const flags = data[offset++];
    const bars = ((flags >> 6) & 0x03) + 1 as 1 | 2 | 3 | 4;
    const subdivIdx = (flags >> 4) & 0x03;
    const subdivision = SUBDIVISION_REVERSE[subdivIdx] ?? '16n';

    // BPM
    const bpm = (data[offset] << 8) | data[offset + 1];
    offset += 2;

    // Name
    const { name, bytesRead } = decodePatternName(data, offset);
    offset += bytesRead;

    // Calculate sizes
    const totalSteps = getTotalSteps(bars, subdivision);
    const bitmapBytesPerTrack = Math.ceil(totalSteps / 8);

    // Create tracks and read bitmaps
    const tracks = PAD_IDS.map((padId) => ({
      padId,
      label: padId.replace(/_/g, ' '),
      defaultFinger: FINGER_DEFAULTS[padId as PadId],
      steps: Array.from({ length: totalSteps }, () => ({
        active: false,
        velocity: undefined as number | undefined,
        finger: undefined as { hand: 'L' | 'R'; finger: 1 | 2 | 3 | 4 | 5 } | undefined,
      })),
    }));

    // Read bitmaps and collect active step positions
    const activePositions: Array<{ trackIdx: number; stepIdx: number }> = [];

    for (let trackIdx = 0; trackIdx < NUM_TRACKS; trackIdx++) {
      for (let byteIdx = 0; byteIdx < bitmapBytesPerTrack; byteIdx++) {
        const byte = data[offset++];
        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
          const stepIdx = byteIdx * 8 + bitIdx;
          if (stepIdx < totalSteps) {
            if (byte & (1 << (7 - bitIdx))) {
              tracks[trackIdx].steps[stepIdx].active = true;
              tracks[trackIdx].steps[stepIdx].velocity = 100;
              activePositions.push({ trackIdx, stepIdx });
            }
          }
        }
      }
    }

    // Read finger data
    for (let i = 0; i < activePositions.length; i++) {
      const byteIdx = Math.floor(i / 2);
      const isHigh = i % 2 === 0;
      const byte = data[offset + byteIdx];
      const nibble = isHigh ? (byte >> 4) & 0x0F : byte & 0x0F;

      const hand: 'L' | 'R' = (nibble >> 3) ? 'R' : 'L';
      const finger = ((nibble & 0x07) + 1) as 1 | 2 | 3 | 4 | 5;

      const { trackIdx, stepIdx } = activePositions[i];
      tracks[trackIdx].steps[stepIdx].finger = { hand, finger };
    }

    return {
      id: `shared-${Date.now()}`,
      name,
      bpm,
      subdivision,
      bars,
      tracks,
    };
  } catch {
    return null;
  }
}

/**
 * Encode a DrumPattern to a URL-safe Base64 string
 *
 * @param pattern - The pattern to encode
 * @returns URL-safe encoded string, or null if encoding fails or exceeds length limit
 */
export function encodePattern(pattern: DrumPattern): string | null {
  try {
    // Convert to binary format
    const binary = toBinary(pattern);

    // Compress with gzip
    const compressed = pako.deflate(binary);

    // Convert to Base64
    let base64 = '';
    const bytes = new Uint8Array(compressed);
    for (let i = 0; i < bytes.length; i++) {
      base64 += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(base64);

    // Convert to URL-safe
    const urlSafe = toUrlSafe(base64);

    // Check length limit
    if (urlSafe.length > MAX_ENCODED_LENGTH) {
      return null;
    }

    return urlSafe;
  } catch {
    return null;
  }
}

/**
 * Decode a URL-safe Base64 string to a DrumPattern
 *
 * @param encoded - The URL-safe encoded string
 * @returns DrumPattern object, or null if decoding fails
 */
export function decodePattern(encoded: string): DrumPattern | null {
  try {
    // Convert from URL-safe to standard Base64
    const base64 = fromUrlSafe(encoded);

    // Decode from Base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress
    const decompressed = pako.inflate(bytes);

    // Decode binary format
    return fromBinary(decompressed);
  } catch {
    return null;
  }
}

/** Export max length for testing */
export { MAX_ENCODED_LENGTH };
