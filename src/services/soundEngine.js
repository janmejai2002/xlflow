/**
 * Generative Web Audio Synthesizer for XL-Flow
 * Zero external audio assets; 100% synthesized via Web Audio API.
 * Provides tactile haptic clicks and generative 432Hz ambient campus drone.
 */

let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;
let isAmbientActive = false;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a crisp, luxury mechanical click (15ms pitch-decay sine oscillator)
 */
export function playTactileClick(pitch = 800) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.018);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch (e) {
    // Audio policies in non-user-interactive states
  }
}

/**
 * Synthesizes an ultra-subtle 6ms mechanical tick for micro-interactions (hover, stepper, toggle)
 */
export function playSoftClick(pitch = 950) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.009);

    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.009);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  } catch (e) {}
}

/**
 * Synthesizes a luxury two-tone affirmative chime (520Hz -> 780Hz) for instant actions & copy
 */
export function playHapticSuccess() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [520, 784];
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.05, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch (e) {}
}

/**
 * Synthesizes a rich 432Hz singing bowl overtone chime for holistic peace of mind
 */
export function playHarmonicChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const harmonics = [432, 864, 1296];
    harmonics.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const decay = 1.2 + i * 0.4;
      gain.gain.setValueAtTime(0.05 / (i + 1), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + decay);
    });
  } catch (e) {}
}

/**
 * Synthesizes a resonant bell chime for milestones & streak achievements
 */
export function playChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const fundamental = 528; // Harmonic frequency
    [1, 1.5, 2].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * ratio, ctx.currentTime);

      const decay = 0.8 + i * 0.3;
      gain.gain.setValueAtTime(0.06 / (i + 1), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + decay);
    });
  } catch (e) {}
}

/**
 * Toggles the meditative 432Hz binaural campus focus drone
 */
