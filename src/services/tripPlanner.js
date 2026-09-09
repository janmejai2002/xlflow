/**
 * Trip Planner & Weekend Getaway Optimizer for XLRI Students.
 * Ported & enhanced from Term-4 Command Centre algorithms.
 */

// Helper to pad dates
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

// Map schedule into date -> { totalClasses, courses: { [code]: count }, hasExam }
export function buildDailyScheduleMap(schedule = [], deadlines = []) {
  const map = {};

  // Group scheduled classes
  for (const s of schedule) {
    const d = s.classDate;
    if (!map[d]) {
      map[d] = { totalClasses: 0, courses: {}, hasExam: false, sessions: [] };
    }
    map[d].totalClasses += 1;
    map[d].courses[s.courseCode] = (map[d].courses[s.courseCode] || 0) + 1;
    map[d].sessions.push(s);
  }

  // Flag quizzes / exams from deadlines or sessions
  for (const d of deadlines) {
    if (d.dueDate && (d.type?.toLowerCase().includes('quiz') || d.type?.toLowerCase().includes('exam'))) {
      const dateStr = d.dueDate.split('T')[0];
      if (map[dateStr]) map[dateStr].hasExam = true;
    }
  }

  return map;
}

// Generate all calendar dates between start and end date strings
export function generateDateRange(startStr, endStr) {
  const dates = [];
  const curr = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');

  while (curr <= end) {
    const dStr = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
    dates.push(dStr);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/**
 * Solo Gap Scanner: Finds naturally occurring 3+ day windows with 0 exams and <= 1 class missed.
 */
export function findNaturalGetaways(schedule = [], deadlines = []) {
  if (!schedule.length) return [];

  const sortedSessions = [...schedule].sort((a, b) => a.classDate.localeCompare(b.classDate));
  const startDate = sortedSessions[0].classDate;
  const endDate = sortedSessions[sortedSessions.length - 1].classDate;

  const dailyMap = buildDailyScheduleMap(schedule, deadlines);
  const allDates = generateDateRange(startDate, endDate);

  const getaways = [];

  for (let i = 0; i <= allDates.length - 3; i++) {
    const d1 = allDates[i];
    const d2 = allDates[i + 1];
    const d3 = allDates[i + 2];

    const c1 = dailyMap[d1] || { totalClasses: 0, courses: {}, hasExam: false };
    const c2 = dailyMap[d2] || { totalClasses: 0, courses: {}, hasExam: false };
    const c3 = dailyMap[d3] || { totalClasses: 0, courses: {}, hasExam: false };

    // Zero exams condition
    if (!c1.hasExam && !c2.hasExam && !c3.hasExam) {
      const initialMissed = c1.totalClasses + c2.totalClasses + c3.totalClasses;

      if (initialMissed <= 1) {
        // Greedily extend forward if consecutive zero-class days follow
        let endIdx = i + 2;
        while (
          endIdx + 1 < allDates.length &&
          (!dailyMap[allDates[endIdx + 1]] || dailyMap[allDates[endIdx + 1]].totalClasses === 0) &&
          (!dailyMap[allDates[endIdx + 1]] || !dailyMap[allDates[endIdx + 1]].hasExam)
        ) {
          endIdx++;
        }

        // Aggregate missed courses
        const missedCourses = {};
        for (let k = i; k <= endIdx; k++) {
          const dayInfo = dailyMap[allDates[k]];
          if (dayInfo && dayInfo.courses) {
            for (const [code, count] of Object.entries(dayInfo.courses)) {
              missedCourses[code] = (missedCourses[code] || 0) + count;
            }
          }
        }

        getaways.push({
          startDate: allDates[i],
          endDate: allDates[endIdx],
          lengthDays: endIdx - i + 1,
          classesMissed: initialMissed,
          missedCourses,
          rating: initialMissed === 0 ? 'Zero Classes Missed 🌴' : 'Miss 1 Class Only 🌿'
        });

        i = endIdx; // Skip past this getaway
      }
    }
  }

  return getaways;
}

/**
 * Custom Trip Calculator: Finds windows of length `duration` missing at most `maxMissedClasses`.
 */
export function findCustomTrips(schedule = [], deadlines = [], duration = 3, maxMissedClasses = 1) {
  if (!schedule.length) return [];

  const sortedSessions = [...schedule].sort((a, b) => a.classDate.localeCompare(b.classDate));
  const startDate = sortedSessions[0].classDate;
  const endDate = sortedSessions[sortedSessions.length - 1].classDate;

  const dailyMap = buildDailyScheduleMap(schedule, deadlines);
  const allDates = generateDateRange(startDate, endDate);

  const results = [];
  const dur = Math.max(1, Math.min(14, Number(duration) || 3));
  const maxM = Math.max(0, Number(maxMissedClasses) || 0);

  for (let i = 0; i <= allDates.length - dur; i++) {
    let totalMissed = 0;
    let hasExam = false;
    const missedCourses = {};

    for (let j = 0; j < dur; j++) {
      const dStr = allDates[i + j];
      const dayInfo = dailyMap[dStr] || { totalClasses: 0, courses: {}, hasExam: false };
      if (dayInfo.hasExam) {
        hasExam = true;
        break;
      }
      totalMissed += dayInfo.totalClasses;
      for (const [code, count] of Object.entries(dayInfo.courses)) {
        missedCourses[code] = (missedCourses[code] || 0) + count;
      }
    }

    if (!hasExam && totalMissed <= maxM) {
      results.push({
        startDate: allDates[i],
        endDate: allDates[i + dur - 1],
        lengthDays: dur,
        classesMissed: totalMissed,
        missedCourses
      });
    }
  }

  return results;
}

/**
 * Group Vulnerability Calculation
 * Mathematical penalty based on attendance cushion.
 */
export function getVulnerability(safeBuffer) {
  if (safeBuffer <= 0) return 1000; // Debarment risk
  if (safeBuffer === 1) return 10;   // High risk
  if (safeBuffer === 2) return 3;    // Moderate risk
  return 1;                         // Safe
}

export function calculateStdDev(arr) {
  if (arr.length <= 1) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}
