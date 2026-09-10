import { calculateBunkStats, simulateAttendance, STATUTORY_THRESHOLD } from '../src/services/bunkCalculator.js';
import { generateIcs } from '../src/services/calendarExport.js';
import { findNaturalGetaways, buildDailyScheduleMap } from '../src/services/tripPlanner.js';
import { SAMPLE_SCHEDULE, SAMPLE_DEADLINES, SAMPLE_COURSES } from '../src/data/sampleData.js';

function runMathSuite() {
  console.log('================================================================');
  console.log('📐 XL-FLOW MATHEMATICAL ENGINES & ALGORITHM VERIFICATION 📐');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, name, details = '') {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
      if (details) console.log(`     ↳ ${details}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (details) console.error(`     ↳ ${details}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // =========================================================================
  // 1. STATUTORY THRESHOLD VALUE
  // =========================================================================
  console.log('--- 1. Statutory Threshold Definition ---');
  assert(STATUTORY_THRESHOLD === 0.80, 'Statutory threshold is exactly 0.80 (80.0%)');

  // =========================================================================
  // 2. TERM KICKOFF EDGE CASE: calculateBunkStats(0, 0, 20)
  // =========================================================================
  console.log('\n--- 2. Term Kickoff Edge Case: calculateBunkStats(0, 0, 20) ---');
  const kickoff = calculateBunkStats(0, 0, 20);
  assert(kickoff.attended === 0, 'Kickoff attended = 0');
  assert(kickoff.conducted === 0, 'Kickoff conducted = 0');
  assert(kickoff.totalPlanned === 20, 'Kickoff totalPlanned = 20');
  assert(kickoff.remaining === 20, 'Kickoff remaining = 20');
  assert(kickoff.currentPercentage === 100.0, 'Kickoff currentPercentage = 100.0% (clean slate default)');
  assert(kickoff.maxPossiblePercentage === 100.0, 'Kickoff maxPossiblePercentage = 100.0%');
  // Safe bunks across remaining: Math.floor((0 + 20) - 0.80 * 20) = Math.floor(20 - 16) = 4
  assert(kickoff.safeBunksRemaining === 4, 'Kickoff safeBunksRemaining = 4 classes', `Safe Bunks: ${kickoff.safeBunksRemaining}`);
  // Safe immediate: Math.floor(0 / 0.8 - 0) = 0
  assert(kickoff.safeImmediateBunks === 0, 'Kickoff safeImmediateBunks = 0 (cannot immediately bunk lecture 1 without dropping to 0%)');
  assert(kickoff.recoveryRequired === 0, 'Kickoff recoveryRequired = 0');
  assert(kickoff.isDebarredRisk === false, 'Kickoff isDebarredRisk = false');
  assert(kickoff.tier === 'safe', 'Kickoff tier = "safe"');

  // =========================================================================
  // 3. STATUTORY 80.0% BOUNDARY: calculateBunkStats(16, 20, 20)
  // =========================================================================
  console.log('\n--- 3. Statutory 80.0% Boundary: calculateBunkStats(16, 20, 20) ---');
  const boundary80 = calculateBunkStats(16, 20, 20);
  assert(boundary80.attended === 16, 'Boundary attended = 16');
  assert(boundary80.conducted === 20, 'Boundary conducted = 20');
  assert(boundary80.remaining === 0, 'Boundary remaining = 0');
  assert(boundary80.currentPercentage === 80.0, 'Boundary currentPercentage = 80.0% exactly');
  assert(boundary80.maxPossiblePercentage === 80.0, 'Boundary maxPossiblePercentage = 80.0%');
  assert(boundary80.safeBunksRemaining === 0, 'Boundary safeBunksRemaining = 0 (zero margin left)');
  assert(boundary80.safeImmediateBunks === 0, 'Boundary safeImmediateBunks = 0');
  assert(boundary80.recoveryRequired === 0, 'Boundary recoveryRequired = 0 (compliant with 80%)');
  assert(boundary80.isDebarredRisk === false, 'Boundary isDebarredRisk = false');
  assert(boundary80.tier === 'warning', 'Boundary tier = "warning" (attendance < 85.0% and safeBunks <= 1)');

  // =========================================================================
  // 4. DEBARMENT DANGER CASE: calculateBunkStats(15, 20, 20)
  // =========================================================================
  console.log('\n--- 4. Debarment Danger: calculateBunkStats(15, 20, 20) ---');
  const danger75 = calculateBunkStats(15, 20, 20);
  assert(danger75.attended === 15, 'Danger attended = 15');
  assert(danger75.conducted === 20, 'Danger conducted = 20');
  assert(danger75.remaining === 0, 'Danger remaining = 0');
  assert(danger75.currentPercentage === 75.0, 'Danger currentPercentage = 75.0% (below 80% threshold)');
  assert(danger75.safeBunksRemaining === 0, 'Danger safeBunksRemaining = 0');
  // Recovery: ceil((0.80*20 - 15) / (1 - 0.80)) = ceil(1 / 0.2) = 5
  assert(danger75.recoveryRequired === 5, 'Danger recoveryRequired = 5 consecutive classes');
  // Since remaining = 0 and recoveryRequired = 5, recoveryRequired > remaining -> debarred!
  assert(danger75.isDebarredRisk === true, 'Danger isDebarredRisk = true (term finished, debarred)');
  assert(danger75.tier === 'danger', 'Danger tier = "danger"');

  // =========================================================================
  // 5. MID-TERM 100% ATTENDANCE & BUFFER: calculateBunkStats(10, 10, 20)
  // =========================================================================
  console.log('\n--- 5. Mid-Term 100% Attendance: calculateBunkStats(10, 10, 20) ---');
  const midTerm100 = calculateBunkStats(10, 10, 20);
  assert(midTerm100.currentPercentage === 100.0, 'Mid-term currentPercentage = 100.0%');
  // Safe bunks across remaining: Math.floor((10 + 10) - 0.80 * 20) = Math.floor(20 - 16) = 4
  assert(midTerm100.safeBunksRemaining === 4, 'Mid-term safeBunksRemaining = 4');
  // Safe immediate bunks: Math.floor(10 / 0.80 - 10) = Math.floor(12.5 - 10) = 2
  assert(midTerm100.safeImmediateBunks === 2, 'Mid-term safeImmediateBunks = 2 (can miss next 2 consecutive classes today)');
  assert(midTerm100.tier === 'safe', 'Mid-term tier = "safe"');

  // =========================================================================
  // 6. MID-TERM MATHEMATICAL DEBARMENT: calculateBunkStats(8, 14, 20)
  // =========================================================================
  console.log('\n--- 6. Mid-Term Mathematical Debarment: calculateBunkStats(8, 14, 20) ---');
  // 8 attended out of 14 conducted. Remaining = 6. Max possible = (8 + 6) / 20 = 70.0% < 80.0%
  const midTermDebarred = calculateBunkStats(8, 14, 20);
  assert(midTermDebarred.currentPercentage === 57.1, 'Mid-term currentPercentage = 57.1%');
  assert(midTermDebarred.maxPossiblePercentage === 70.0, 'Mid-term maxPossiblePercentage = 70.0% (below 80%)');
  assert(midTermDebarred.isDebarredRisk === true, 'isDebarredRisk = true (impossible to recover)');
  assert(midTermDebarred.tier === 'danger', 'Mid-term tier = "danger"');

  // =========================================================================
  // 7. WHAT-IF ATTENDANCE SIMULATOR: simulateAttendance
  // =========================================================================
  console.log('\n--- 7. What-If Attendance Simulator (simulateAttendance) ---');
  // Base: 16 attended, 20 conducted (80.0%)
  // Attend 1 next class: 17 / 21 = 80.95% -> 81.0%
  const simAttend1 = simulateAttendance(16, 20, 1, 1);
  assert(simAttend1 === 81.0, 'Simulate attending 1 class: 16/20 -> 17/21 = 81.0%', `Result: ${simAttend1}%`);

  // Skip 1 next class: 16 / 21 = 76.19% -> 76.2%
  const simSkip1 = simulateAttendance(16, 20, 0, 1);
  assert(simSkip1 === 76.2, 'Simulate skipping 1 class: 16/20 -> 16/21 = 76.2%', `Result: ${simSkip1}%`);

  // Skip 2 next classes: 16 / 22 = 72.72% -> 72.7%
  const simSkip2 = simulateAttendance(16, 20, 0, 2);
  assert(simSkip2 === 72.7, 'Simulate skipping 2 classes: 16/20 -> 16/22 = 72.7%', `Result: ${simSkip2}%`);

  // Attend 2 and Skip 2: 18 / 24 = 75.0%
  const simMixed = simulateAttendance(16, 20, 2, 4);
  assert(simMixed === 75.0, 'Simulate 2 attends + 2 skips: 18/24 = 75.0%', `Result: ${simMixed}%`);

  // Zero-division safeguard test
  const simZero = simulateAttendance(0, 0, 0, 0);
  assert(simZero === 0.0, 'Simulate with zero base and zero delta handled safely without NaN', `Result: ${simZero}%`);

  // =========================================================================
  // 8. RFC 5545 iCALENDAR GENERATOR (.ics)
  // =========================================================================
  console.log('\n--- 8. RFC 5545 iCalendar (.ics) Generator ---');
  const testSessions = SAMPLE_SCHEDULE.slice(0, 5);
  const icsOutput = generateIcs(testSessions, 'XLRI Term 5 Timetable');
  
  assert(typeof icsOutput === 'string', '.ics output is a valid string');
  assert(icsOutput.startsWith('BEGIN:VCALENDAR'), '.ics starts with BEGIN:VCALENDAR');
  assert(icsOutput.includes('VERSION:2.0'), '.ics declares VERSION:2.0');
  assert(icsOutput.includes('PRODID:-//XL-Flow//XLRI Student Calendar 1.0//EN'), '.ics contains valid PRODID');
  assert(icsOutput.includes('X-WR-TIMEZONE:Asia/Kolkata'), '.ics declares Asia/Kolkata timezone');
  assert(icsOutput.includes('BEGIN:VTIMEZONE') && icsOutput.includes('TZID:Asia/Kolkata'), '.ics embeds VTIMEZONE block for Asia/Kolkata');
  assert(icsOutput.includes('TZOFFSETFROM:+0530') && icsOutput.includes('TZOFFSETTO:+0530'), '.ics timezone offset is +05:30 (IST)');

  // Count VEVENT blocks
  const veventCount = (icsOutput.match(/BEGIN:VEVENT/g) || []).length;
  assert(veventCount === testSessions.length, `.ics contains exact VEVENT count for sessions (${veventCount}/${testSessions.length})`);

  // Validate VEVENT fields
  assert(icsOutput.includes('UID:'), 'VEVENT contains UID');
  assert(icsOutput.includes('DTSTART;TZID=Asia/Kolkata:'), 'VEVENT contains DTSTART with Asia/Kolkata TZID');
  assert(icsOutput.includes('DTEND;TZID=Asia/Kolkata:'), 'VEVENT contains DTEND with Asia/Kolkata TZID');
  assert(icsOutput.includes('SUMMARY:['), 'VEVENT contains SUMMARY with course code tag');
  assert(icsOutput.includes('LOCATION:'), 'VEVENT contains LOCATION');
  assert(icsOutput.includes('STATUS:CONFIRMED'), 'VEVENT contains STATUS:CONFIRMED');

  // Validate 15-min reminder alarm
  assert(icsOutput.includes('BEGIN:VALARM'), 'VEVENT includes advance reminder VALARM');
  assert(icsOutput.includes('TRIGGER:-PT15M'), 'VALARM trigger is -PT15M (15 minutes prior)');
  assert(icsOutput.includes('ACTION:DISPLAY'), 'VALARM action is DISPLAY');

  // Validate line folding (RFC 5545 section 3.1: lines should not exceed 75 octets)
  const lines = icsOutput.split('\r\n');
  const maxLineLen = Math.max(...lines.map(l => l.length));
  assert(maxLineLen <= 75, `All .ics lines obey RFC 5545 line folding <= 75 chars (max observed: ${maxLineLen} chars)`);
  assert(icsOutput.trim().endsWith('END:VCALENDAR'), '.ics cleanly terminates with END:VCALENDAR');

  // =========================================================================
  // 9. LONG WEEKEND TRIP FINDER & NATURAL GETAWAY OPTIMIZER
  // =========================================================================
  console.log('\n--- 9. Long Weekend Trip Finder & Natural Getaways ---');
  const dailyMap = buildDailyScheduleMap(SAMPLE_SCHEDULE, SAMPLE_DEADLINES);
  assert(typeof dailyMap === 'object' && Object.keys(dailyMap).length > 0, 'buildDailyScheduleMap creates date map from schedule');

  const getaways = findNaturalGetaways(SAMPLE_SCHEDULE, SAMPLE_DEADLINES);
  assert(Array.isArray(getaways), 'findNaturalGetaways returns an array');
  assert(getaways.length > 0, `Discovered ${getaways.length} natural getaways in Term 5`);
  
  const sampleTrip = getaways[0];
  assert(typeof sampleTrip.startDate === 'string', 'Getaway has valid startDate');
  assert(typeof sampleTrip.endDate === 'string', 'Getaway has valid endDate');
  assert(sampleTrip.lengthDays >= 3, `Getaway length is at least 3 days (observed: ${sampleTrip.lengthDays} days)`);
  assert(sampleTrip.classesMissed <= 1, `Getaway misses at most 1 class (observed: ${sampleTrip.classesMissed} missed)`);
  assert(typeof sampleTrip.rating === 'string', `Getaway has rating tag: "${sampleTrip.rating}"`);

  // Verify zero exams constraint
  let anyExamsDuringGetaways = false;
  for (const trip of getaways) {
    // Check if any date during trip has hasExam
    let curr = new Date(trip.startDate + 'T00:00:00');
    const end = new Date(trip.endDate + 'T00:00:00');
    while (curr <= end) {
      const dStr = curr.toISOString().split('T')[0];
      if (dailyMap[dStr]?.hasExam) {
        anyExamsDuringGetaways = true;
      }
      curr.setDate(curr.getDate() + 1);
    }
  }
  assert(!anyExamsDuringGetaways, 'Zero exam conflicts verified across all identified getaways');

  console.log('\n================================================================');
  console.log(`🎉 MATHEMATICAL ENGINES RESULTS: ${passed}/${total} PASSED (100%)`);
  console.log('================================================================\n');
}

runMathSuite();
