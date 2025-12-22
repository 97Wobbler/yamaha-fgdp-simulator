/**
 * Audio Store - Manages Tone.js synthesizers for drum sounds
 *
 * Story 2.5: Audio Store
 * - Initializes AudioContext on first user interaction
 * - Creates synthesizers for 18 drum pads (no sample files needed)
 * - Provides playPad(padId, time?) for sound playback
 *
 * Timing Fix: Uses Web Audio API's precise scheduling
 * - Optional `time` parameter for sample-accurate playback
 * - When time is provided, sounds are scheduled at exact audio clock time
 */

import { create } from 'zustand';
import * as Tone from 'tone';
import { type PadId } from '../config/padMapping';

/** Synth trigger function type - accepts optional time for precise scheduling */
type SynthTrigger = (time?: number) => void;

interface AudioStore {
  /** Whether Tone.js AudioContext has been started */
  isAudioReady: boolean;
  /** Whether synths are currently initializing */
  isLoading: boolean;
  /** Error message if initialization failed */
  error: string | null;
  /** Map of pad ID to synth trigger function */
  triggers: Partial<Record<PadId, SynthTrigger>>;

  /** Initialize audio context and create synths (call on first user interaction) */
  initAudio: () => Promise<void>;
  /** Play a drum sound for a specific pad
   * @param padId - The pad to trigger
   * @param time - Optional Web Audio time for precise scheduling (from Transport callback)
   */
  playPad: (padId: PadId, time?: number) => void;
  /** Dispose all synths and reset state */
  dispose: () => void;
}

/**
 * Create all drum synthesizers
 * Returns a map of pad ID to trigger function
 * Each trigger function accepts optional `time` for precise scheduling
 */
function createDrumSynths(): {
  triggers: Record<PadId, SynthTrigger>;
  disposables: Tone.ToneAudioNode[];
} {
  const triggers: Partial<Record<PadId, SynthTrigger>> = {};
  const disposables: Tone.ToneAudioNode[] = [];

  // === KICK ===
  const kickSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4 },
  }).toDestination();
  disposables.push(kickSynth);
  triggers.kick = (time) => kickSynth.triggerAttackRelease('C1', '8n', time);

  // === SNARE ===
  const snareNoise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
  }).toDestination();
  snareNoise.volume.value = -6;
  const snareMembrane = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
  }).toDestination();
  snareMembrane.volume.value = -3;
  disposables.push(snareNoise, snareMembrane);
  triggers.snare = (time) => {
    snareNoise.triggerAttackRelease('8n', time);
    snareMembrane.triggerAttackRelease('E2', '8n', time);
  };

  // === SNARE RIM (open) ===
  const rimOpenSynth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
    harmonicity: 3.1,
    modulationIndex: 16,
    resonance: 8000,
    octaves: 1,
  }).toDestination();
  rimOpenSynth.frequency.value = 300;
  rimOpenSynth.volume.value = -12;
  disposables.push(rimOpenSynth);
  triggers.snare_rim_open = (time) => rimOpenSynth.triggerAttackRelease('16n', time ?? Tone.now());

  // === SNARE RIM (closed/cross-stick) ===
  const rimClosedSynth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.05, release: 0.02 },
    harmonicity: 5,
    modulationIndex: 20,
    resonance: 6000,
    octaves: 0.5,
  }).toDestination();
  rimClosedSynth.frequency.value = 400;
  rimClosedSynth.volume.value = -15;
  disposables.push(rimClosedSynth);
  triggers.snare_rim_closed = (time) => rimClosedSynth.triggerAttackRelease('32n', time ?? Tone.now());

  // === HI-HAT CLOSED (Left) ===
  const hihatClosedL = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.03 },
  }).toDestination();
  hihatClosedL.volume.value = -10;
  const hihatFilterL = new Tone.Filter(8000, 'highpass').toDestination();
  hihatClosedL.connect(hihatFilterL);
  disposables.push(hihatClosedL, hihatFilterL);
  triggers.hihat_close_l = (time) => hihatClosedL.triggerAttackRelease('32n', time);

  // === HI-HAT CLOSED (Right) ===
  const hihatClosedR = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.03 },
  }).toDestination();
  hihatClosedR.volume.value = -10;
  const hihatFilterR = new Tone.Filter(8000, 'highpass').toDestination();
  hihatClosedR.connect(hihatFilterR);
  disposables.push(hihatClosedR, hihatFilterR);
  triggers.hihat_close_r = (time) => hihatClosedR.triggerAttackRelease('32n', time);

  // === HI-HAT OPEN ===
  const hihatOpen = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.2 },
  }).toDestination();
  hihatOpen.volume.value = -10;
  const hihatOpenFilter = new Tone.Filter(7000, 'highpass').toDestination();
  hihatOpen.connect(hihatOpenFilter);
  disposables.push(hihatOpen, hihatOpenFilter);
  triggers.hihat_open = (time) => hihatOpen.triggerAttackRelease('8n', time);

  // === CRASH (Left) ===
  const crashL = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1.5, release: 0.8 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination();
  crashL.frequency.value = 300;
  crashL.volume.value = -8;
  disposables.push(crashL);
  triggers.crash_l = (time) => crashL.triggerAttackRelease('2n', time ?? Tone.now());

  // === CRASH (Right) ===
  const crashR = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 1.5, release: 0.8 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4200,
    octaves: 1.5,
  }).toDestination();
  crashR.frequency.value = 320;
  crashR.volume.value = -8;
  disposables.push(crashR);
  triggers.crash_r = (time) => crashR.triggerAttackRelease('2n', time ?? Tone.now());

  // === RIDE CUP ===
  const rideCup = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.4, release: 0.3 },
    harmonicity: 8,
    modulationIndex: 24,
    resonance: 5000,
    octaves: 1,
  }).toDestination();
  rideCup.frequency.value = 400;
  rideCup.volume.value = -10;
  disposables.push(rideCup);
  triggers.ride_cup = (time) => rideCup.triggerAttackRelease('8n', time ?? Tone.now());

  // === RIDE BOW ===
  const rideBow = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.8, release: 0.5 },
    harmonicity: 6,
    modulationIndex: 20,
    resonance: 4500,
    octaves: 1.2,
  }).toDestination();
  rideBow.frequency.value = 350;
  rideBow.volume.value = -10;
  disposables.push(rideBow);
  triggers.ride_bow = (time) => rideBow.triggerAttackRelease('4n', time ?? Tone.now());

  // === SPLASH ===
  const splash = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.6, release: 0.4 },
    harmonicity: 6.5,
    modulationIndex: 28,
    resonance: 5500,
    octaves: 1.3,
  }).toDestination();
  splash.frequency.value = 380;
  splash.volume.value = -8;
  disposables.push(splash);
  triggers.splash = (time) => splash.triggerAttackRelease('4n', time ?? Tone.now());

  // === TOM LOW (Left) ===
  const tomLowL = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.3 },
  }).toDestination();
  tomLowL.volume.value = -3;
  disposables.push(tomLowL);
  triggers.tom_low_l = (time) => tomLowL.triggerAttackRelease('G1', '8n', time);

  // === TOM LOW (Right) ===
  const tomLowR = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.3 },
  }).toDestination();
  tomLowR.volume.value = -3;
  disposables.push(tomLowR);
  triggers.tom_low_r = (time) => tomLowR.triggerAttackRelease('A1', '8n', time);

  // === TOM MID (Left) ===
  const tomMidL = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0.01, release: 0.25 },
  }).toDestination();
  tomMidL.volume.value = -3;
  disposables.push(tomMidL);
  triggers.tom_mid_l = (time) => tomMidL.triggerAttackRelease('C2', '8n', time);

  // === TOM MID (Right) ===
  const tomMidR = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0.01, release: 0.25 },
  }).toDestination();
  tomMidR.volume.value = -3;
  disposables.push(tomMidR);
  triggers.tom_mid_r = (time) => tomMidR.triggerAttackRelease('D2', '8n', time);

  // === TOM HIGH (Left) ===
  const tomHighL = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 },
  }).toDestination();
  tomHighL.volume.value = -3;
  disposables.push(tomHighL);
  triggers.tom_high_l = (time) => tomHighL.triggerAttackRelease('F2', '8n', time);

  // === TOM HIGH (Right) ===
  const tomHighR = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.2 },
  }).toDestination();
  tomHighR.volume.value = -3;
  disposables.push(tomHighR);
  triggers.tom_high_r = (time) => tomHighR.triggerAttackRelease('G2', '8n', time);

  return { triggers: triggers as Record<PadId, SynthTrigger>, disposables };
}

// Store the disposables outside Zustand for cleanup
let synthDisposables: Tone.ToneAudioNode[] = [];

export const useAudioStore = create<AudioStore>((set, get) => ({
  isAudioReady: false,
  isLoading: false,
  error: null,
  triggers: {},

  initAudio: async () => {
    const state = get();

    // Already initialized or loading
    if (state.isAudioReady || state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Start Tone.js AudioContext (required due to browser autoplay policy)
      await Tone.start();

      // Create all drum synths
      const { triggers, disposables } = createDrumSynths();
      synthDisposables = disposables;

      set({
        isAudioReady: true,
        isLoading: false,
        triggers,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      set({
        isLoading: false,
        error: `Audio initialization failed: ${errorMessage}`,
      });
    }
  },

  playPad: (padId: PadId, time?: number) => {
    const { triggers, isAudioReady } = get();

    if (!isAudioReady) {
      return;
    }

    const trigger = triggers[padId];
    if (trigger) {
      // Pass time for precise scheduling (undefined = play immediately)
      trigger(time);
    }
  },

  dispose: () => {
    // Dispose all synths
    synthDisposables.forEach((node) => {
      try {
        node.dispose();
      } catch {
        // Ignore disposal errors
      }
    });
    synthDisposables = [];

    set({
      isAudioReady: false,
      isLoading: false,
      error: null,
      triggers: {},
    });
  },
}));
