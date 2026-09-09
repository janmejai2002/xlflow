import confetti from 'canvas-confetti';

// wAIbi-sabi Earthy Palette: Water, Moss, Ochre, Hanko Red, Plum
const WAIBI_COLORS = ['#00A9B8', '#6E8C63', '#C2913A', '#8A6690', '#D2543F'];

/**
 * Fires dual side cannons when clicking the attendance streak badge
 */
export function fireStreakConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: WAIBI_COLORS,
    zIndex: 9999
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Fires center radial burst when generating or downloading the Academic Pass
 */
export function firePassConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: WAIBI_COLORS,
    zIndex: 9999
  });
}
