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
export function toggleAmbientSoundscape(forceState) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const target = forceState !== undefined ? forceState : !isAmbientActive;

  if (target && !isAmbientActive) {
    try {
      // 432 Hz warm fundamental with dual binaural beating (432Hz + 436Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const masterGain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(216, ctx.currentTime); // Sub-octave

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(218, ctx.currentTime); // 2Hz binaural theta beat

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      ambientOsc = { osc1, osc2 };
      ambientGain = masterGain;
      isAmbientActive = true;
      return true;
    } catch (e) {
      return false;
    }
  } else if (!target && isAmbientActive) {
    try {
      if (ambientGain && ctx) {
        ambientGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        setTimeout(() => {
          if (ambientOsc) {
            ambientOsc.osc1.stop();
            ambientOsc.osc2.stop();
            ambientOsc = null;
            ambientGain = null;
          }
          isAmbientActive = false;
        }, 800);
      }
    } catch (e) {
      isAmbientActive = false;
    }
    return false;
  }
  return isAmbientActive;
}

export function getAmbientStatus() {
  return isAmbientActive;
}
