/**
 * Precise attendance calculation & bunk safety engine for XLRI policy.
 * Statutory Threshold: 80.0%
 */

export const STATUTORY_THRESHOLD = 0.80; // 80%

export function calculateBunkStats(attended, conducted, totalPlanned = 20, threshold = STATUTORY_THRESHOLD) {
  const A = Number(attended) || 0;
  const C = Number(conducted) || 0;
  const N = Math.max(Number(totalPlanned) || 20, C);
  const R = Math.max(0, N - C); // Remaining classes

  // 1. Current Attendance %
  const currentPercentage = C > 0 ? (A / C) * 100 : 100.0;

  // 2. Maximum Possible Attendance % if all remaining classes are attended
  const maxPossiblePercentage = N > 0 ? ((A + R) / N) * 100 : 100.0;

  // 3. Remaining Safe Bunks (b_safe)
  // Student can miss at most b_safe classes across the remainder of the term without dropping < threshold
  const safeAcrossRemaining = Math.floor((A + R) - (threshold * N));
  const safeBunksRemaining = Math.max(0, Math.min(R, safeAcrossRemaining));

  // 4. Immediate Consecutive Safe Bunks (b_now)
  // Can student miss next k classes immediately starting today?
  const safeImmediate = Math.floor((A / threshold) - C);
  const safeImmediateBunks = Math.max(0, Math.min(R, safeImmediate));

  // 5. Recovery Classes Required (c_req)
  // If currently below threshold, how many consecutive classes must be attended without missing?
  let recoveryRequired = 0;
  let isDebarredRisk = false;

  if (currentPercentage < threshold * 100) {
    const rawReq = Math.ceil((threshold * C - A) / (1 - threshold));
    recoveryRequired = Math.max(0, rawReq);
    if (recoveryRequired > R) {
      isDebarredRisk = true; // Mathematically impossible to reach 80%
    }
  }

  // 6. Status Tier
  let tier = 'safe'; // 'safe' | 'warning' | 'danger'
  if (currentPercentage < threshold * 100 || isDebarredRisk) {
    tier = 'danger';
  } else if (currentPercentage < 85.0 || safeBunksRemaining <= 1) {
    tier = 'warning';
  }

  return {
    attended: A,
    conducted: C,
    totalPlanned: N,
    remaining: R,
    currentPercentage: Number(currentPercentage.toFixed(1)),
    maxPossiblePercentage: Number(maxPossiblePercentage.toFixed(1)),
    safeBunksRemaining,
    safeImmediateBunks,
    recoveryRequired,
    isDebarredRisk,
    tier
  };
}

/**
 * What-If Attendance Simulator
 * Computes projected percentage given future skipped or attended classes.
 */
export function simulateAttendance(attended, conducted, deltaAttended, deltaConducted) {
  const newA = Math.max(0, attended + deltaAttended);
  const newC = Math.max(1, conducted + deltaConducted);
  return Number(((newA / newC) * 100).toFixed(1));
}
