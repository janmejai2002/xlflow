/**
 * Working out which term the student is actually in.
 *
 * The ERP returns every course ever enrolled in, across every term, all with
 * courseStatus "Open" and isActive true — so neither of those distinguishes the
 * current term from a finished one. Three signals do, in order of trust:
 *
 *   1. startDate / endDate on the course offer. Term 5 runs 2026-09-11 to
 *      2026-11-19, Term 6 starts 2026-12-14. If today falls inside a window,
 *      that is the term, full stop.
 *   2. Between terms, the soonest term that has not ended yet.
 *   3. The timetable, but only when no dates are available at all — a cached
 *      schedule outlives its term and will happily pin you to a finished one.
 *   4. The highest term number present. Last resort, and the reason this module
 *      exists: on its own it picks Term 6 in September, three months early.
 */

export function termNumberOf(course) {
  if (!course) return null;
  if (Number.isFinite(course.termNumber)) return course.termNumber;
  // Fall back to the free-text term name, then to the course-offer code suffix.
  const fromName = /Term[-\s]?(\d+)/i.exec(course.term || '');
  if (fromName) return Number(fromName[1]);
  const fromCode = /-(\d+)$/.exec(course.courseOfferCode || '');
  return fromCode ? Number(fromCode[1]) : null;
}

function withinWindow(course, todayStr) {
  if (!course.startDate || !course.endDate) return false;
  return course.startDate <= todayStr && todayStr <= course.endDate;
}

/**
 * @returns the term number the student is currently in, or null if unknowable.
 */
export function resolveCurrentTerm(courses = [], schedule = [], today = new Date()) {
  const withTerm = courses.filter((c) => termNumberOf(c) !== null);
  if (withTerm.length === 0) return null;

  const todayStr = today.toISOString().split('T')[0];

  // 1. A term whose date window contains today.
  const live = withTerm.filter((c) => withinWindow(c, todayStr)).map(termNumberOf);
  if (live.length > 0) return Math.max(...live);

  // 2. Between terms, the soonest term that has not ended yet. This is checked
  //    before the timetable because a cached schedule outlives its term and
  //    would otherwise pin the student to a term that finished weeks ago.
  const upcoming = withTerm.filter((c) => c.endDate && c.endDate >= todayStr).map(termNumberOf);
  if (upcoming.length > 0) return Math.min(...upcoming);

  // 3. No usable dates at all (older cached payloads): trust the timetable.
  const datesKnown = withTerm.some((c) => c.startDate && c.endDate);
  if (!datesKnown && schedule.length > 0) {
    const codesWithClasses = new Set(schedule.map((s) => s.courseCode).filter(Boolean));
    const scheduled = withTerm.filter((c) => codesWithClasses.has(c.code)).map(termNumberOf);
    if (scheduled.length > 0) return Math.max(...scheduled);
  }

  // 4. Every term has ended — show the most recent one.
  return Math.max(...withTerm.map(termNumberOf));
}

export function isCurrentTerm(course, currentTerm) {
  if (currentTerm === null) return true;
  return termNumberOf(course) === currentTerm;
}

/**
 * Current-term start date (YYYY-MM-DD), or null when the courses carry no dates.
 */
export function currentTermStart(courses = [], schedule = []) {
  const currentTerm = resolveCurrentTerm(courses, schedule);
  if (currentTerm === null) return null;
  return (
    courses
      .filter((c) => termNumberOf(c) === currentTerm && c.startDate)
      .map((c) => c.startDate)
      .sort()[0] || null
  );
}

/**
 * Drop activities belonging to a term that has already finished.
 *
 * The ERP's /class-activities/my returns every activity the student has ever
 * had, so a Term-5 student otherwise opens the app to last term's quizzes
 * sitting permanently "overdue".
 *
 * Preferred rule is the current term's start date. Payloads cached before the
 * app started recording course dates have no term to work from, so those fall
 * back to a plain staleness cutoff — a deadline more than STALE_DAYS past is not
 * something anyone can still act on.
 */
const STALE_DAYS = 30;

export function filterCurrentDeadlines(deadlines = [], courses = [], schedule = [], today = new Date()) {
  const dayOf = (d) => String(d && d.dueDate ? d.dueDate : '').split('T')[0];

  const termStart = currentTermStart(courses, schedule);
  if (termStart) return deadlines.filter((d) => !dayOf(d) || dayOf(d) >= termStart);

  const cutoff = new Date(today.getTime() - STALE_DAYS * 86400000).toISOString().split('T')[0];
  return deadlines.filter((d) => !dayOf(d) || dayOf(d) >= cutoff);
}
